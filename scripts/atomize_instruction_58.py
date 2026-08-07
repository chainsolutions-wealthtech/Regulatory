#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ID = "INSTRUCTION_58_CREPMF_2019"
SOURCE_PREFIX = "INST058"
TEXT = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.txt"
METADATA = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.metadata.json"
BLOCKS = ROOT / "regulatory" / "requirements" / "INST058_ARTICLE_BLOCKS_V0_1.json"
ATOMS = ROOT / "regulatory" / "requirements" / "INST058_ARTICLE_ATOMS_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST058_ATOMIZATION_VALIDATION_V0_1.json"

ARTICLE_RE = re.compile(
    r"^\s*(?:ARTICLE|Article|article|ATICLE|Aticle|aticle)\s+"
    r"(?P<label>PREMIER|Premier|premier|1ER|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<title>.*)$"
)


@dataclass(frozen=True)
class Heading:
    number: int
    page: int
    line: int
    raw: str
    title: str | None


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" :-–—.\t")


def number_from_label(label: str) -> int:
    return 1 if label.lower() in {"premier", "1er"} else int(label)


def split_pages(text: str, expected: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected:
        raise RuntimeError(f"TEXT_PAGE_SPLIT_MISMATCH:{len(pages)} != {expected}")
    return pages


def next_title(lines: list[str], start: int) -> str | None:
    for line in lines[start:start + 3]:
        value = normalize(line)
        if value and len(value) <= 200 and not value.lower().startswith(("avenue ", "tél", "tel", "fax")):
            return value
    return None


def headings(pages: list[str]) -> list[Heading]:
    found: dict[int, list[Heading]] = {}
    for page_no, page in enumerate(pages, start=1):
        lines = page.splitlines()
        for idx, line in enumerate(lines):
            match = ARTICLE_RE.match(line)
            if not match:
                continue
            number = number_from_label(match.group("label"))
            title = normalize(match.group("title")) or next_title(lines, idx + 1)
            item = Heading(number, page_no, idx + 1, normalize(line), title)
            found.setdefault(number, []).append(item)
    selected = [max(items, key=lambda item: (item.page, item.line)) for _, items in sorted(found.items())]
    numbers = [item.number for item in selected]
    if numbers != list(range(1, 36)):
        raise RuntimeError(f"ARTICLE_SEQUENCE_INVALID:{numbers}")
    return selected


def article_text(pages: list[str], current: Heading, next_heading: Heading | None) -> tuple[str, int]:
    chunks: list[str] = []
    end_page = next_heading.page if next_heading else len(pages)
    for page_no in range(current.page, end_page + 1):
        lines = pages[page_no - 1].splitlines()
        start = current.line - 1 if page_no == current.page else 0
        end = next_heading.line - 1 if next_heading and page_no == next_heading.page else len(lines)
        chunks.extend(lines[start:end])
    text = "\n".join(chunks).strip()
    return text, end_page


def main() -> None:
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    source_sha = metadata["sha256"]
    text = TEXT.read_text(encoding="utf-8")
    pages = split_pages(text, int(metadata["pageCount"]))
    index = headings(pages)

    blocks: list[dict[str, object]] = []
    atoms: list[dict[str, object]] = []
    for position, heading in enumerate(index):
        nxt = index[position + 1] if position + 1 < len(index) else None
        body, end_page = article_text(pages, heading, nxt)
        body_sha = hashlib.sha256(body.encode("utf-8")).hexdigest()
        article_id = f"{SOURCE_PREFIX}_ARTICLE_{heading.number:03d}"
        block_id = f"{SOURCE_PREFIX}_ART{heading.number:03d}_BLOCK001"
        atom_id = f"{SOURCE_PREFIX}_ART{heading.number:03d}_ATOM001"
        blocks.append({
            "id": block_id,
            "sourceId": SOURCE_ID,
            "sourceSha256": source_sha,
            "articleId": article_id,
            "articleNumber": heading.number,
            "sourcePages": list(range(heading.page, end_page + 1)),
            "headingCandidate": heading.raw,
            "titleCandidate": heading.title,
            "sourceTextCandidate": body,
            "sourceTextSha256": body_sha,
            "extractionStatus": "OCR_EXTRACTED_UNVERIFIED",
            "legalReviewStatus": "PENDING",
            "complianceReviewStatus": "PENDING",
            "activation": "FORBIDDEN",
        })
        atoms.append({
            "id": atom_id,
            "sourceId": SOURCE_ID,
            "sourceSha256": source_sha,
            "articleId": article_id,
            "articleNumber": heading.number,
            "sourceBlockId": block_id,
            "sourcePages": list(range(heading.page, end_page + 1)),
            "sourceTextSha256": body_sha,
            "titleCandidate": heading.title,
            "summaryCandidate": None,
            "normativeClassification": "PENDING_HUMAN_REVIEW",
            "applicability": "PENDING_HUMAN_REVIEW",
            "canonicalFields": [],
            "evidenceRequirements": [],
            "reviewRoles": ["LEGAL", "COMPLIANCE"],
            "legalReviewStatus": "PENDING",
            "complianceReviewStatus": "PENDING",
            "status": "EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
            "activation": "FORBIDDEN",
            "provenance": {
                "sourceArtifact": f"regulatory/materialized/{SOURCE_ID}.pdf",
                "ocrDerivative": f"regulatory/materialized/{SOURCE_ID}.txt",
                "textQuality": "OCR_EXTRACTED_UNVERIFIED",
            },
        })

    blocks_payload = {
        "schemaVersion": "INST058_ARTICLE_BLOCKS_V0_1",
        "sourceId": SOURCE_ID,
        "sourceSha256": source_sha,
        "status": "OCR_EXTRACTED_UNVERIFIED_PENDING_REVIEW",
        "activation": "FORBIDDEN",
        "articleBlockCount": len(blocks),
        "blocks": blocks,
    }
    atoms_payload = {
        "schemaVersion": "INST058_ARTICLE_ATOMS_V0_1",
        "sourceId": SOURCE_ID,
        "sourceSha256": source_sha,
        "status": "EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        "activation": "FORBIDDEN",
        "articleAtomCount": len(atoms),
        "atoms": atoms,
    }
    BLOCKS.write_text(json.dumps(blocks_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ATOMS.write_text(json.dumps(atoms_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ids = [atom["id"] for atom in atoms]
    validation = {
        "validationId": "INST058_ATOMIZATION_VALIDATION_V0_1",
        "status": "PASS" if len(blocks) == 35 and len(atoms) == 35 and len(ids) == len(set(ids)) else "FAIL",
        "sourceId": SOURCE_ID,
        "checks": {
            "sourceSha256Propagated": all(item["sourceSha256"] == source_sha for item in blocks + atoms),
            "all35ArticlesBlocked": len(blocks) == 35,
            "all35ArticlesAtomized": len(atoms) == 35,
            "atomIdsUnique": len(ids) == len(set(ids)),
            "articleRangeContinuous": [item["articleNumber"] for item in atoms] == list(range(1, 36)),
            "allAtomsInactive": all(item["activation"] == "FORBIDDEN" for item in atoms),
            "dualReviewRequired": all(item["reviewRoles"] == ["LEGAL", "COMPLIANCE"] for item in atoms),
            "explicitReviewStatesPending": all(
                item["legalReviewStatus"] == "PENDING" and item["complianceReviewStatus"] == "PENDING"
                for item in atoms
            ),
            "sourceTextDigestsPresent": all(len(item["sourceTextSha256"]) == 64 for item in blocks),
            "ocrNeverPromotedToNormativeTruth": all(item["normativeClassification"] == "PENDING_HUMAN_REVIEW" for item in atoms),
        },
        "metrics": {
            "articleBlockCount": len(blocks),
            "articleAtomCount": len(atoms),
            "firstArticle": atoms[0]["articleNumber"] if atoms else None,
            "lastArticle": atoms[-1]["articleNumber"] if atoms else None,
        },
        "outputs": [
            "regulatory/requirements/INST058_ARTICLE_BLOCKS_V0_1.json",
            "regulatory/requirements/INST058_ARTICLE_ATOMS_V0_1.json",
        ],
        "caveat": "Structural atomization only; normative meaning and applicability require legal and compliance review.",
    }
    validation["status"] = "PASS" if all(validation["checks"].values()) else "FAIL"
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    if validation["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
