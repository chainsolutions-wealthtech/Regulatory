#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ID = "INSTRUCTION_58_CREPMF_2019"
TEXT = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.txt"
METADATA = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.metadata.json"
INDEX = ROOT / "regulatory" / "requirements" / "INST058_ARTICLE_INDEX_V0_1.yaml"
VALIDATION = ROOT / "regulatory" / "validation" / "INST058_MATERIALIZATION_VALIDATION_V0_1.json"

# 'Aticle' is an observed OCR error on Article 29 of the hashed official source.
ARTICLE_RE = re.compile(
    r"^\s*(?:ARTICLE|Article|article|ATICLE|Aticle|aticle)\s+"
    r"(?P<label>PREMIER|Premier|premier|1ER|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<title>.*)$"
)


@dataclass(frozen=True)
class Article:
    number: int
    label_raw: str
    page: int
    line: int
    heading: str
    title: str | None
    text_sha256: str

    @property
    def article_id(self) -> str:
        return f"INST058_ARTICLE_{self.number:03d}"


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" :-–—.\t")


def number_from_label(label: str) -> int:
    if label.lower() in {"premier", "1er"}:
        return 1
    return int(label)


def pages_from_text(text: str, expected_pages: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected_pages:
        raise RuntimeError(f"TEXT_PAGE_SPLIT_MISMATCH:{len(pages)} != {expected_pages}")
    return pages


def next_title(lines: list[str], start: int) -> str | None:
    for line in lines[start:start + 3]:
        candidate = normalize(line)
        if candidate and len(candidate) <= 200 and not candidate.lower().startswith(("avenue ", "tél", "tel", "fax")):
            return candidate
    return None


def scan(pages: list[str]) -> list[Article]:
    raw: list[Article] = []
    for page_no, page in enumerate(pages, start=1):
        lines = page.splitlines()
        for idx, line in enumerate(lines):
            match = ARTICLE_RE.match(line)
            if not match:
                continue
            number = number_from_label(match.group("label"))
            title = normalize(match.group("title")) or next_title(lines, idx + 1)
            raw.append(
                Article(
                    number=number,
                    label_raw=match.group("label"),
                    page=page_no,
                    line=idx + 1,
                    heading=normalize(line),
                    title=title,
                    text_sha256="",
                )
            )

    grouped: dict[int, list[Article]] = defaultdict(list)
    for article in raw:
        grouped[article.number].append(article)

    selected: list[Article] = []
    ordered_numbers = sorted(grouped)
    for pos, number in enumerate(ordered_numbers):
        occurrences = grouped[number]
        # Prefer the latest occurrence when a table of contents duplicates a heading.
        chosen = max(occurrences, key=lambda item: (item.page, item.line))
        next_number = ordered_numbers[pos + 1] if pos + 1 < len(ordered_numbers) else None
        article_text = extract_article_text(pages, chosen, grouped.get(next_number, []) if next_number else [])
        selected.append(
            Article(
                number=chosen.number,
                label_raw=chosen.label_raw,
                page=chosen.page,
                line=chosen.line,
                heading=chosen.heading,
                title=chosen.title,
                text_sha256=hashlib.sha256(article_text.encode("utf-8")).hexdigest(),
            )
        )
    return selected


def extract_article_text(pages: list[str], current: Article, next_occurrences: list[Article]) -> str:
    start_page = current.page
    start_line = current.line - 1
    end_page = len(pages)
    end_line: int | None = None
    if next_occurrences:
        nxt = max(next_occurrences, key=lambda item: (item.page, item.line))
        end_page = nxt.page
        end_line = nxt.line - 1

    chunks: list[str] = []
    for page_no in range(start_page, end_page + 1):
        lines = pages[page_no - 1].splitlines()
        begin = start_line if page_no == start_page else 0
        finish = end_line if page_no == end_page and end_line is not None else len(lines)
        chunks.extend(lines[begin:finish])
    return "\n".join(chunks).strip()


def quote(value: str | None) -> str:
    return "null" if value is None else json.dumps(value, ensure_ascii=False)


def write_index(articles: list[Article], metadata: dict[str, object]) -> None:
    lines = [
        "index_id: INST058_ARTICLE_INDEX_V0_1",
        f"source_id: {SOURCE_ID}",
        f"source_sha256: {metadata['sha256']}",
        "status: EXTRACTED_UNVERIFIED_REVIEW_PENDING",
        "requirement_activation: FORBIDDEN_PENDING_REVIEW",
        "review_status: PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        f"page_count: {metadata['pageCount']}",
        f"article_count: {len(articles)}",
        f"ocr_used: {str(bool(metadata['extraction']['ocrUsed'])).lower()}",
        "articles:",
    ]
    for article in articles:
        lines.extend([
            f"- id: {article.article_id}",
            f"  article_number: {article.number}",
            f"  source_page: {article.page}",
            f"  source_line: {article.line}",
            f"  label_raw: {quote(article.label_raw)}",
            f"  heading_raw: {quote(article.heading)}",
            f"  title_candidate: {quote(article.title)}",
            f"  article_text_sha256: {article.text_sha256}",
            "  extraction_status: EXTRACTED_UNVERIFIED",
            "  legal_review_status: PENDING",
            "  compliance_review_status: PENDING",
            "  activation: FORBIDDEN",
        ])
    INDEX.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION.read_text(encoding="utf-8"))
    text = TEXT.read_text(encoding="utf-8")
    pages = pages_from_text(text, int(metadata["pageCount"]))
    articles = scan(pages)
    numbers = [article.number for article in articles]
    if not numbers:
        raise RuntimeError("NO_ARTICLES_FOUND")
    missing = [number for number in range(1, max(numbers) + 1) if number not in set(numbers)]
    if numbers[0] != 1:
        raise RuntimeError(f"FIRST_ARTICLE_NOT_ONE:{numbers[0]}")
    if missing:
        raise RuntimeError(f"ARTICLE_SEQUENCE_NOT_CONTINUOUS:{missing}")

    metadata["articleIndexCount"] = len(articles)
    metadata["firstIndexedArticle"] = numbers[0]
    metadata["lastIndexedArticle"] = numbers[-1]
    metadata["missingArticleNumbers"] = []
    metadata["articleIndexRepair"] = {
        "status": "STRICT_REINDEX_PASS",
        "observedOcrAliases": {"Aticle 29": "Article 29"},
        "note": "OCR aliases normalize headings only; the official PDF is unchanged.",
    }
    METADATA.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_index(articles, metadata)

    validation["status"] = "PASS"
    validation["checks"]["articleHeadingsFound"] = True
    validation["checks"]["articleIdsUnique"] = len(numbers) == len(set(numbers))
    validation["checks"]["articleSequenceMonotonic"] = numbers == sorted(numbers)
    validation["checks"]["articlePremierIndexed"] = numbers[0] == 1
    validation["checks"]["articleNumberRangeContinuous"] = not missing
    validation["checks"]["articleIndexStillUnverified"] = True
    validation["metrics"]["articleIndexCount"] = len(articles)
    validation["metrics"]["firstIndexedArticle"] = numbers[0]
    validation["metrics"]["lastIndexedArticle"] = numbers[-1]
    validation["reviewFlags"]["missingArticleNumbers"] = []
    validation["reviewFlags"]["ocrHeadingNormalization"] = {
        "Aticle 29": "Article 29",
        "status": "EXTRACTION_NORMALIZATION_ONLY",
    }
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "articleCount": len(articles),
        "firstArticle": numbers[0],
        "lastArticle": numbers[-1],
        "missingArticleNumbers": [],
        "activationAllowed": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
