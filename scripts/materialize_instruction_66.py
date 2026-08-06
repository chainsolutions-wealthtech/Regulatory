#!/usr/bin/env python3
"""Materialize and structurally index Instruction n°66/CREPMF/2021.

The script downloads the official BRVM-hosted PDF, computes immutable source
metadata, extracts text with Poppler and creates an article index whose entries
remain EXTRACTED_UNVERIFIED. It never promotes a legal requirement to an active
or validated state.
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
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SOURCE_ID = "INSTRUCTION_66_CREPMF_2021"
SOURCE_URL = (
    "https://www.brvm.org/sites/default/files/"
    "instruction_ndeg066-crepmf-2021-instruction_relative_aux_organismes_de_placement_"
    "collectif_et_a_leurs_societes_de_gestion_sur_le_marche_financier_regional_1.pdf"
)
EXPECTED_PAGE_COUNT = 65
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
MATERIALIZED_DIRECTORY = REPOSITORY_ROOT / "regulatory" / "materialized"
REQUIREMENTS_DIRECTORY = REPOSITORY_ROOT / "regulatory" / "requirements"
VALIDATION_DIRECTORY = REPOSITORY_ROOT / "regulatory" / "validation"
PDF_PATH = MATERIALIZED_DIRECTORY / f"{SOURCE_ID}.pdf"
TEXT_PATH = MATERIALIZED_DIRECTORY / f"{SOURCE_ID}.txt"
METADATA_PATH = MATERIALIZED_DIRECTORY / f"{SOURCE_ID}.metadata.json"
ARTICLE_INDEX_PATH = REQUIREMENTS_DIRECTORY / "INST066_ARTICLE_INDEX_V0_1.yaml"
VALIDATION_PATH = VALIDATION_DIRECTORY / "INST066_MATERIALIZATION_VALIDATION_V0_1.json"

ARTICLE_PATTERN = re.compile(
    r"^\s*(?:ARTICLE|Article)\s+(?P<label>PREMIER|Premier|1ER|1er|[0-9]{1,3})"
    r"(?:\s*[:.\-–—]\s*|\s+)?(?P<remainder>.*)$"
)
DATE_PATTERN = re.compile(
    r"\b(?:0?[1-9]|[12][0-9]|3[01])\s+"
    r"(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)"
    r"\s+20[0-9]{2}\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ArticleCandidate:
    sequence: int
    normalized_number: str
    label_raw: str
    heading_raw: str
    title_candidate: str | None
    page: int
    line_number_in_page: int

    @property
    def article_id(self) -> str:
        return f"INST066_ARTICLE_{self.normalized_number}"


def main() -> int:
    ensure_tools()
    for directory in (MATERIALIZED_DIRECTORY, REQUIREMENTS_DIRECTORY, VALIDATION_DIRECTORY):
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

    extract_text(PDF_PATH, TEXT_PATH)
    extracted_text = TEXT_PATH.read_text(encoding="utf-8", errors="strict")
    pages = split_pages(extracted_text, page_count)
    articles = extract_article_candidates(pages)
    duplicate_ids = sorted(find_duplicates(article.article_id for article in articles))
    non_monotonic = find_non_monotonic_articles(articles)
    date_candidates = extract_date_candidates(pages)

    metadata = {
        "schemaVersion": "REGULATORY_SOURCE_MATERIALIZATION_V1",
        "sourceId": SOURCE_ID,
        "title": (
            "Instruction n°66/CREPMF/2021 relative aux Organismes de Placement Collectif "
            "et à leurs Sociétés de Gestion sur le Marché Financier Régional de l'UMOA"
        ),
        "sourceUrl": SOURCE_URL,
        "retrievedAt": retrieved_at,
        "repositoryCopy": PDF_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
        "extractedText": TEXT_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
        "sha256": sha256,
        "byteSize": byte_size,
        "pageCount": page_count,
        "pdfInfo": pdf_info,
        "articleCandidateCount": len(articles),
        "dateCandidates": date_candidates,
        "legalMetadata": {
            "exactSignedDate": None,
            "effectiveFrom": None,
            "predecessorReplaced": "TO_IDENTIFY",
            "amendmentsAndRectifications": "TO_COMPLETE",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
            "note": (
                "Date candidates are extraction aids only. Publication, signature and effective "
                "dates must be distinguished through human review of the official text."
            ),
        },
        "extraction": {
            "pdfTool": pdf_info.get("PDF version"),
            "textTool": command_version("pdftotext", "-v"),
            "method": "pdftotext -layout -enc UTF-8",
            "status": "MATERIALIZED_ARTICLE_INDEX_EXTRACTED_UNVERIFIED",
        },
    }
    write_json(METADATA_PATH, metadata)
    write_article_index(articles, metadata)

    validation = {
        "validationId": "INST066_MATERIALIZATION_VALIDATION_V0_1",
        "status": "PASS" if not duplicate_ids and not non_monotonic and articles else "FAIL",
        "sourceId": SOURCE_ID,
        "checks": {
            "officialPdfDownloaded": True,
            "pdfMagicConfirmed": True,
            "sha256Computed": bool(re.fullmatch(r"[0-9a-f]{64}", sha256)),
            "byteSizePositive": byte_size > 0,
            "expectedPageCount": page_count == EXPECTED_PAGE_COUNT,
            "textExtracted": bool(extracted_text.strip()),
            "articleCandidatesFound": len(articles) > 0,
            "articleIdsUnique": not duplicate_ids,
            "articleSequenceMonotonic": not non_monotonic,
            "legalDatesNotAutoPromoted": metadata["legalMetadata"]["exactSignedDate"] is None,
            "requirementsNotActivated": True,
        },
        "metrics": {
            "byteSize": byte_size,
            "pageCount": page_count,
            "articleCandidateCount": len(articles),
            "dateCandidateCount": len(date_candidates),
        },
        "anomalies": {
            "duplicateArticleIds": duplicate_ids,
            "nonMonotonicArticles": non_monotonic,
        },
        "outputs": [
            PDF_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
            TEXT_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
            METADATA_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
            ARTICLE_INDEX_PATH.relative_to(REPOSITORY_ROOT).as_posix(),
        ],
        "caveat": (
            "This is source-integrity and structural extraction validation only. Article titles, "
            "paragraph boundaries, dates, applicability and normative meaning remain subject to "
            "legal and compliance review."
        ),
    }
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if validation["status"] == "PASS" else 1


def ensure_tools() -> None:
    missing = [tool for tool in ("pdfinfo", "pdftotext") if shutil.which(tool) is None]
    if missing:
        raise RuntimeError(f"MISSING_REQUIRED_TOOLS:{','.join(missing)}")


def download_pdf(url: str, attempts: int = 4) -> bytes:
    last_error: Exception | None = None
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; RegulatorySourceMaterializer/1.0; "
            "+https://github.com/chainsolutions-wealthtech/Regulatory)"
        ),
        "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    }
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                status = getattr(response, "status", 200)
                if status != 200:
                    raise RuntimeError(f"PDF_DOWNLOAD_HTTP_STATUS:{status}")
                content = response.read()
                content_type = response.headers.get_content_type()
                if content_type not in {
                    "application/pdf",
                    "application/octet-stream",
                    "binary/octet-stream",
                }:
                    raise RuntimeError(f"PDF_DOWNLOAD_CONTENT_TYPE:{content_type}")
                return content
        except (urllib.error.URLError, TimeoutError, RuntimeError) as error:
            last_error = error
            if attempt < attempts:
                time.sleep(attempt * 3)
    raise RuntimeError(f"PDF_DOWNLOAD_FAILED:{last_error}") from last_error


def validate_pdf_binary(content: bytes) -> None:
    if len(content) < 10_000:
        raise RuntimeError(f"PDF_TOO_SMALL:{len(content)}")
    if not content.startswith(b"%PDF-"):
        raise RuntimeError("PDF_MAGIC_INVALID")
    if b"%%EOF" not in content[-4096:]:
        raise RuntimeError("PDF_EOF_MARKER_MISSING")


def read_pdf_info(pdf_path: Path) -> dict[str, str]:
    process = subprocess.run(
        ["pdfinfo", str(pdf_path)],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    result: dict[str, str] = {}
    for line in process.stdout.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def extract_text(pdf_path: Path, text_path: Path) -> None:
    temporary = text_path.with_suffix(".txt.tmp")
    subprocess.run(
        ["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(temporary)],
        check=True,
    )
    temporary.replace(text_path)


def split_pages(text: str, expected_pages: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected_pages:
        raise RuntimeError(
            f"TEXT_PAGE_SPLIT_MISMATCH: expected {expected_pages}, received {len(pages)}"
        )
    return pages


def extract_article_candidates(pages: list[str]) -> list[ArticleCandidate]:
    articles: list[ArticleCandidate] = []
    for page_number, page_text in enumerate(pages, start=1):
        lines = page_text.splitlines()
        for line_index, line in enumerate(lines):
            match = ARTICLE_PATTERN.match(line)
            if not match:
                continue
            label_raw = match.group("label")
            normalized_number = normalize_article_number(label_raw)
            remainder = normalize_space(match.group("remainder"))
            title_candidate = remainder or next_title_candidate(lines, line_index + 1)
            heading_raw = normalize_space(line)
            articles.append(
                ArticleCandidate(
                    sequence=len(articles) + 1,
                    normalized_number=normalized_number,
                    label_raw=label_raw,
                    heading_raw=heading_raw,
                    title_candidate=title_candidate,
                    page=page_number,
                    line_number_in_page=line_index + 1,
                )
            )
    return articles


def normalize_article_number(label: str) -> str:
    lowered = label.casefold()
    if lowered in {"premier", "1er"}:
        return "001"
    return f"{int(label):03d}"


def next_title_candidate(lines: list[str], start_index: int) -> str | None:
    collected: list[str] = []
    for line in lines[start_index : start_index + 4]:
        value = normalize_space(line)
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
    candidate = " ".join(collected).strip()
    return candidate[:300] if candidate else None


def extract_date_candidates(pages: list[str]) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    seen: set[tuple[int, str]] = set()
    for page_number, page_text in enumerate(pages, start=1):
        for match in DATE_PATTERN.finditer(page_text):
            value = normalize_space(match.group(0))
            key = (page_number, value.casefold())
            if key in seen:
                continue
            seen.add(key)
            context_start = max(0, match.start() - 120)
            context_end = min(len(page_text), match.end() + 120)
            candidates.append(
                {
                    "page": page_number,
                    "value": value,
                    "context": normalize_space(page_text[context_start:context_end])[:500],
                    "status": "EXTRACTED_UNVERIFIED",
                }
            )
    return candidates


def find_duplicates(values: Iterable[str]) -> set[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return duplicates


def find_non_monotonic_articles(articles: list[ArticleCandidate]) -> list[dict[str, object]]:
    anomalies: list[dict[str, object]] = []
    previous = 0
    for article in articles:
        current = int(article.normalized_number)
        if current < previous:
            anomalies.append(
                {
                    "articleId": article.article_id,
                    "page": article.page,
                    "previousNumber": previous,
                    "currentNumber": current,
                }
            )
        previous = current
    return anomalies


def write_article_index(articles: list[ArticleCandidate], metadata: dict[str, object]) -> None:
    lines = [
        f"source_id: {SOURCE_ID}",
        "registry_version: 0.1.0",
        "status: EXTRACTED_UNVERIFIED_REVIEW_PENDING",
        "scope: UMOA_OPC_AND_MANAGEMENT_COMPANIES",
        "materialization:",
        f"  repository_copy: {yaml_scalar(metadata['repositoryCopy'])}",
        f"  sha256: {metadata['sha256']}",
        f"  byte_size: {metadata['byteSize']}",
        f"  page_count: {metadata['pageCount']}",
        "defaults:",
        "  source_status: SOURCE_MATERIALIZED",
        "  extraction_status: EXTRACTED_UNVERIFIED",
        "  review_status: PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        "  requirement_activation: FORBIDDEN_PENDING_REVIEW",
        "articles:",
    ]
    for article in articles:
        lines.extend(
            [
                f"- id: {article.article_id}",
                f"  seq: {article.sequence}",
                f"  article_number: {yaml_scalar(article.label_raw)}",
                f"  page: {article.page}",
                f"  line_number_in_page: {article.line_number_in_page}",
                f"  heading_raw: {yaml_scalar(article.heading_raw)}",
                f"  title_candidate: {yaml_scalar(article.title_candidate)}",
                "  products: [TO_CLASSIFY]",
                "  document_types: [TO_CLASSIFY]",
                "  applicability: TO_REVIEW",
                "  normative_status: TO_ATOMIZE",
                "  review_status: PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
                "  provenance:",
                f"    source_sha256: {metadata['sha256']}",
                f"    source_page: {article.page}",
            ]
        )
    ARTICLE_INDEX_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def yaml_scalar(value: object) -> str:
    if value is None:
        return "null"
    return json.dumps(str(value), ensure_ascii=False)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def command_version(command: str, flag: str) -> str | None:
    process = subprocess.run([command, flag], capture_output=True, text=True, check=False)
    output = (process.stdout or process.stderr).splitlines()
    return output[0].strip() if output else None


def write_json(path: Path, value: object) -> None:
    atomic_write(path, (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def atomic_write(path: Path, content: bytes) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(content)
    temporary.replace(path)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - CLI must expose the exact failure.
        print(f"INSTRUCTION_66_MATERIALIZATION_FAILED:{error}", file=sys.stderr)
        raise
