#!/usr/bin/env python3
"""Rebuild the Instruction 66 article index from page-scoped OCR text.

This script is deliberately independent from binary materialization. It accepts
OCR only as unverified extraction evidence, requires Article premier, reports
all duplicate heading occurrences and forbids requirement activation.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, replace
from pathlib import Path

SOURCE_ID = "INSTRUCTION_66_CREPMF_2021"
ROOT = Path(__file__).resolve().parents[1]
TEXT_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.txt"
METADATA_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.metadata.json"
INDEX_PATH = ROOT / "regulatory/requirements/INST066_ARTICLE_INDEX_V0_1.yaml"
VALIDATION_PATH = ROOT / "regulatory/validation/INST066_MATERIALIZATION_VALIDATION_V0_1.json"
ARTICLE_PATTERN = re.compile(
    r"^\s*article\s+(?P<label>premier|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<remainder>.*)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Candidate:
    sequence: int
    number: int
    label_raw: str
    heading_raw: str
    title_candidate: str | None
    page: int
    line: int
    toc_like: bool

    @property
    def article_id(self) -> str:
        return f"INST066_ARTICLE_{self.number:03d}"


def main() -> None:
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    page_count = int(metadata["pageCount"])
    pages = split_pages(TEXT_PATH.read_text(encoding="utf-8"), page_count)
    raw = extract_candidates(pages)
    selected, duplicates = select_candidates(raw)
    numbers = [candidate.number for candidate in selected]
    maximum = max(numbers, default=0)
    missing = [number for number in range(1, maximum + 1) if number not in set(numbers)]
    non_monotonic = find_non_monotonic(selected)

    if not selected or selected[0].number != 1:
        raise RuntimeError("INST066_ARTICLE_PREMIER_NOT_INDEXED")
    if missing:
        raise RuntimeError(f"INST066_ARTICLE_NUMBER_GAPS:{missing}")
    if non_monotonic:
        raise RuntimeError(f"INST066_ARTICLE_ORDER_INVALID:{non_monotonic}")

    write_index(selected, metadata)
    metadata["rawArticleCandidateCount"] = len(raw)
    metadata["articleIndexCount"] = len(selected)
    metadata["firstIndexedArticle"] = selected[0].number
    metadata["lastIndexedArticle"] = selected[-1].number
    metadata["duplicateArticleHeadingOccurrences"] = duplicates
    metadata["missingArticleNumbers"] = missing
    write_json(METADATA_PATH, metadata)

    validation["status"] = "PASS"
    validation["checks"]["articleCandidatesFound"] = bool(selected)
    validation["checks"]["articleIdsUnique"] = len({item.article_id for item in selected}) == len(selected)
    validation["checks"]["articleSequenceMonotonic"] = not non_monotonic
    validation["checks"]["articlePremierIndexed"] = selected[0].number == 1
    validation["checks"]["articleNumberRangeContinuous"] = not missing
    validation["checks"]["articleIndexStillUnverified"] = True
    validation["metrics"]["rawArticleCandidateCount"] = len(raw)
    validation["metrics"]["articleIndexCount"] = len(selected)
    validation["metrics"]["firstIndexedArticle"] = selected[0].number
    validation["metrics"]["lastIndexedArticle"] = selected[-1].number
    validation["reviewFlags"]["duplicateHeadingOccurrences"] = duplicates
    validation["reviewFlags"]["nonMonotonicArticles"] = non_monotonic
    validation["reviewFlags"]["missingArticleNumbers"] = missing
    validation["caveat"] = (
        "Source integrity and article-number continuity are validated. OCR wording, titles, "
        "paragraph boundaries, dates, applicability and normative meaning remain extracted "
        "unverified until legal and compliance review."
    )
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))


def split_pages(text: str, expected: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected:
        raise RuntimeError(f"INST066_TEXT_PAGE_COUNT_MISMATCH:{len(pages)}:{expected}")
    return pages


def extract_candidates(pages: list[str]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for page_number, page in enumerate(pages, start=1):
        lines = page.splitlines()
        for line_index, line in enumerate(lines, start=1):
            match = ARTICLE_PATTERN.match(line)
            if not match:
                continue
            label = match.group("label")
            number = 1 if label.casefold() in {"premier", "1er"} else int(label)
            remainder = normalize(match.group("remainder"))
            heading = normalize(line)
            title = remainder or next_title(lines, line_index)
            toc_like = bool(re.search(r"\.{3,}\s*[0-9]*\s*$", heading))
            candidates.append(
                Candidate(
                    sequence=len(candidates) + 1,
                    number=number,
                    label_raw=label,
                    heading_raw=heading,
                    title_candidate=title,
                    page=page_number,
                    line=line_index,
                    toc_like=toc_like,
                )
            )
    return candidates


def select_candidates(raw: list[Candidate]) -> tuple[list[Candidate], list[dict[str, object]]]:
    grouped: dict[int, list[Candidate]] = defaultdict(list)
    for candidate in raw:
        grouped[candidate.number].append(candidate)

    selected: list[Candidate] = []
    duplicates: list[dict[str, object]] = []
    for number, occurrences in grouped.items():
        chosen = max(occurrences, key=score)
        selected.append(chosen)
        if len(occurrences) > 1:
            duplicates.append(
                {
                    "articleId": chosen.article_id,
                    "selectedPage": chosen.page,
                    "occurrences": [
                        {
                            "page": item.page,
                            "line": item.line,
                            "headingRaw": item.heading_raw,
                            "tocLike": item.toc_like,
                        }
                        for item in occurrences
                    ],
                    "status": "REVIEW_REQUIRED",
                }
            )

    selected.sort(key=lambda item: (item.page, item.line))
    selected = [replace(item, sequence=index) for index, item in enumerate(selected, start=1)]
    duplicates.sort(key=lambda item: str(item["articleId"]))
    return selected, duplicates


def score(candidate: Candidate) -> tuple[int, int, int, int]:
    return (
        0 if candidate.toc_like else 1,
        1 if candidate.heading_raw.startswith("ARTICLE") else 0,
        candidate.page,
        candidate.line,
    )


def next_title(lines: list[str], one_based_line: int) -> str | None:
    collected: list[str] = []
    for line in lines[one_based_line : one_based_line + 4]:
        value = normalize(line)
        if not value:
            if collected:
                break
            continue
        if ARTICLE_PATTERN.match(value):
            break
        if re.match(r"^(?:TITRE|CHAPITRE|SECTION|SOUS[- ]SECTION)\b", value, re.IGNORECASE):
            break
        collected.append(value)
        if value.endswith((".", ":", ";")) or len(" ".join(collected)) >= 180:
            break
    result = " ".join(collected).strip()
    return result[:300] if result else None


def find_non_monotonic(selected: list[Candidate]) -> list[dict[str, int | str]]:
    anomalies: list[dict[str, int | str]] = []
    previous = 0
    for item in selected:
        if item.number < previous:
            anomalies.append(
                {
                    "articleId": item.article_id,
                    "page": item.page,
                    "previousNumber": previous,
                    "currentNumber": item.number,
                }
            )
        previous = item.number
    return anomalies


def write_index(selected: list[Candidate], metadata: dict[str, object]) -> None:
    extraction = metadata["extraction"]
    lines = [
        f"source_id: {SOURCE_ID}",
        "registry_version: 0.1.0",
        "status: EXTRACTED_UNVERIFIED_REVIEW_PENDING",
        "scope: UMOA_OPC_AND_MANAGEMENT_COMPANIES",
        "materialization:",
        f"  repository_copy: {yaml_value(metadata['repositoryCopy'])}",
        f"  sha256: {metadata['sha256']}",
        f"  byte_size: {metadata['byteSize']}",
        f"  page_count: {metadata['pageCount']}",
        f"  text_extraction_method: {yaml_value(extraction['method'])}",
        f"  ocr_used: {str(bool(extraction['ocrUsed'])).lower()}",
        "defaults:",
        "  source_status: SOURCE_MATERIALIZED",
        "  extraction_status: EXTRACTED_UNVERIFIED",
        "  review_status: PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        "  requirement_activation: FORBIDDEN_PENDING_REVIEW",
        "articles:",
    ]
    for item in selected:
        lines.extend(
            [
                f"- id: {item.article_id}",
                f"  seq: {item.sequence}",
                f"  article_number: {yaml_value(item.label_raw)}",
                f"  page: {item.page}",
                f"  line_number_in_page: {item.line}",
                f"  heading_raw: {yaml_value(item.heading_raw)}",
                f"  title_candidate: {yaml_value(item.title_candidate)}",
                "  products: [TO_CLASSIFY]",
                "  document_types: [TO_CLASSIFY]",
                "  applicability: TO_REVIEW",
                "  normative_status: TO_ATOMIZE",
                "  review_status: PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
                "  provenance:",
                f"    source_sha256: {metadata['sha256']}",
                f"    source_page: {item.page}",
                "    text_quality: OCR_EXTRACTED_UNVERIFIED",
            ]
        )
    INDEX_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def yaml_value(value: object) -> str:
    if value is None:
        return "null"
    return json.dumps(str(value), ensure_ascii=False)


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
