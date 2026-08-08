#!/usr/bin/env python3
"""Materialize UEMOA Regulation n°09/2006 from the official SGG Mali archive copy.

The source is an official member-state government archive copy. Materialization proves
binary identity, text availability and the presence of the regulation reference/title.
It does NOT determine whether the 2006 referential is still the current accounting
version after the AMF-UMOA revision work announced in 2023.
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

SOURCE_ID = "REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING"
SOURCE_URL = "https://sgg-mali.ml/txts-droit-reg/UEMOA-Reglement-2006-09-intervenants-agrees-marche-financier-regional.pdf"
ROOT = Path(__file__).resolve().parents[1]
MATERIALIZED = ROOT / "regulatory" / "materialized"
VALIDATION = ROOT / "regulatory" / "validation"
SOURCE_RECORD = ROOT / "regulatory" / "sources" / f"{SOURCE_ID}.yaml"
PDF_PATH = MATERIALIZED / f"{SOURCE_ID}.pdf"
TEXT_PATH = MATERIALIZED / f"{SOURCE_ID}.txt"
METADATA_PATH = MATERIALIZED / f"{SOURCE_ID}.metadata.json"
VALIDATION_PATH = VALIDATION / "REGLEMENT_09_2006_ACCOUNTING_MATERIALIZATION_VALIDATION_V0_1.json"
OCR_TMP = MATERIALIZED / f".{SOURCE_ID}.ocr.tmp.pdf"
MINIMUM_USABLE_TEXT_CHARACTERS = 1000

REFERENCE_RE = re.compile(r"09\s*/\s*2006\s*/\s*CM\s*/\s*UEMOA", re.IGNORECASE)
TITLE_TERMS = ["REGLES COMPTABLES SPECIFIQUES", "INTERVENANTS AGREES", "MARCHE FINANCIER REGIONAL"]
OPC_PATTERNS = [
    re.compile(r"\bOPCVM\b", re.IGNORECASE),
    re.compile(r"Organismes?\s+de\s+Placement\s+Collectif", re.IGNORECASE),
]


def main() -> int:
    ensure_tools()
    MATERIALIZED.mkdir(parents=True, exist_ok=True)
    VALIDATION.mkdir(parents=True, exist_ok=True)

    previous = read_previous_metadata()
    binary = download_pdf(SOURCE_URL)
    validate_pdf(binary)
    sha256 = hashlib.sha256(binary).hexdigest()
    byte_size = len(binary)
    PDF_PATH.write_bytes(binary)

    info = pdf_info(PDF_PATH)
    page_count = int(info.get("Pages", "0"))
    if page_count <= 0:
        raise RuntimeError("INVALID_PAGE_COUNT")

    extraction = extract_text(PDF_PATH, TEXT_PATH)
    text = TEXT_PATH.read_text(encoding="utf-8", errors="strict")
    usable = usable_count(text)
    pages = split_pages(text, page_count)

    normalized_text = ascii_fold(text)
    reference_present = bool(REFERENCE_RE.search(text)) or "09/2006/CM/UEMOA" in normalized_text.replace(" ", "")
    title_terms_present = {term: term in normalized_text for term in TITLE_TERMS}
    reference_pages = pages_matching(pages, lambda p: bool(REFERENCE_RE.search(p)) or "09/2006/CM/UEMOA" in ascii_fold(p).replace(" ", ""))
    accounting_title_pages = pages_matching(
        pages,
        lambda p: sum(term in ascii_fold(p) for term in TITLE_TERMS) >= 2,
    )
    opcvm_pages = pages_matching(
        pages,
        lambda p: any(pattern.search(p) for pattern in OPC_PATTERNS),
    )

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    if previous and previous.get("sha256") == sha256 and previous.get("retrievedAt"):
        retrieved_at = previous["retrievedAt"]

    metadata = {
        "schemaVersion": "REGULATORY_SOURCE_MATERIALIZATION_V1",
        "sourceId": SOURCE_ID,
        "sourceUrl": SOURCE_URL,
        "sourceProvenance": "OFFICIAL_MEMBER_STATE_GOVERNMENT_ARCHIVE_COPY",
        "retrievedAt": retrieved_at,
        "repositoryCopy": relative(PDF_PATH),
        "extractedText": relative(TEXT_PATH),
        "sha256": sha256,
        "byteSize": byte_size,
        "pageCount": page_count,
        "pdfInfo": info,
        "referenceDetection": {
            "reference": "Règlement n°09/2006/CM/UEMOA",
            "present": reference_present,
            "pages": reference_pages,
        },
        "titleDetection": {
            "requiredTerms": TITLE_TERMS,
            "termPresence": title_terms_present,
            "pagesWithAtLeastTwoTitleTerms": accounting_title_pages,
        },
        "opcvmDetection": {
            "pages": opcvm_pages,
            "status": "TEXT_HITS_ONLY_PENDING_LEGAL_SCOPE_REVIEW" if opcvm_pages else "NO_TEXT_HIT_REVIEW_REQUIRED",
        },
        "legalMetadata": {
            "adoptedOn": "2006-06-29",
            "signedOn": None,
            "effectiveFrom": None,
            "currentLegalStatus": "PENDING_CURRENT_VERSION_AND_AMENDMENTS_REVIEW",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
        },
        "extraction": {
            **extraction,
            "usableCharacterCount": usable,
            "status": "MATERIALIZED_TEXT_EXTRACTED_UNVERIFIED",
        },
    }
    write_json(METADATA_PATH, metadata)

    checks = {
        "officialGovernmentPdfDownloaded": True,
        "pdfMagicConfirmed": True,
        "sha256Computed": bool(re.fullmatch(r"[0-9a-f]{64}", sha256)),
        "byteSizePositive": byte_size > 0,
        "pageCountPositive": page_count > 0,
        "textExtracted": usable >= MINIMUM_USABLE_TEXT_CHARACTERS,
        "regulationReferenceDetected": reference_present,
        "accountingTitleTermsDetected": all(title_terms_present.values()),
        "referencePageLocated": len(reference_pages) > 0,
        "currentVersionNotInferred": metadata["legalMetadata"]["currentLegalStatus"] == "PENDING_CURRENT_VERSION_AND_AMENDMENTS_REVIEW",
        "requirementActivationAllowed": False,
        "humanLegalReviewRequired": True,
        "humanComplianceReviewRequired": True,
    }
    status = "PASS" if all(v is True for k, v in checks.items() if k != "requirementActivationAllowed") and checks["requirementActivationAllowed"] is False else "FAIL"
    validation = {
        "validationId": "REGLEMENT_09_2006_ACCOUNTING_MATERIALIZATION_VALIDATION_V0_1",
        "status": status,
        "sourceId": SOURCE_ID,
        "checks": checks,
        "metrics": {
            "byteSize": byte_size,
            "pageCount": page_count,
            "usableTextCharacterCount": usable,
            "referencePageCount": len(reference_pages),
            "accountingTitlePageCount": len(accounting_title_pages),
            "opcvmTextHitPageCount": len(opcvm_pages),
        },
        "outputs": [relative(PDF_PATH), relative(TEXT_PATH), relative(METADATA_PATH)],
        "caveat": (
            "PASS validates the official archive binary and identity of Regulation 09/2006 only. "
            "It does not establish that the 2006 accounting referential is still the current version, "
            "nor does it automatically resolve the five Instruction 66 accounting dependencies."
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
        "User-Agent": "Mozilla/5.0 (compatible; RegulatorySourceMaterializer/1.0)",
        "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    }
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(request, timeout=90) as response:
                if getattr(response, "status", 200) != 200:
                    raise RuntimeError(f"HTTP_STATUS:{getattr(response, 'status', None)}")
                return response.read()
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(attempt * 3)
    raise RuntimeError(f"PDF_DOWNLOAD_FAILED:{last_error}")


def validate_pdf(content: bytes) -> None:
    if len(content) < 10_000:
        raise RuntimeError(f"PDF_TOO_SMALL:{len(content)}")
    if not content.startswith(b"%PDF-"):
        raise RuntimeError("PDF_MAGIC_INVALID")
    if b"%%EOF" not in content[-16384:]:
        raise RuntimeError("PDF_EOF_MISSING")


def pdf_info(path: Path) -> dict[str, str]:
    proc = subprocess.run(["pdfinfo", str(path)], check=True, capture_output=True, text=True, encoding="utf-8")
    result = {}
    for line in proc.stdout.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            result[key.strip()] = value.strip()
    return result


def extract_text(pdf_path: Path, text_path: Path) -> dict[str, object]:
    run_pdftotext(pdf_path, text_path)
    initial = text_path.read_text(encoding="utf-8", errors="strict")
    initial_count = usable_count(initial)
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
        subprocess.run([
            "ocrmypdf", "--language", "fra", "--deskew", "--rotate-pages", "--force-ocr",
            "--output-type", "pdf", "--optimize", "0", "--jobs", "2", "--tesseract-timeout", "180",
            str(pdf_path), str(OCR_TMP)
        ], check=True)
        run_pdftotext(OCR_TMP, text_path)
        final = text_path.read_text(encoding="utf-8", errors="strict")
        final_count = usable_count(final)
        if final_count < MINIMUM_USABLE_TEXT_CHARACTERS:
            raise RuntimeError(f"OCR_TEXT_INSUFFICIENT:{final_count}")
        return {
            "method": "French OCR derivative via OCRmyPDF then pdftotext",
            "ocrUsed": True,
            "ocrLanguage": "fra",
            "ocrDerivativeCommitted": False,
            "initialUsableCharacterCount": initial_count,
            "finalUsableCharacterCount": final_count,
        }
    finally:
        OCR_TMP.unlink(missing_ok=True)


def run_pdftotext(pdf_path: Path, text_path: Path) -> None:
    tmp = text_path.with_suffix(".tmp.txt")
    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(tmp)], check=True)
    tmp.replace(text_path)


def split_pages(text: str, expected: int) -> list[str]:
    pages = text.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    if len(pages) != expected:
        raise RuntimeError(f"TEXT_PAGE_SPLIT_MISMATCH:expected={expected}:received={len(pages)}")
    return pages


def pages_matching(pages: list[str], predicate) -> list[int]:
    return [index for index, page in enumerate(pages, start=1) if predicate(page)]


def ascii_fold(value: str) -> str:
    table = str.maketrans({"é":"E","è":"E","ê":"E","ë":"E","à":"A","â":"A","ä":"A","î":"I","ï":"I","ô":"O","ö":"O","ù":"U","û":"U","ü":"U","ç":"C","É":"E","È":"E","Ê":"E","À":"A","Â":"A","Î":"I","Ô":"O","Ù":"U","Û":"U","Ç":"C","’":"'"})
    return re.sub(r"\s+", " ", value.translate(table).upper()).strip()


def usable_count(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def sync_source_record(sha256: str, byte_size: int, page_count: int) -> None:
    text = SOURCE_RECORD.read_text(encoding="utf-8")
    replacements = {
        r"(?m)^  repository_copy:.*$": f"  repository_copy: {relative(PDF_PATH)}",
        r"(?m)^  extracted_text_copy:.*$": f"  extracted_text_copy: {relative(TEXT_PATH)}",
        r"(?m)^  metadata_copy:.*$": f"  metadata_copy: {relative(METADATA_PATH)}",
        r"(?m)^  sha256:.*$": f"  sha256: {sha256}",
        r"(?m)^  byte_size:.*$": f"  byte_size: {byte_size}",
        r"(?m)^  page_count:.*$": f"  page_count: {page_count}",
        r"(?m)^  copy_status:.*$": "  copy_status: MATERIALIZED_HASHED_AND_IDENTITY_VALIDATED",
        r"(?m)^  status: OFFICIAL_GOVERNMENT_BINARY_READY_FOR_MATERIALIZATION$": "  status: MATERIALIZED_FROM_OFFICIAL_MEMBER_STATE_GOVERNMENT_ARCHIVE",
    }
    for pattern, replacement in replacements.items():
        text, count = re.subn(pattern, replacement, text, count=1)
        if count != 1:
            raise RuntimeError(f"SOURCE_RECORD_SYNC_FAILED:{pattern}:count={count}")
    SOURCE_RECORD.write_text(text, encoding="utf-8")


def read_previous_metadata() -> dict | None:
    if not METADATA_PATH.exists():
        return None
    try:
        return json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
