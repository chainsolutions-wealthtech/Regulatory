#!/usr/bin/env python3
"""Materialize Instruction n°58/CREPMF/2019 from the official BRVM PDF.

The downloaded PDF is the immutable source artifact. Extracted text and detected
article headings are aids for later legal/compliance review only. Nothing produced
by this script can activate a regulatory requirement.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

SOURCE_ID = "INSTRUCTION_58_CREPMF_2019"
SOURCE_TITLE = (
    "Instruction n°58/CREPMF/2019 relative à l'exercice du commissariat aux comptes "
    "auprès des structures agréées et des sociétés cotées du Marché Financier Régional de l'UMOA"
)
SOURCE_URL = (
    "https://www.brvm.org/sites/default/files/"
    "20190725-instruction_ndeg58-crepmf-2019_-_exercice_du_commissariat_aux_comptes_"
    "aupres_des_structures_agreers_et_des_societes_cotees_du_mfr_de_lumoa_0.pdf"
)
EXPECTED_PAGE_COUNT = 17
MINIMUM_USABLE_TEXT_CHARACTERS = 800
ROOT = Path(__file__).resolve().parents[1]
MATERIALIZED = ROOT / "regulatory" / "materialized"
REQUIREMENTS = ROOT / "regulatory" / "requirements"
VALIDATION = ROOT / "regulatory" / "validation"
PDF_PATH = MATERIALIZED / f"{SOURCE_ID}.pdf"
TEXT_PATH = MATERIALIZED / f"{SOURCE_ID}.txt"
METADATA_PATH = MATERIALIZED / f"{SOURCE_ID}.metadata.json"
INDEX_PATH = REQUIREMENTS / "INST058_ARTICLE_INDEX_V0_1.yaml"
VALIDATION_PATH = VALIDATION / "INST058_MATERIALIZATION_VALIDATION_V0_1.json"
OCR_TMP = MATERIALIZED / f".{SOURCE_ID}.ocr.tmp.pdf"

ARTICLE_RE = re.compile(
    r"^\s*(?:ARTICLE|Article|article)\s+"
    r"(?P<label>PREMIER|Premier|premier|1ER|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<title>.*)$"
)
DATE_RE = re.compile(
    r"\b(?:0?[1-9]|[12][0-9]|3[01])\s+"
    r"(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)"
    r"\s+20[0-9]{2}\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Article:
    number: int
    label_raw: str
    page: int
    line: int
    heading_raw: str
    title_candidate: str | None
    toc_like: bool

    @property
    def article_id(self) -> str:
        return f"INST058_ARTICLE_{self.number:03d}"


def main() -> int:
    ensure_tools()
    for directory in (MATERIALIZED, REQUIREMENTS, VALIDATION):
        directory.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    binary = download_pdf(SOURCE_URL)
    validate_pdf_binary(binary)
    atomic_write(PDF_PATH, binary)

    sha256 = hashlib.sha256(binary).hexdigest()
    byte_size = len(binary)
    pdf_info = read_pdf_info(PDF_PATH)
    page_count = int(pdf_info.get("Pages", "0"))
    if page_count != EXPECTED_PAGE_COUNT:
        raise RuntimeError(
            f"UNEXPECTED_PAGE_COUNT: expected {EXPECTED_PAGE_COUNT}, received {page_count}"
        )

    extraction = extract_text(PDF_PATH, TEXT_PATH)
    text = TEXT_PATH.read_text(encoding="utf-8", errors="strict")
    pages = split_pages(text, page_count)
    raw_articles = find_articles(pages)
    articles, duplicates = select_articles(raw_articles)
    missing_numbers = find_missing_numbers(articles)
    non_monotonic = find_non_monotonic(articles)
    date_candidates = find_date_candidates(pages)

    metadata = {
        "schemaVersion": "REGULATORY_SOURCE_MATERIALIZATION_V1",
        "sourceId": SOURCE_ID,
        "title": SOURCE_TITLE,
        "sourceUrl": SOURCE_URL,
        "retrievedAt": retrieved_at,
        "repositoryCopy": relative(PDF_PATH),
        "extractedText": relative(TEXT_PATH),
        "sha256": sha256,
        "byteSize": byte_size,
        "pageCount": page_count,
        "pdfInfo": pdf_info,
        "rawArticleHeadingCount": len(raw_articles),
        "articleIndexCount": len(articles),
        "firstIndexedArticle": articles[0].number if articles else None,
        "lastIndexedArticle": articles[-1].number if articles else None,
        "missingArticleNumbers": missing_numbers,
        "duplicateArticleHeadingOccurrences": duplicates,
        "dateCandidates": date_candidates,
        "legalMetadata": {
            "exactSignedDate": None,
            "effectiveFrom": None,
            "predecessorReplaced": "TO_IDENTIFY",
            "amendmentsAndRectifications": "TO_COMPLETE",
            "currentRegistryStatus": "TO_VERIFY_IN_DYNAMIC_OFFICIAL_REGISTRY",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
            "note": (
                "Dates detected in extracted text are navigation aids only. Publication, signature, "
                "effective date and current legal status require separate official verification."
            ),
        },
        "extraction": {
            **extraction,
            "status": "MATERIALIZED_ARTICLE_INDEX_EXTRACTED_UNVERIFIED",
            "textTool": command_version("pdftotext", "-v"),
            "ocrTool": command_version("ocrmypdf", "--version") if extraction["ocrUsed"] else None,
        },
    }
    write_json(METADATA_PATH, metadata)
    write_index(articles, metadata)

    checks = {
        "officialPdfDownloaded": True,
        "pdfMagicConfirmed": True,
        "sha256Computed": bool(re.fullmatch(r"[0-9a-f]{64}", sha256)),
        "byteSizePositive": byte_size > 0,
        "expectedPageCount": page_count == EXPECTED_PAGE_COUNT,
        "textExtracted": usable_character_count(text) >= MINIMUM_USABLE_TEXT_CHARACTERS,
        "articleHeadingsFound": len(articles) > 0,
        "articleIdsUnique": len({article.article_id for article in articles}) == len(articles),
        "articleSequenceMonotonic": not non_monotonic,
        "legalDatesNotAutoPromoted": metadata["legalMetadata"]["exactSignedDate"] is None,
        "currentStatusNotInvented": metadata["legalMetadata"]["currentRegistryStatus"].startswith("TO_VERIFY"),
        "requirementsNotActivated": True,
        "humanReviewStillRequired": True,
    }
    status = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "validationId": "INST058_MATERIALIZATION_VALIDATION_V0_1",
        "status": status,
        "sourceId": SOURCE_ID,
        "checks": checks,
        "metrics": {
            "byteSize": byte_size,
            "pageCount": page_count,
            "usableTextCharacterCount": usable_character_count(text),
            "rawArticleHeadingCount": len(raw_articles),
            "articleIndexCount": len(articles),
            "firstIndexedArticle": metadata["firstIndexedArticle"],
            "lastIndexedArticle": metadata["lastIndexedArticle"],
            "dateCandidateCount": len(date_candidates),
        },
        "reviewFlags": {
            "duplicateHeadingOccurrences": duplicates,
            "missingArticleNumbers": missing_numbers,
            "nonMonotonicArticles": non_monotonic,
            "registryStatusStillPending": True,
            "signatureAndEffectiveDatesStillPending": True,
        },
        "outputs": [relative(PDF_PATH), relative(TEXT_PATH), relative(METADATA_PATH), relative(INDEX_PATH)],
        "caveat": (
            "PASS validates source integrity and structural extraction only. Extracted text, article titles, "
            "dates, applicability and normative meaning remain unverified and inactive pending legal and "
            "compliance review."
        ),
    }
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def ensure_tools() -> None:
    missing = [tool for tool in ("pdfinfo", "pdftotext", "ocrmypdf", "tesseract") if shutil.which(tool) is None]
    if missing:
        raise RuntimeError(f"MISSING_REQUIRED_TOOLS:{','.join(missing)}")


def download_pdf(url: str, attempts: int = 4) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; RegulatorySourceMaterializer/1.0)",
        "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    }
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                if getattr(response, "status", 200) != 200:
                    raise RuntimeError(f"PDF_DOWNLOAD_HTTP_STATUS:{getattr(response, 'status', None)}")
                content = response.read()
                return content
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(attempt * 3)
    raise RuntimeError(f"PDF_DOWNLOAD_FAILED:{last_error}") from last_error


def validate_pdf_binary(content: bytes) -> None:
    if len(content) < 10_000:
        raise RuntimeError(f"PDF_TOO_SMALL:{len(content)}")
    if not content.startswith(b"%PDF-"):
        raise RuntimeError("PDF_MAGIC_INVALID")
    if b"%%EOF" not in content[-8192:]:
        raise RuntimeError("PDF_EOF_MARKER_MISSING")


def read_pdf_info(path: Path) -> dict[str, str]:
    process = subprocess.run(
        ["pdfinfo", str(path)], check=True, capture_output=True, text=True, encoding="utf-8"
    )
    result: dict[str, str] = {}
    for line in process.stdout.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            result[key.strip()] = value.strip()
    return result


def extract_text(pdf_path: Path, text_path: Path) -> dict[str, object]:
    run_pdftotext(pdf_path, text_path)
    initial = text_path.read_text(encoding="utf-8", errors="strict")
    initial_count = usable_character_count(initial)
    if initial_count >= MINIMUM_USABLE_TEXT_CHARACTERS:
        return {
            "method": "pdftotext -layout -enc UTF-8",
            "ocrUsed": False,
            "ocrLanguage": None,
            "ocrDerivativeCommitted": False,
            "initialUsableCharacterCount": initial_count,
            "finalUsableCharacterCount": initial_count,
        }

    OCR_TMP.unlink(missing_ok=True)
    try:
        subprocess.run(
            [
                "ocrmypdf", "--language", "fra", "--deskew", "--rotate-pages", "--force-ocr",
                "--output-type", "pdf", "--optimize", "0", "--jobs", "2", "--tesseract-timeout", "180",
                str(pdf_path), str(OCR_TMP),
            ],
            check=True,
        )
        run_pdftotext(OCR_TMP, text_path)
        final = text_path.read_text(encoding="utf-8", errors="strict")
        final_count = usable_character_count(final)
        if final_count < MINIMUM_USABLE_TEXT_CHARACTERS:
            raise RuntimeError(f"OCR_TEXT_INSUFFICIENT:{final_count}")
        return {
            "method": "French OCR derivative via OCRmyPDF, then pdftotext -layout -enc UTF-8",
            "ocrUsed": True,
            "ocrLanguage": "fra",
            "ocrDerivativeCommitted": False,
            "initialUsableCharacterCount": initial_count,
            "finalUsableCharacterCount": final_count,
        }
    finally:
        OCR_TMP.unlink(missing_ok=True)


def run_pdftotext(pdf_path: Path, text_path: Path) -> None:
    tmp = text_path.with_suffix(".txt.tmp")
    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(tmp)], check=True)
    tmp.replace(text_path)


def split_pages(text: str, expected: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected:
        raise RuntimeError(f"TEXT_PAGE_SPLIT_MISMATCH: expected {expected}, received {len(pages)}")
    return pages


def find_articles(pages: list[str]) -> list[Article]:
    found: list[Article] = []
    for page_no, page_text in enumerate(pages, start=1):
        lines = page_text.splitlines()
        for idx, line in enumerate(lines):
            match = ARTICLE_RE.match(line)
            if not match:
                continue
            label = match.group("label")
            number = normalize_article_number(label)
            heading = normalize_space(line)
            title = normalize_space(match.group("title")) or next_title(lines, idx + 1)
            toc_like = bool(re.search(r"\.{3,}\s*[0-9]*\s*$", heading))
            found.append(Article(number, label, page_no, idx + 1, heading, title, toc_like))
    return found


def select_articles(raw: list[Article]) -> tuple[list[Article], list[dict[str, object]]]:
    grouped: dict[int, list[Article]] = defaultdict(list)
    for article in raw:
        grouped[article.number].append(article)
    selected: list[Article] = []
    duplicates: list[dict[str, object]] = []
    for number in sorted(grouped):
        occurrences = grouped[number]
        chosen = max(occurrences, key=article_score)
        selected.append(chosen)
        if len(occurrences) > 1:
            duplicates.append({
                "articleId": chosen.article_id,
                "selectedPage": chosen.page,
                "occurrences": [
                    {"page": item.page, "line": item.line, "headingRaw": item.heading_raw, "tocLike": item.toc_like}
                    for item in occurrences
                ],
                "status": "REVIEW_REQUIRED",
            })
    return selected, duplicates


def article_score(article: Article) -> tuple[int, int, int]:
    return (0 if article.toc_like else 10, 1 if article.title_candidate else 0, article.page)


def normalize_article_number(label: str) -> int:
    if label.lower() in {"premier", "1er"}:
        return 1
    return int(label)


def next_title(lines: list[str], start: int) -> str | None:
    for line in lines[start:start + 3]:
        value = normalize_space(line)
        if value and len(value) <= 180 and not value.lower().startswith(("avenue ", "tél", "tel", "fax")):
            return value
    return None


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" :-–—.\t")


def find_missing_numbers(articles: list[Article]) -> list[int]:
    if not articles:
        return []
    numbers = {article.number for article in articles}
    return [number for number in range(min(numbers), max(numbers) + 1) if number not in numbers]


def find_non_monotonic(articles: list[Article]) -> list[dict[str, int]]:
    problems: list[dict[str, int]] = []
    previous = 0
    for article in sorted(articles, key=lambda item: (item.page, item.line)):
        if article.number < previous:
            problems.append({"previous": previous, "current": article.number, "page": article.page})
        previous = max(previous, article.number)
    return problems


def find_date_candidates(pages: list[str]) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for page_no, page in enumerate(pages, start=1):
        for match in DATE_RE.finditer(page):
            result.append({"page": page_no, "value": normalize_space(match.group(0)), "status": "EXTRACTED_UNVERIFIED"})
    return result


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
            f"  label_raw: {yaml_quote(article.label_raw)}",
            f"  heading_raw: {yaml_quote(article.heading_raw)}",
            f"  title_candidate: {yaml_quote(article.title_candidate) if article.title_candidate else 'null'}",
            "  extraction_status: EXTRACTED_UNVERIFIED",
            "  legal_review_status: PENDING",
            "  compliance_review_status: PENDING",
            "  activation: FORBIDDEN",
        ])
    INDEX_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def yaml_quote(value: str | None) -> str:
    if value is None:
        return "null"
    return json.dumps(value, ensure_ascii=False)


def command_version(command: str, flag: str) -> str | None:
    try:
        process = subprocess.run([command, flag], capture_output=True, text=True, check=False)
    except OSError:
        return None
    output = (process.stdout or process.stderr).strip().splitlines()
    return output[0] if output else None


def usable_character_count(text: str) -> int:
    return sum(character.isalnum() for character in text)


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def atomic_write(path: Path, content: bytes) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(content)
    tmp.replace(path)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"INST058_MATERIALIZATION_ERROR: {exc}", file=sys.stderr)
        raise
