#!/usr/bin/env python3
"""Materialize historical Instruction n°46/2011 revised from the BRVM PDF.

The binary is retained solely as historical regulatory evidence for the migration
trail leading to Instruction n°66/CREPMF/2021. Nothing produced by this script can
reactivate an abrogated requirement.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCE_ID = "INSTRUCTION_46_CREPMF_2011_REVISEE"
SOURCE_URL = (
    "https://www.brvm.org/sites/default/files/"
    "20180822-instruction_ndeg46-2011_revisee-classification_et_aux_regles_d.pdf"
)
EXPECTED_PAGE_COUNT = 9
MINIMUM_USABLE_TEXT_CHARACTERS = 500
ROOT = Path(__file__).resolve().parents[1]
MATERIALIZED = ROOT / "regulatory" / "materialized"
VALIDATION = ROOT / "regulatory" / "validation"
SOURCE_RECORD = ROOT / "regulatory" / "sources" / f"{SOURCE_ID}.yaml"
PDF_PATH = MATERIALIZED / f"{SOURCE_ID}.pdf"
TEXT_PATH = MATERIALIZED / f"{SOURCE_ID}.txt"
METADATA_PATH = MATERIALIZED / f"{SOURCE_ID}.metadata.json"
VALIDATION_PATH = VALIDATION / "INST046_REVISED_MATERIALIZATION_VALIDATION_V0_1.json"
OCR_TMP = MATERIALIZED / f".{SOURCE_ID}.ocr.tmp.pdf"
ARTICLE_RE = re.compile(r"^\s*(?:ARTICLE|Article|article)\s+(?P<number>[0-9]{1,3}|1ER|1er)\b", re.MULTILINE)


def main() -> int:
    ensure_tools()
    MATERIALIZED.mkdir(parents=True, exist_ok=True)
    VALIDATION.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    binary = download_pdf(SOURCE_URL)
    validate_pdf_binary(binary)
    PDF_PATH.write_bytes(binary)

    sha256 = hashlib.sha256(binary).hexdigest()
    byte_size = len(binary)
    pdf_info = read_pdf_info(PDF_PATH)
    page_count = int(pdf_info.get("Pages", "0"))
    if page_count != EXPECTED_PAGE_COUNT:
        raise RuntimeError(
            f"UNEXPECTED_PAGE_COUNT:expected={EXPECTED_PAGE_COUNT}:received={page_count}"
        )

    extraction = extract_text(PDF_PATH, TEXT_PATH)
    text = TEXT_PATH.read_text(encoding="utf-8", errors="strict")
    usable_text = usable_character_count(text)
    article_numbers = sorted(
        {
            1 if match.group("number").lower() == "1er" else int(match.group("number"))
            for match in ARTICLE_RE.finditer(text)
        }
    )

    metadata = {
        "schemaVersion": "REGULATORY_HISTORICAL_SOURCE_MATERIALIZATION_V1",
        "sourceId": SOURCE_ID,
        "sourceUrl": SOURCE_URL,
        "retrievedAt": retrieved_at,
        "repositoryCopy": relative(PDF_PATH),
        "extractedText": relative(TEXT_PATH),
        "sha256": sha256,
        "byteSize": byte_size,
        "pageCount": page_count,
        "pdfInfo": pdf_info,
        "articleHeadingCandidates": article_numbers,
        "articleHeadingCandidateCount": len(article_numbers),
        "historicalStatus": "EXPLICITLY_ABROGATED_BY_INSTRUCTION_66_ARTICLE_92",
        "legalMetadata": {
            "original2011ActDate": None,
            "revisionDate": None,
            "effectiveFrom": None,
            "relationshipToDecision2012_119": "PENDING_HISTORICAL_OFFICIAL_SOURCE_REVIEW",
            "currentLegalStatus": "ABROGATED_BY_INSTRUCTION_66_EFFECTIVE_2022_01_01",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        },
        "extraction": {
            **extraction,
            "usableCharacterCount": usable_text,
            "status": "MATERIALIZED_TEXT_EXTRACTED_UNVERIFIED",
        },
    }
    write_json(METADATA_PATH, metadata)

    checks = {
        "officialBrvmPdfDownloaded": True,
        "pdfMagicConfirmed": True,
        "sha256Computed": bool(re.fullmatch(r"[0-9a-f]{64}", sha256)),
        "byteSizePositive": byte_size > 0,
        "expectedPageCount": page_count == EXPECTED_PAGE_COUNT,
        "textExtracted": usable_text >= MINIMUM_USABLE_TEXT_CHARACTERS,
        "historicalAbrogationPreserved": True,
        "historicalRuleReactivationForbidden": True,
        "requirementActivationAllowed": False,
        "humanLegalReviewRequired": True,
        "humanComplianceReviewRequired": True,
    }
    status = "PASS" if all(value is True or value is False and key == "requirementActivationAllowed" for key, value in checks.items()) else "FAIL"

    validation = {
        "validationId": "INST046_REVISED_MATERIALIZATION_VALIDATION_V0_1",
        "status": status,
        "sourceId": SOURCE_ID,
        "checks": checks,
        "metrics": {
            "byteSize": byte_size,
            "pageCount": page_count,
            "usableTextCharacterCount": usable_text,
            "articleHeadingCandidateCount": len(article_numbers),
        },
        "outputs": [relative(PDF_PATH), relative(TEXT_PATH), relative(METADATA_PATH)],
        "caveat": (
            "PASS validates historical source integrity and text extraction only. "
            "Instruction 46 revised is explicitly abrogated by Instruction 66 article 92; "
            "no historical rule may be reactivated from this materialization."
        ),
    }
    write_json(VALIDATION_PATH, validation)
    sync_source_record(sha256, byte_size, page_count)

    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def ensure_tools() -> None:
    missing = [tool for tool in ("pdfinfo", "pdftotext", "ocrmypdf", "tesseract") if shutil.which(tool) is None]
    if missing:
        raise RuntimeError(f"MISSING_REQUIRED_TOOLS:{','.join(missing)}")


def download_pdf(url: str, attempts: int = 4) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; RegulatoryHistoricalSourceMaterializer/1.0)",
        "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    }
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                if getattr(response, "status", 200) != 200:
                    raise RuntimeError(f"PDF_DOWNLOAD_HTTP_STATUS:{getattr(response, 'status', None)}")
                return response.read()
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


def usable_character_count(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def sync_source_record(sha256: str, byte_size: int, page_count: int) -> None:
    text = SOURCE_RECORD.read_text(encoding="utf-8")
    replacements = {
        r"(?m)^  repository_copy:.*$": f"  repository_copy: {relative(PDF_PATH)}",
        r"(?m)^  sha256:.*$": f"  sha256: {sha256}",
        r"(?m)^  byte_size:.*$": f"  byte_size: {byte_size}",
        r"(?m)^  copy_status:.*$": "  copy_status: MATERIALIZED_HASHED_AND_PAGE_VALIDATED",
        r"(?m)^  binary_acquisition_status:.*$": "  binary_acquisition_status: MATERIALIZED_FROM_OFFICIAL_BRVM_URL",
    }
    for pattern, replacement in replacements.items():
        text, count = re.subn(pattern, replacement, text, count=1)
        if count != 1:
            raise RuntimeError(f"SOURCE_RECORD_SYNC_FAILED:{pattern}:count={count}")

    page_line = f"  page_count: {page_count}\n"
    if re.search(r"(?m)^  page_count:", text):
        text = re.sub(r"(?m)^  page_count:.*$", page_line.rstrip(), text, count=1)
    else:
        marker = f"  byte_size: {byte_size}\n"
        if marker not in text:
            raise RuntimeError("SOURCE_RECORD_PAGE_COUNT_INSERTION_MARKER_MISSING")
        text = text.replace(marker, marker + page_line, 1)

    SOURCE_RECORD.write_text(text, encoding="utf-8")


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
