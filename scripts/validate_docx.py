#!/usr/bin/env python3
"""Validate the generated pre-compliance DOCX without external dependencies."""

from __future__ import annotations

import argparse
import hashlib
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

REQUIRED_PARTS = {
    "[Content_Types].xml",
    "_rels/.rels",
    "docProps/app.xml",
    "docProps/core.xml",
    "word/document.xml",
    "word/styles.xml",
    "word/settings.xml",
    "word/footer1.xml",
    "word/_rels/document.xml.rels",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--docx",
        default="examples/generated/united-capital-diamond/prospectus-draft.docx",
    )
    parser.add_argument(
        "--manifest",
        default="examples/generated/united-capital-diamond/docx-manifest.json",
    )
    args = parser.parse_args()

    docx_path = Path(args.docx)
    manifest_path = Path(args.manifest)
    if not docx_path.exists():
        raise SystemExit(f"DOCX not found: {docx_path}")
    if not manifest_path.exists():
        raise SystemExit(f"DOCX manifest not found: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    failures: list[str] = []

    with zipfile.ZipFile(docx_path) as archive:
        names = set(archive.namelist())
        missing_parts = sorted(REQUIRED_PARTS - names)
        if missing_parts:
            failures.append(f"Missing OOXML parts: {missing_parts}")

        for name in sorted(REQUIRED_PARTS & names):
            if name.endswith(".xml") or name.endswith(".rels"):
                try:
                    ET.fromstring(archive.read(name))
                except ET.ParseError as exc:
                    failures.append(f"Invalid XML in {name}: {exc}")

        document_xml = archive.read("word/document.xml").decode("utf-8")
        footer_xml = archive.read("word/footer1.xml").decode("utf-8")

    required_texts = [
        "Document de pré-conformité",
        "Annexe technique de traçabilité",
        "État de pré-conformité",
        "Prêt pour soumission",
        "ne constitue ni un agrément, ni un visa, ni une approbation",
    ]
    for required_text in required_texts:
        if required_text not in document_xml and required_text not in footer_xml:
            failures.append(f"Required wording not found: {required_text}")

    forbidden_texts = [
        "conforme à 100 %",
        "document approuvé par l’amf-umoa",
    ]
    if "Prêt pour soumission" not in document_xml or "Non" not in document_xml:
        failures.append("Submission readiness must be explicitly shown as Non")
    for forbidden in forbidden_texts:
        if forbidden in document_xml.lower():
            failures.append(f"Forbidden wording found: {forbidden}")

    table_row_count = document_xml.count("<w:tr>")
    cannot_split_count = document_xml.count("<w:cantSplit/>")
    if table_row_count == 0:
        failures.append("The DOCX must contain tables")
    if cannot_split_count < table_row_count:
        failures.append(
            f"Every table row must be protected from splitting: {cannot_split_count}/{table_row_count}"
        )
    if "• " not in document_xml:
        failures.append("Visible list bullet glyphs are missing")

    component_count = int(manifest.get("component_count", 0))
    traceability_rows = int(manifest.get("traceability_row_count", 0))
    if component_count <= 0:
        failures.append("DOCX manifest component_count must be positive")
    if component_count != traceability_rows:
        failures.append(
            f"Traceability rows ({traceability_rows}) must equal component count ({component_count})"
        )
    if manifest.get("ready_for_submission") is not False:
        failures.append("DOCX manifest ready_for_submission must remain false")
    if manifest.get("status") != "DRAFT_PRE_COMPLIANCE_REVIEW":
        failures.append("Unexpected DOCX status")
    if docx_path.stat().st_size < 5000:
        failures.append(f"DOCX is unexpectedly small: {docx_path.stat().st_size} bytes")

    actual_digest = hashlib.sha256(docx_path.read_bytes()).hexdigest()
    if manifest.get("docx_sha256") != actual_digest:
        failures.append("DOCX SHA-256 does not match docx-manifest.json")
    if int(manifest.get("docx_size_bytes", 0)) != docx_path.stat().st_size:
        failures.append("DOCX size does not match docx-manifest.json")

    result = {
        "docx": str(docx_path),
        "size_bytes": docx_path.stat().st_size,
        "sha256": actual_digest,
        "component_count": component_count,
        "traceability_row_count": traceability_rows,
        "table_row_count": table_row_count,
        "cannot_split_row_count": cannot_split_count,
        "required_parts": len(REQUIRED_PARTS),
        "status": "PASS" if not failures else "FAIL",
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
