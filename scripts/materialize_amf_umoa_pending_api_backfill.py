#!/usr/bin/env python3
"""
Prepared backfill materializer for AMF-UMOA documents whose official detail routes
are already identified but whose binaries were not materialized before the GitHub
Actions billing blocker.

IMPORTANT: this script is intentionally NOT wired to an automatic push workflow.
Run only after the external GitHub Actions billing/spending blocker is resolved or
from another explicitly authorized environment with network access.
"""
import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory" / "sources" / "amf-umoa-pending-api-backfill"
REG = ROOT / "regulatory" / "registries" / "AMF_UMOA_PENDING_API_BACKFILL_V0_1.json"
VAL = ROOT / "regulatory" / "validation" / "AMF_UMOA_PENDING_API_BACKFILL_VALIDATION_V0_1.json"
API = "https://www.amf-umoa.org/service/api/elastic/actualite"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

TARGETS = [
    {
        "sourceId": "INSTRUCTION_45_CREPMF_2011",
        "actualiteId": 1000090,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*45\s*/\s*2011",
        "legalRole": "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
    },
    {
        "sourceId": "INSTRUCTION_24_CREPMF_1999",
        "actualiteId": 1000070,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*24\s*/\s*99",
        "legalRole": "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
    },
    {
        "sourceId": "INSTRUCTION_23_CREPMF_1999",
        "actualiteId": 1000069,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*23\s*/\s*99",
        "legalRole": "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
    },
    {
        "sourceId": "INSTRUCTION_22_CREPMF_1999",
        "actualiteId": 1000068,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*22\s*/\s*99",
        "legalRole": "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
    },
    {
        "sourceId": "INSTRUCTION_21_CREPMF_1999",
        "actualiteId": 1000067,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*21\s*/\s*99",
        "legalRole": "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
    },
    {
        "sourceId": "INSTRUCTION_54_CREPMF_2017_REVISEE",
        "actualiteId": 1000098,
        "category": "Instruction",
        "referenceRegex": r"Instruction\s+N[°º]?\s*54\s*/\s*2017",
        "legalRole": "ART005_PAYMENT_RULE_CANDIDATE",
    },
    {
        "sourceId": "DECISION_CM_13_12_2011_TARIFS",
        "actualiteId": 1000178,
        "category": "Decision",
        "referenceRegex": r"CM\s*/\s*13\s*/\s*12\s*/\s*2011",
        "legalRole": "ART005_TARIFF_AMOUNT_CANDIDATE",
    },
    {
        "sourceId": "DECISION_CM_07_09_2021_UNIFORM_SECURITIES_OFFENCES_LAW",
        "actualiteId": 1000182,
        "category": "Decision",
        "referenceRegex": r"CM\s*/\s*07\s*/\s*09\s*/\s*2021",
        "legalRole": "SANCTIONS_2021_NORMATIVE_CONTEXT",
    },
]


def fetch_detail(actualite_id: int):
    url = API + "?" + urlencode({"id": actualite_id, "langue": "fr"})
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urlopen(req, timeout=45) as response:
        raw = response.read()
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, list) or len(payload) != 1 or not isinstance(payload[0], dict):
        raise RuntimeError(f"Unexpected detail payload for actualiteId={actualite_id}")
    return url, raw, payload[0]


