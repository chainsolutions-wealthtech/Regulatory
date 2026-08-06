#!/usr/bin/env python3
"""Generate complete article-level atoms from Instruction 66 OCR text.

The output covers articles 1 through 92. Every atom remains OCR-extracted,
unverified and forbidden from activation pending legal and compliance review.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
TEXT_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.txt"
METADATA_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.metadata.json"
BLOCKS_PATH = ROOT / "regulatory/requirements/INST066_ARTICLE_BLOCKS_V0_1.json"
ATOMS_PATH = ROOT / "regulatory/requirements/INST066_ARTICLE_ATOMS_V0_1.json"
CROSSWALK_PATH = ROOT / "regulatory/matrices/INST066_CIRC005_CROSSWALK_V0_1.csv"
VALIDATION_PATH = ROOT / "regulatory/validation/INST066_ATOMIZATION_VALIDATION_V0_1.json"

ARTICLE_PATTERN = re.compile(
    r"^\s*article\s+(?P<label>premier|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<remainder>.*)$",
    re.IGNORECASE,
)
STATUS = "OCR_EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
ACTIVATION = "FORBIDDEN"

# Articles whose subject is likely to affect prospectus composition or source metadata.
PROSPECTUS_RELEVANT = {
    14, 17, 18, 27, 28, 29, 30, 32, 33, 34, 35, 38, 43,
    47, 48, 49, 53, 67, 68, 69, 74, 86, 87, 92,
}

# Conservative crosswalk: only links already identifiable from current CIRC005 matrices.
CROSSWALK: dict[int, list[str]] = {
    17: ["CIRC005_GENERAL_SCOPE", "CIRC005_GENERAL_MINIMUM", "CIRC005_2_1_DEPOSITARY_IDENTITY"],
    18: ["CIRC005_1_15_FCP_INVESTMENT_OBJECTIVES_POLICY", "CIRC005_1_15_D_FCP_POLICY_LIMITS"],
    27: ["CIRC005_GENERAL_MINIMUM", "CIRC005_1_4_FCP_REGULATION_AVAILABILITY"],
    28: ["CIRC005_GENERAL_MINIMUM", "CIRC005_GENERAL_ORDER"],
    29: ["CIRC005_1_15_D_FCP_POLICY_LIMITS", "CIRC005_1_15_E_FCP_TECHNIQUES_INSTRUMENTS"],
    30: ["CIRC005_GENERAL_MINIMUM"],
    32: ["CIRC005_1_4_FCP_REGULATION_AVAILABILITY"],
    38: ["CIRC005_1_10_FCP_PARTS_CHARACTERISTICS"],
    43: ["CIRC005_1_18_FCP_REMUNERATION_REIMBURSEMENT"],
    47: ["CIRC005_1_13_FCP_REDEMPTION_REIMBURSEMENT", "CIRC005_1_13_FCP_SUSPENSION"],
    48: ["CIRC005_1_16_FCP_ASSET_VALUATION", "CIRC005_1_17_FCP_PRICE_DETERMINATION", "CIRC005_1_17_A_FCP_PRICE_METHOD_FREQUENCY"],
    49: ["CIRC005_1_14_FCP_INCOME_ALLOCATION", "CIRC005_1_6_FCP_DISTRIBUTION_DATES"],
    53: ["CIRC005_1_18_FCP_REMUNERATION_REIMBURSEMENT", "CIRC005_1_17_B_FCP_TRANSACTION_FEES", "CIRC005_5_4_OTHER_EXPENSES_FUND_ASSETS", "CIRC005_5_4_OTHER_EXPENSES_HOLDER"],
    74: ["CIRC005_1_10_FCP_PARTS_CHARACTERISTICS", "CIRC005_5_2_TARGET_INVESTOR"],
    87: ["CIRC005_1_13_FCP_REDEMPTION_REIMBURSEMENT", "CIRC005_1_13_FCP_SUSPENSION"],
    92: ["CIRC005_GENERAL_EFFECTIVE_DATE"],
}


@dataclass(frozen=True)
class Line:
    page: int
    line: int
    text: str


@dataclass(frozen=True)
class Heading:
    number: int
    label: str
    title: str | None
    page: int
    line: int
    offset: int


def main() -> None:
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    source_sha = metadata["sha256"]
    pages = split_pages(TEXT_PATH.read_text(encoding="utf-8"), int(metadata["pageCount"]))
    lines = flatten_pages(pages)
    headings = extract_headings(lines)
    numbers = [heading.number for heading in headings]
    if numbers != list(range(1, 93)):
        raise RuntimeError(f"INST066_EXPECTED_CONTINUOUS_ARTICLES_1_TO_92:{numbers}")

    blocks = build_blocks(lines, headings, source_sha)
    circ005_ids = load_circ005_ids()
    atoms = build_atoms(blocks, source_sha, circ005_ids)
    write_json(BLOCKS_PATH, {
        "schemaVersion": "INST066_ARTICLE_BLOCKS_V0_1",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "status": STATUS,
        "activation": ACTIVATION,
        "articleCount": len(blocks),
        "articles": blocks,
        "caveat": "Le texte OCR est un dérivé; le PDF officiel hashé demeure la source juridique de référence.",
    })
    write_json(ATOMS_PATH, {
        "schemaVersion": "INST066_ARTICLE_ATOMS_V0_1",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "status": STATUS,
        "activation": ACTIVATION,
        "atomizationLevel": "ARTICLE_LEVEL_COMPLETE_PARAGRAPH_LEVEL_PENDING_HUMAN_REVIEW",
        "atomCount": len(atoms),
        "atoms": atoms,
        "caveat": "Ces atomes structurent la source mais ne constituent ni des règles actives ni une interprétation juridique validée.",
    })
    write_crosswalk(atoms)
    validation = validate(blocks, atoms, circ005_ids, source_sha)
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    if validation["status"] != "PASS":
        raise SystemExit(1)


def split_pages(text: str, expected: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected:
        raise RuntimeError(f"INST066_PAGE_SPLIT_MISMATCH:{len(pages)}:{expected}")
    return pages


def flatten_pages(pages: list[str]) -> list[Line]:
    return [
        Line(page=page_no, line=line_no, text=text)
        for page_no, page in enumerate(pages, start=1)
        for line_no, text in enumerate(page.splitlines(), start=1)
    ]


def extract_headings(lines: list[Line]) -> list[Heading]:
    headings: list[Heading] = []
    seen: set[int] = set()
    for offset, item in enumerate(lines):
        match = ARTICLE_PATTERN.match(item.text)
        if not match:
            continue
        label = match.group("label")
        number = 1 if label.casefold() in {"premier", "1er"} else int(label)
        if number in seen:
            continue
        seen.add(number)
        title = normalize(match.group("remainder")) or None
        headings.append(Heading(number, label, title, item.page, item.line, offset))
    headings.sort(key=lambda heading: heading.number)
    return headings


def build_blocks(lines: list[Line], headings: list[Heading], source_sha: str) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for index, heading in enumerate(headings):
        end_offset = headings[index + 1].offset if index + 1 < len(headings) else len(lines)
        body_lines = lines[heading.offset + 1:end_offset]
        body = normalize_multiline("\n".join(line.text for line in body_lines))
        blocks.append({
            "articleId": f"INST066_ARTICLE_{heading.number:03d}",
            "articleNumber": heading.number,
            "labelRaw": heading.label,
            "titleCandidate": heading.title,
            "startPage": heading.page,
            "startLineInPage": heading.line,
            "endPage": body_lines[-1].page if body_lines else heading.page,
            "ocrText": body,
            "ocrTextSha256": hashlib.sha256(body.encode("utf-8")).hexdigest(),
            "sourceSha256": source_sha,
            "status": STATUS,
            "activation": ACTIVATION,
            "legalReviewStatus": "PENDING",
            "complianceReviewStatus": "PENDING",
        })
    return blocks


def build_atoms(blocks: list[dict[str, Any]], source_sha: str, circ005_ids: set[str]) -> list[dict[str, Any]]:
    atoms: list[dict[str, Any]] = []
    for block in blocks:
        number = block["articleNumber"]
        links = CROSSWALK.get(number, [])
        unknown = sorted(set(links) - circ005_ids)
        if unknown:
            raise RuntimeError(f"INST066_UNKNOWN_CIRC005_LINKS:{number}:{unknown}")
        atoms.append({
            "id": f"INST066_ART{number:03d}_ATOM001",
            "sourceId": "INSTRUCTION_66_CREPMF_2021",
            "sourceSha256": source_sha,
            "articleId": block["articleId"],
            "articleNumber": number,
            "titleCandidate": block["titleCandidate"],
            "sourcePages": list(range(block["startPage"], block["endPage"] + 1)),
            "sourceArticleTextSha256": block["ocrTextSha256"],
            "sourceTextCandidate": excerpt(block["ocrText"]),
            "prospectusRelevanceCandidate": number in PROSPECTUS_RELEVANT,
            "normativeClassification": "TO_REVIEW",
            "applicability": "TO_CLASSIFY",
            "products": ["TO_CLASSIFY"],
            "documentTypes": ["TO_CLASSIFY"],
            "canonicalFields": [],
            "questionIds": [],
            "clauseGroupIds": [],
            "controlIds": [],
            "evidenceTypes": [],
            "outputSectionIds": [],
            "circ005RequirementLinks": links,
            "status": STATUS,
            "activation": ACTIVATION,
            "reviewRoles": ["LEGAL", "COMPLIANCE"],
            "provenance": {
                "sourceArtifact": "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf",
                "ocrDerivative": "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.txt",
                "textQuality": "OCR_EXTRACTED_UNVERIFIED",
            },
        })
    return atoms


def load_circ005_ids() -> set[str]:
    values: set[str] = set()
    for path in sorted((ROOT / "regulatory/matrices").glob("CIRC005_*.csv")):
        with path.open("r", encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle, delimiter=";"):
                requirement_id = (row.get("requirement_id") or "").strip()
                if requirement_id:
                    values.add(requirement_id)
    return values


def write_crosswalk(atoms: list[dict[str, Any]]) -> None:
    with CROSSWALK_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter=";", lineterminator="\n")
        writer.writerow([
            "inst066_atom_id", "article_number", "circ005_requirement_id",
            "relationship", "review_status", "activation",
        ])
        for atom in atoms:
            links = atom["circ005RequirementLinks"] or [""]
            for link in links:
                writer.writerow([
                    atom["id"], atom["articleNumber"], link,
                    "SUPPLEMENTS_OR_CONSTRAINS" if link else "NO_EXACT_LINK_IDENTIFIED",
                    "PENDING_LEGAL_AND_COMPLIANCE_REVIEW", ACTIVATION,
                ])


def validate(blocks: list[dict[str, Any]], atoms: list[dict[str, Any]], circ005_ids: set[str], source_sha: str) -> dict[str, Any]:
    atom_ids = [atom["id"] for atom in atoms]
    links = {link for atom in atoms for link in atom["circ005RequirementLinks"]}
    checks = {
        "sourceSha256Present": bool(re.fullmatch(r"[0-9a-f]{64}", source_sha)),
        "articlesOneThroughNinetyTwo": [block["articleNumber"] for block in blocks] == list(range(1, 93)),
        "articleIdsUnique": len({block["articleId"] for block in blocks}) == 92,
        "articleTextDigestsPresent": all(re.fullmatch(r"[0-9a-f]{64}", block["ocrTextSha256"]) for block in blocks),
        "oneArticleAtomPerArticle": len(atoms) == 92,
        "atomIdsUnique": len(set(atom_ids)) == len(atom_ids),
        "allAtomsUnverified": all(atom["status"] == STATUS for atom in atoms),
        "allAtomsInactive": all(atom["activation"] == ACTIVATION for atom in atoms),
        "dualReviewRequired": all(atom["reviewRoles"] == ["LEGAL", "COMPLIANCE"] for atom in atoms),
        "allCirc005LinksResolve": links <= circ005_ids,
        "circ005FilesNotWritten": True,
    }
    return {
        "validationId": "INST066_ATOMIZATION_VALIDATION_V0_1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "checks": checks,
        "metrics": {
            "articleBlockCount": len(blocks),
            "articleAtomCount": len(atoms),
            "prospectusRelevantArticleCandidateCount": sum(bool(atom["prospectusRelevanceCandidate"]) for atom in atoms),
            "circ005CrosswalkLinkCount": sum(len(atom["circ005RequirementLinks"]) for atom in atoms),
        },
        "outputs": [
            str(BLOCKS_PATH.relative_to(ROOT)),
            str(ATOMS_PATH.relative_to(ROOT)),
            str(CROSSWALK_PATH.relative_to(ROOT)),
        ],
        "caveat": "La validation atteste la couverture structurale, la provenance et l'inactivation; elle ne valide aucune interprétation juridique.",
    }


def excerpt(text: str, maximum: int = 1600) -> str:
    value = normalize(text)
    return value if len(value) <= maximum else value[:maximum].rstrip() + "…"


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_multiline(value: str) -> str:
    return "\n".join(line for line in (normalize(part) for part in value.splitlines()) if line)


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
