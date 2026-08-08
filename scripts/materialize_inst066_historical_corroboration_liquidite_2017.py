#!/usr/bin/env python3
"""Materialize the official 2017 FCP Liquidité Optimum approval decision as corroborating evidence.

This administrative act is evidence about references cited in its visas only. It is
not a substitute for Instructions 21/99, 22/99, 23/99, 24/99, 45/2011, 46/2011 or
Decision 2012-119 and cannot reactivate historical rules.
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

EVIDENCE_ID = "INST066_HISTORICAL_CORROBORATION_LIQUIDITE_OPTIMUM_2017_121"
SOURCE_PAGE = "https://www.brvm.org/fr/decision-crepmf-ndeg-pcr-da-2017-121-agrement-du-fcp-liquidite-optimum-en-qualite-dopcvm"
SOURCE_URL = (
    "https://www.brvm.org/sites/default/files/"
    "201709126-_decision_crepmf_ndeg_pcr-da-2017-121-_portant_agrement_du_fcp_liquidite_optimum_en_qualite_dopcvm_sur_le_marche_financier_regional_de_lumoa.pdf"
)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory" / "review-evidence" / "INST066_HISTORICAL_CROSSCHECK" / "corroborating"
BASENAME = "DECISION_PCR_DA_2017_121_FCP_LIQUIDITE_OPTIMUM"
PDF_PATH = OUT / f"{BASENAME}.pdf"
TEXT_PATH = OUT / f"{BASENAME}.txt"
METADATA_PATH = OUT / f"{BASENAME}.metadata.json"
VALIDATION_PATH = OUT / f"{BASENAME}.validation.json"
OCR_TMP = OUT / f".{BASENAME}.ocr.tmp.pdf"
EXPECTED_PAGE_COUNT = 3
MIN_TEXT = 400

PATTERNS = {
    "INSTRUCTION_45_2011": [r"45\s*/\s*2011", r"Instruction\s+n?[°o]?\s*45\s*/\s*2011"],
    "INSTRUCTION_46_2011": [r"46\s*/\s*2011", r"Instruction\s+n?[°o]?\s*46\s*/\s*2011"],
    "INSTRUCTION_24_99": [r"24\s*/\s*99", r"Instruction\s+n?[°o]?\s*24\s*/\s*99"],
    "INSTRUCTION_23_99": [r"23\s*/\s*99", r"Instruction\s+n?[°o]?\s*23\s*/\s*99"],
    "INSTRUCTION_22_99": [r"22\s*/\s*99", r"Instruction\s+n?[°o]?\s*22\s*/\s*99"],
    "INSTRUCTION_21_99": [r"21\s*/\s*99", r"Instruction\s+n?[°o]?\s*21\s*/\s*99"],
    "DECISION_2012_119": [r"2012\s*[-/]\s*119", r"Décision\s+n?[°o]?\s*2012\s*[-/]\s*119"],
}


def main() -> int:
    ensure_tools()
    OUT.mkdir(parents=True, exist_ok=True)
    binary = download_pdf(SOURCE_URL)
    validate_pdf(binary)
    PDF_PATH.write_bytes(binary)

    sha256 = hashlib.sha256(binary).hexdigest()
    byte_size = len(binary)
    info = pdf_info(PDF_PATH)
    page_count = int(info.get("Pages", "0"))
    if page_count != EXPECTED_PAGE_COUNT:
        raise RuntimeError(f"UNEXPECTED_PAGE_COUNT:expected={EXPECTED_PAGE_COUNT}:received={page_count}")

    extraction = extract_text(PDF_PATH, TEXT_PATH)
    text = TEXT_PATH.read_text(encoding="utf-8", errors="strict")
    normalized = re.sub(r"\s+", " ", text)

    references = {}
    for key, regexes in PATTERNS.items():
        matches = []
        for regex in regexes:
            for match in re.finditer(regex, normalized, re.IGNORECASE):
                snippet = normalized[max(0, match.start() - 180): min(len(normalized), match.end() + 240)]
                matches.append(snippet.strip())
        matches = unique(matches)
        references[key] = {
            "observed": bool(matches),
            "matchCount": len(matches),
            "snippets": matches[:5],
            "status": "OFFICIAL_CORROBORATING_ACT_OBSERVED" if matches else "NOT_OBSERVED_IN_THIS_ACT",
        }

    metadata = {
        "schemaVersion": "REGULATORY_CORROBORATING_EVIDENCE_V1",
        "evidenceId": EVIDENCE_ID,
        "evidenceRole": "OFFICIAL_ADMINISTRATIVE_CORROBORATION_ONLY_NOT_NORMATIVE_SUBSTITUTE",
        "sourcePage": SOURCE_PAGE,
        "sourceUrl": SOURCE_URL,
        "retrievedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "repositoryCopy": relative(PDF_PATH),
        "extractedText": relative(TEXT_PATH),
        "sha256": sha256,
        "byteSize": byte_size,
        "pageCount": page_count,
        "pdfInfo": info,
        "extraction": extraction,
        "historicalReferenceObservations": references,
        "interpretationBoundary": (
            "A citation in this later approval decision corroborates a historical reference only. "
            "It does not replace the historical act, prove its full content, or authorize rule reconstruction."
        ),
    }
    write_json(METADATA_PATH, metadata)

    checks = {
        "officialBrvmPdfDownloaded": True,
        "pdfMagicConfirmed": True,
        "sha256Computed": bool(re.fullmatch(r"[0-9a-f]{64}", sha256)),
        "byteSizePositive": byte_size > 0,
        "expectedPageCount": page_count == EXPECTED_PAGE_COUNT,
        "textExtracted": usable_count(text) >= MIN_TEXT,
        "evidenceRoleNonNormative": True,
        "historicalRuleReactivationForbidden": True,
        "requirementActivationAllowed": False,
    }
    status = "PASS" if all(v is True for k, v in checks.items() if k != "requirementActivationAllowed") and checks["requirementActivationAllowed"] is False else "FAIL"
    validation = {
        "validationId": "INST066_HISTORICAL_CORROBORATION_LIQUIDITE_OPTIMUM_2017_121_V1",
        "status": status,
        "checks": checks,
        "metrics": {
            "byteSize": byte_size,
            "pageCount": page_count,
            "usableTextCharacterCount": usable_count(text),
            "observedHistoricalReferenceCount": sum(1 for item in references.values() if item["observed"]),
        },
        "outputs": [relative(PDF_PATH), relative(TEXT_PATH), relative(METADATA_PATH)],
        "caveat": "This is corroborating evidence, not the normative historical source.",
    }
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def ensure_tools() -> None:
    missing = [t for t in ("pdfinfo", "pdftotext", "ocrmypdf", "tesseract") if shutil.which(t) is None]
    if missing:
        raise RuntimeError(f"MISSING_REQUIRED_TOOLS:{','.join(missing)}")


def download_pdf(url: str, attempts: int = 4) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; RegulatoryCorroborationMaterializer/1.0)",
        "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
    }
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=90) as response:
                if getattr(response, "status", 200) != 200:
                    raise RuntimeError(f"HTTP_STATUS:{getattr(response, 'status', None)}")
                return response.read()
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(3 * attempt)
    raise RuntimeError(f"PDF_DOWNLOAD_FAILED:{last_error}")


def validate_pdf(content: bytes) -> None:
    if len(content) < 10_000:
        raise RuntimeError(f"PDF_TOO_SMALL:{len(content)}")
    if not content.startswith(b"%PDF-"):
        raise RuntimeError("PDF_MAGIC_INVALID")
    if b"%%EOF" not in content[-8192:]:
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
    if usable_count(initial) >= MIN_TEXT:
        return {"method": "pdftotext -layout -enc UTF-8", "ocrUsed": False, "ocrLanguage": None}
    OCR_TMP.unlink(missing_ok=True)
    try:
        subprocess.run([
            "ocrmypdf", "--language", "fra", "--deskew", "--rotate-pages", "--force-ocr",
            "--output-type", "pdf", "--optimize", "0", "--jobs", "2", "--tesseract-timeout", "180",
            str(pdf_path), str(OCR_TMP)
        ], check=True)
        run_pdftotext(OCR_TMP, text_path)
        final = text_path.read_text(encoding="utf-8", errors="strict")
        if usable_count(final) < MIN_TEXT:
            raise RuntimeError("OCR_TEXT_INSUFFICIENT")
        return {"method": "French OCR derivative via OCRmyPDF then pdftotext", "ocrUsed": True, "ocrLanguage": "fra"}
    finally:
        OCR_TMP.unlink(missing_ok=True)


def run_pdftotext(pdf_path: Path, text_path: Path) -> None:
    tmp = text_path.with_suffix(".tmp.txt")
    subprocess.run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(tmp)], check=True)
    tmp.replace(text_path)


def usable_count(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def unique(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
