#!/usr/bin/env python3
"""Generate a deterministic pre-compliance DOCX from document-model.json.

No external Python package is required. The output is a minimal OOXML package
with controlled styles, tables, warnings, footer and a traceability appendix.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

FIXED_ZIP_DATE = (1980, 1, 1, 0, 0, 0)
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        default="examples/generated/united-capital-diamond/document-model.json",
    )
    parser.add_argument(
        "--manifest",
        default="examples/generated/united-capital-diamond/generation-manifest.json",
    )
    parser.add_argument(
        "--output",
        default="examples/generated/united-capital-diamond/prospectus-draft.docx",
    )
    parser.add_argument(
        "--docx-manifest",
        default="examples/generated/united-capital-diamond/docx-manifest.json",
    )
    args = parser.parse_args()

    model_path = Path(args.model)
    generation_manifest_path = Path(args.manifest)
    output_path = Path(args.output)
    output_manifest_path = Path(args.docx_manifest)

    model = json.loads(model_path.read_text(encoding="utf-8"))
    generation_manifest = json.loads(generation_manifest_path.read_text(encoding="utf-8"))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    package = build_package(model, generation_manifest)
    write_deterministic_zip(output_path, package)

    document_xml = package["word/document.xml"]
    traceability_rows = sum(
        len(section.get("components", [])) for section in model.get("sections", [])
    )
    docx_manifest = {
        "generator": "scripts/generate_docx.py",
        "generator_version": "0.1.0",
        "source_generation_id": generation_manifest.get("generation_id"),
        "source_document_model_sha256": sha256_bytes(
            model_path.read_bytes()
        ),
        "docx_sha256": sha256_bytes(output_path.read_bytes()),
        "docx_size_bytes": output_path.stat().st_size,
        "section_count": len(model.get("sections", [])),
        "component_count": traceability_rows,
        "table_count": document_xml.count("<w:tbl>"),
        "heading_count": document_xml.count('w:val="Heading1"'),
        "traceability_row_count": traceability_rows,
        "status": "DRAFT_PRE_COMPLIANCE_REVIEW",
        "ready_for_submission": False,
        "caveat": (
            "Document de pré-conformité généré automatiquement. "
            "Il ne constitue ni un agrément, ni un visa, ni une approbation."
        ),
    }
    output_manifest_path.write_text(
        json.dumps(docx_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(docx_manifest, ensure_ascii=False, indent=2))


def build_package(model: dict, generation_manifest: dict) -> dict[str, str]:
    document_xml = build_document_xml(model, generation_manifest)
    return {
        "[Content_Types].xml": content_types_xml(),
        "_rels/.rels": package_relationships_xml(),
        "docProps/app.xml": app_properties_xml(),
        "docProps/core.xml": core_properties_xml(generation_manifest),
        "word/document.xml": document_xml,
        "word/styles.xml": styles_xml(),
        "word/settings.xml": settings_xml(),
        "word/footer1.xml": footer_xml(),
        "word/_rels/document.xml.rels": document_relationships_xml(),
    }


def build_document_xml(model: dict, generation_manifest: dict) -> str:
    body: list[str] = []
    title = infer_title(model)
    body.append(paragraph(title, style="Title"))
    body.append(
        paragraph(
            "Prospectus — document de travail de pré-conformité",
            style="Subtitle",
        )
    )
    body.append(
        warning_paragraph(
            "DOCUMENT DE TRAVAIL — Cette version générée automatiquement ne constitue "
            "ni un agrément, ni un visa, ni une approbation de l’AMF-UMOA."
        )
    )
    body.append(
        metadata_table(
            [
                ("Identifiant de génération", generation_manifest.get("generation_id", "—")),
                ("Pack réglementaire", generation_manifest.get("rule_pack", "—")),
                ("Version du pack", generation_manifest.get("rule_pack_version", "—")),
                ("Statut", generation_manifest.get("document_status", "—")),
                ("Prêt pour revue conformité", bool_label(generation_manifest.get("ready_for_compliance_review"))),
                ("Prêt pour soumission", bool_label(generation_manifest.get("ready_for_submission"))),
            ]
        )
    )
    body.append(page_break())

    for section in model.get("sections", []):
        body.append(paragraph(section.get("title", "Section"), style="Heading1"))
        for component in section.get("components", []):
            body.extend(render_component(component))

    body.append(page_break())
    body.append(paragraph("Annexe technique de traçabilité", style="Heading1"))
    body.append(
        paragraph(
            "Cette annexe relie chaque composant généré à ses exigences, sa clause et son statut de revue. "
            "Elle est destinée aux fonctions conformité, juridique, risques et audit.",
            style="Normal",
        )
    )
    body.append(traceability_table(model))

    body.append(page_break())
    body.append(paragraph("État de pré-conformité", style="Heading1"))
    coverage = generation_manifest.get("coverage_counts", {})
    control_rows = [
        ("Exigences analysées", generation_manifest.get("requirement_count", "—")),
        ("Couvertes dans le prospectus", coverage.get("IN_PROSPECTUS", 0)),
        ("En attente de revue", coverage.get("PENDING_REVIEW", 0)),
        ("Manquantes", coverage.get("MISSING", 0)),
        ("Non applicables", coverage.get("NOT_APPLICABLE", 0)),
        ("Métadonnées système", coverage.get("SYSTEM_METADATA", 0)),
        ("Prêt pour revue conformité", bool_label(generation_manifest.get("ready_for_compliance_review"))),
        ("Prêt pour soumission", bool_label(generation_manifest.get("ready_for_submission"))),
    ]
    body.append(metadata_table(control_rows))
    body.append(
        warning_paragraph(
            "Zéro exigence manquante ne vaut ni validation juridique, ni validation conformité, "
            "ni décision du régulateur. Les rubriques PENDING_REVIEW doivent être confirmées."
        )
    )

    sect_pr = (
        "<w:sectPr>"
        '<w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
        'w:header="567" w:footer="567" w:gutter="0"/>'
        '<w:footerReference w:type="default" r:id="rIdFooter1"/>'
        "</w:sectPr>"
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W_NS}" xmlns:r="{R_NS}">'
        f"<w:body>{''.join(body)}{sect_pr}</w:body>"
        "</w:document>"
    )


def render_component(component: dict) -> list[str]:
    content = str(component.get("content", "")).strip()
    component_type = component.get("type", "PARAGRAPH")
    if not content:
        return []
    if component_type == "TABLE":
        return [markdown_table_to_ooxml(content)]
    if component_type == "LIST":
        result: list[str] = []
        for line in content.splitlines():
            clean = re.sub(r"^-\s*", "", line).strip()
            if clean:
                result.append(paragraph(strip_markdown(clean), style="ListBullet"))
        return result
    if component_type == "WARNING":
        return [warning_paragraph(strip_markdown(content))]
    return [paragraph(strip_markdown(content), style="Normal")]


def paragraph(text: str, style: str = "Normal", bold: bool = False) -> str:
    safe = escape(str(text))
    run_properties = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return (
        "<w:p>"
        f'<w:pPr><w:pStyle w:val="{escape(style)}"/></w:pPr>'
        f"<w:r>{run_properties}<w:t xml:space=\"preserve\">{safe}</w:t></w:r>"
        "</w:p>"
    )


def warning_paragraph(text: str) -> str:
    return (
        "<w:p>"
        '<w:pPr><w:pStyle w:val="Warning"/></w:pPr>'
        '<w:r><w:rPr><w:b/></w:rPr><w:t>AVERTISSEMENT — </w:t></w:r>'
        f'<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r>'
        "</w:p>"
    )


def page_break() -> str:
    return "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>"


def metadata_table(rows: list[tuple[str, object]]) -> str:
    table_rows = [[str(label), str(value)] for label, value in rows]
    return table_ooxml([["Champ", "Valeur"], *table_rows], header=True, widths=[3000, 6000])


def traceability_table(model: dict) -> str:
    rows = [["Composant", "Section", "Exigences", "Clause", "Statut de revue"]]
    for section in model.get("sections", []):
        for component in section.get("components", []):
            rows.append(
                [
                    component.get("component_id", "—"),
                    section.get("title", section.get("id", "—")),
                    ", ".join(component.get("requirement_ids", [])) or "—",
                    component.get("clause_id", "—") or "—",
                    component.get("review_status", "—"),
                ]
            )
    return table_ooxml(rows, header=True, widths=[1300, 2300, 3200, 1800, 1700])


def markdown_table_to_ooxml(markdown: str) -> str:
    rows: list[list[str]] = []
    for line in markdown.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [cell.strip().replace("\\|", "|") for cell in stripped.strip("|").split("|")]
        if cells and all(re.fullmatch(r"-+", cell) for cell in cells):
            continue
        rows.append([strip_markdown(cell) for cell in cells])
    if not rows:
        return paragraph(strip_markdown(markdown))
    column_count = max(len(row) for row in rows)
    widths = [max(1200, 9000 // column_count)] * column_count
    normalized = [row + [""] * (column_count - len(row)) for row in rows]
    return table_ooxml(normalized, header=True, widths=widths)


def table_ooxml(rows: list[list[str]], header: bool, widths: list[int]) -> str:
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    rendered_rows: list[str] = []
    for row_index, row in enumerate(rows):
        cells: list[str] = []
        for column_index, value in enumerate(row):
            width = widths[min(column_index, len(widths) - 1)]
            fill = "D9EAF7" if header and row_index == 0 else "FFFFFF"
            bold = header and row_index == 0
            cell = (
                "<w:tc>"
                f'<w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>'
                f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
                '<w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>'
                '<w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>'
                "</w:tcPr>"
                + paragraph(str(value), style="TableText", bold=bold)
                + "</w:tc>"
            )
            cells.append(cell)
        tr_pr = "<w:trPr><w:tblHeader/></w:trPr>" if header and row_index == 0 else ""
        rendered_rows.append(f"<w:tr>{tr_pr}{''.join(cells)}</w:tr>")
    return (
        "<w:tbl>"
        "<w:tblPr>"
        '<w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblLayout w:type="fixed"/>'
        "</w:tblPr>"
        f"<w:tblGrid>{grid}</w:tblGrid>"
        f"{''.join(rendered_rows)}"
        "</w:tbl>"
        "<w:p/>"
    )


def strip_markdown(text: str) -> str:
    value = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    value = re.sub(r"`(.*?)`", r"\1", value)
    return value.replace("\\|", "|").strip()


def infer_title(model: dict) -> str:
    for section in model.get("sections", []):
        for component in section.get("components", []):
            content = str(component.get("content", ""))
            match = re.search(r"dénommé «\s*([^»]+)\s*»", content)
            if match:
                return match.group(1)
    return "Prospectus FCP"


def bool_label(value: object) -> str:
    return "Oui" if value is True else "Non"


def footer_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:ftr xmlns:w="{W_NS}">'
        "<w:p><w:pPr><w:jc w:val=\"center\"/></w:pPr>"
        "<w:r><w:rPr><w:sz w:val=\"16\"/><w:color w:val=\"666666\"/></w:rPr>"
        "<w:t>Document de pré-conformité — non visé, non approuvé, non soumis</w:t></w:r>"
        "</w:p></w:ftr>"
    )


def styles_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{W_NS}">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:before="900" w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="17365D"/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr><w:rPr><w:i/><w:color w:val="4F81BD"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pageBreakBefore w:val="0"/><w:spacing w:before="360" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="17365D"/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Warning"><w:name w:val="Warning"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="FFF2CC"/><w:ind w:left="240" w:right="240"/><w:spacing w:before="120" w:after="180"/></w:pPr><w:rPr><w:color w:val="7F6000"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="540" w:hanging="240"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="220" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="17"/></w:rPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B4C6E7"/><w:left w:val="single" w:sz="4" w:color="B4C6E7"/><w:bottom w:val="single" w:sz="4" w:color="B4C6E7"/><w:right w:val="single" w:sz="4" w:color="B4C6E7"/><w:insideH w:val="single" w:sz="4" w:color="D9E2F3"/><w:insideV w:val="single" w:sz="4" w:color="D9E2F3"/></w:tblBorders></w:tblPr></w:style>
</w:styles>'''


def settings_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="{W_NS}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:updateFields w:val="true"/></w:settings>'''


def content_types_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''


def package_relationships_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''


def document_relationships_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>'''


def core_properties_xml(generation_manifest: dict) -> str:
    generation_id = escape(str(generation_manifest.get("generation_id", "unknown")))
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Prospectus FCP — document de pré-conformité</dc:title>
  <dc:subject>{generation_id}</dc:subject>
  <dc:creator>Regulatory Prospectus Composer</dc:creator>
  <cp:lastModifiedBy>Regulatory Prospectus Composer</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-08-05T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-05T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''


def app_properties_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Regulatory Prospectus Composer</Application>
  <AppVersion>0.1.0</AppVersion>
</Properties>'''


def write_deterministic_zip(path: Path, package: dict[str, str]) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(package):
            info = zipfile.ZipInfo(name, FIXED_ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            info.create_system = 3
            archive.writestr(info, package[name].encode("utf-8"))


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


if __name__ == "__main__":
    main()