def page_count(pdf_path: Path) -> int:
    proc = subprocess.run(
        ["pdfinfo", str(pdf_path)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    match = re.search(r"^Pages:\s+(\d+)\s*$", proc.stdout, re.MULTILINE)
    if not match:
        raise RuntimeError(f"Could not read page count: {pdf_path}")
    return int(match.group(1))


def extract_text(pdf_path: Path, txt_path: Path):
    subprocess.run(["pdftotext", "-layout", str(pdf_path), str(txt_path)], check=True)
    text = txt_path.read_text(encoding="utf-8", errors="ignore") if txt_path.exists() else ""
    useful = len(re.sub(r"\s+", "", text))
    if useful >= 150:
        return text, "PDFTOTEXT"

    work = pdf_path.parent / f"{pdf_path.stem}_ocr_tmp"
    work.mkdir(parents=True, exist_ok=True)
    subprocess.run(["pdftoppm", "-jpeg", "-r", "180", str(pdf_path), str(work / "page")], check=True)
    chunks = []
    for image in sorted(work.glob("page-*.jpg")):
        base = image.with_suffix("")
        subprocess.run(
            ["tesseract", str(image), str(base), "-l", "fra", "--psm", "6"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        t = base.with_suffix(".txt")
        if t.exists():
            chunks.append(t.read_text(encoding="utf-8", errors="ignore"))
    text = "\n\n".join(chunks)
    txt_path.write_text(text, encoding="utf-8")
    for child in work.iterdir():
        child.unlink()
    work.rmdir()
    return text, "OCR_TESSERACT_FRA_FALLBACK"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results, failures = [], []

    for target in TARGETS:
        try:
            api_url, raw, obj = fetch_detail(target["actualiteId"])
            category = str(obj.get("categorie") or "")
            if category != target["category"]:
                raise RuntimeError(f"Category mismatch: expected {target['category']}, got {category!r}")

            identity_text = " ".join(str(obj.get(k) or "") for k in ("titre", "resume", "texte"))
            if not re.search(target["referenceRegex"], identity_text, re.IGNORECASE):
                raise RuntimeError(f"Reference mismatch in API object: {identity_text[:500]}")

            encoded = obj.get("doc")
            if not isinstance(encoded, str) or len(encoded) < 20:
                raise RuntimeError("Detail API object does not contain a Base64 doc")
            pdf = base64.b64decode(encoded, validate=True)
            if not pdf.startswith(b"%PDF"):
                raise RuntimeError("Decoded detail doc is not a PDF")

            pdf_path = OUT / f"{target['sourceId']}.pdf"
            txt_path = OUT / f"{target['sourceId']}.txt"
            meta_path = OUT / f"{target['sourceId']}.metadata.json"
            pdf_path.write_bytes(pdf)
            text, method = extract_text(pdf_path, txt_path)
            useful = len(re.sub(r"\s+", "", text))
            if useful < 150:
                raise RuntimeError(f"Insufficient extracted text: {useful} chars")

            meta = {
                "sourceId": target["sourceId"],
                "legalRole": target["legalRole"],
                "actualiteId": target["actualiteId"],
                "apiUrl": api_url,
                "apiRawSha256": hashlib.sha256(raw).hexdigest(),
                "titreFromApi": obj.get("titre"),
                "resumeFromApi": obj.get("resume"),
                "texteFromApi": obj.get("texte"),
                "documentUrlFromApi": obj.get("documentUrl"),
                "portalDateMetadata": obj.get("date"),
                "portalValideMetadata": obj.get("valide"),
                "portalAbrogeMetadata": obj.get("abroge"),
                "repositoryPdf": str(pdf_path.relative_to(ROOT)),
                "repositoryText": str(txt_path.relative_to(ROOT)),
                "sha256": hashlib.sha256(pdf).hexdigest(),
                "byteSize": len(pdf),
                "pageCount": page_count(pdf_path),
                "textExtractionMethod": method,
                "usefulTextChars": useful,
                "legalBoundary": {
                    "portalDateIsAdoptionDate": False,
                    "portalAbrogeIsLegalStatusProof": False,
                    "binaryMaterializationIsRuleActivation": False,
                    "historicalArticle92TextsRemainAbrogated": target["legalRole"] == "HISTORICAL_ARTICLE92_ABROGATED_SOURCE",
                    "automaticDependencyResolutionAllowed": False,
                    "automaticRequirementActivationAllowed": False,
                    "humanLegalReviewRequired": True,
                    "humanComplianceReviewRequired": True,
                },
            }
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            results.append(meta)
        except Exception as exc:
            failures.append({
                "sourceId": target["sourceId"],
                "actualiteId": target["actualiteId"],
                "error": str(exc),
            })

    registry = {
        "schemaVersion": "AMF_UMOA_PENDING_API_BACKFILL_V0_1",
        "authority": "AMF-UMOA",
        "sourceApi": API,
        "preparedDuringBillingBlocker": True,
        "status": "COMPLETE_8_OF_8" if len(results) == 8 and not failures else "INCOMPLETE",
        "documentCount": len(results),
        "documents": results,
        "failures": failures,
        "boundary": {
            "binaryMaterializationIsLegalResolution": False,
            "portalMetadataMayReactivateHistoricalText": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_PENDING_API_BACKFILL_VALIDATION_V0_1",
        "result": "PASS" if registry["status"] == "COMPLETE_8_OF_8" else "FAIL",
        "checks": {
            "exactly8Documents": len(results) == 8,
            "noFailures": not failures,
            "allPdfMagicAndReferenceValidated": len(results) == 8 and not failures,
            "historicalReactivationForbidden": True,
            "automaticResolutionForbidden": True,
        },
        "failures": failures,
    }
    REG.parent.mkdir(parents=True, exist_ok=True)
    VAL.parent.mkdir(parents=True, exist_ok=True)
    REG.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VAL.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": registry["status"], "count": len(results), "failures": failures}, ensure_ascii=False))
    if validation["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
