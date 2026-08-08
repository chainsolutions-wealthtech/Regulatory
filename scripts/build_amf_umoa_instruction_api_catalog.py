#!/usr/bin/env python3
"""Build a bounded multi-year catalog of AMF-UMOA Instructions from the official API.

Research-only discovery. It never resolves an Instruction 66 dependency automatically,
never reconstructs a missing rule and never activates a regulatory requirement.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API = "https://www.amf-umoa.org/service/api/elastic/actualite"
CATALOG = ROOT / "regulatory/registries/AMF_UMOA_INSTRUCTION_API_CATALOG_V0_1.json"
VALIDATION = ROOT / "regulatory/validation/AMF_UMOA_INSTRUCTION_API_CATALOG_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"
DEFAULT_START_ID = 1000040
DEFAULT_END_ID = 1000120
EXPECTED_CURRENT_PUBLIC_INSTRUCTION_COUNT = 41
KNOWN_WITNESSES = {
    1000106: (61, 2020),
    1000110: (64, 2020),
}
REFERENCE_RE = re.compile(
    r"INSTRUCTION\s+N[°ºO]?\s*0*(\d{1,3})\s*(?:/\s*CREPMF\s*)?/\s*(20\d{2})",
    re.IGNORECASE,
)
FALLBACK_REFERENCE_RE = re.compile(
    r"INSTRUCTION\s+N[°ºO]?\s*0*(\d{1,3})\s*[-/]\s*(20\d{2})",
    re.IGNORECASE,
)


def clean_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    return cleaned or None


def extract_reference(*values: object) -> tuple[int | None, int | None]:
    text = " ".join(value for value in (clean_text(v) for v in values) if value)
    for pattern in (REFERENCE_RE, FALLBACK_REFERENCE_RE):
        match = pattern.search(text)
        if match:
            return int(match.group(1)), int(match.group(2))
    return None, None


def is_instruction(obj: dict[str, object]) -> bool:
    categorie = (clean_text(obj.get("categorie")) or "").lower()
    titre = (clean_text(obj.get("titre")) or "").lower()
    tags = obj.get("tags")
    tag_values: list[str] = []
    if isinstance(tags, list):
        for tag in tags:
            if isinstance(tag, str):
                tag_values.append(tag.lower())
            elif isinstance(tag, dict):
                for key in ("label", "libelle", "name", "nom"):
                    value = clean_text(tag.get(key))
                    if value:
                        tag_values.append(value.lower())
    return "instruction" in categorie or titre.startswith("instruction") or any(
        "instruction" in value for value in tag_values
    )


def fetch_actualite(actualite_id: int) -> dict[str, object]:
    url = API + "?" + urlencode({"id": actualite_id, "langue": "fr"})
    request = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read()
    except (HTTPError, URLError, TimeoutError) as exc:
        return {"actualiteId": actualite_id, "status": "HTTP_ERROR", "error": str(exc)}

    try:
        payload = json.loads(raw.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 - evidence capture
        return {
            "actualiteId": actualite_id,
            "status": "INVALID_JSON",
            "error": str(exc),
            "rawSha256": hashlib.sha256(raw).hexdigest(),
        }

    if not isinstance(payload, list) or len(payload) != 1 or not isinstance(payload[0], dict):
        return {
            "actualiteId": actualite_id,
            "status": "EMPTY_OR_UNEXPECTED",
            "rawSha256": hashlib.sha256(raw).hexdigest(),
        }

    obj = payload[0]
    if not is_instruction(obj):
        return {"actualiteId": actualite_id, "status": "NON_INSTRUCTION"}

    number, year = extract_reference(obj.get("titre"), obj.get("resume"), obj.get("texte"))
    doc = obj.get("doc")
    doc_present = isinstance(doc, str) and bool(doc.strip())
    return {
        "actualiteId": actualite_id,
        "status": "INSTRUCTION",
        "number": number,
        "year": year,
        "reference": f"Instruction n°{number}/{year}" if number is not None and year is not None else None,
        "titre": clean_text(obj.get("titre")),
        "resume": clean_text(obj.get("resume")),
        "texte": clean_text(obj.get("texte")),
        "categorie": clean_text(obj.get("categorie")),
        "documentUrl": clean_text(obj.get("documentUrl")),
        "docPresent": doc_present,
        "docBase64Sha256": hashlib.sha256(doc.encode("ascii", errors="ignore")).hexdigest()
        if doc_present
        else None,
        "apiUrl": url,
        "rawSha256": hashlib.sha256(raw).hexdigest(),
    }


def main() -> None:
    start_id = int(os.environ.get("AMF_INSTRUCTION_SCAN_START", DEFAULT_START_ID))
    end_id = int(os.environ.get("AMF_INSTRUCTION_SCAN_END", DEFAULT_END_ID))
    workers = max(1, min(int(os.environ.get("AMF_INSTRUCTION_SCAN_WORKERS", "8")), 16))
    if start_id > end_id:
        raise SystemExit("AMF_INSTRUCTION_SCAN_START must be <= AMF_INSTRUCTION_SCAN_END")

    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(fetch_actualite, actualite_id): actualite_id
            for actualite_id in range(start_id, end_id + 1)
        }
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exc:  # noqa: BLE001 - preserve research boundary
                results.append({"actualiteId": futures[future], "status": "UNEXPECTED_ERROR", "error": str(exc)})

    instructions = sorted(
        (item for item in results if item.get("status") == "INSTRUCTION"),
        key=lambda item: (
            int(item.get("year") or 9999),
            int(item.get("number") or 9999),
            int(item["actualiteId"]),
        ),
    )
    by_id = {int(item["actualiteId"]): item for item in instructions}
    witness_checks = []
    for actualite_id, (expected_number, expected_year) in KNOWN_WITNESSES.items():
        item = by_id.get(actualite_id)
        witness_checks.append(
            {
                "actualiteId": actualite_id,
                "expectedNumber": expected_number,
                "expectedYear": expected_year,
                "found": item is not None,
                "numberMatches": item is not None and item.get("number") == expected_number,
                "yearMatches": item is not None and item.get("year") == expected_year,
            }
        )

    reference_ids: dict[str, list[int]] = {}
    for item in instructions:
        reference = str(item.get("reference") or f"UNPARSED:{item['actualiteId']}")
        reference_ids.setdefault(reference, []).append(int(item["actualiteId"]))
    duplicate_references = {key: value for key, value in reference_ids.items() if len(value) > 1}

    all_witnesses_pass = all(
        check["found"] and check["numberMatches"] and check["yearMatches"] for check in witness_checks
    )
    minimum_count_pass = len(instructions) >= EXPECTED_CURRENT_PUBLIC_INSTRUCTION_COUNT
    result = "PASS" if all_witnesses_pass and minimum_count_pass else "INCOMPLETE"

    catalog = {
        "schemaVersion": "AMF_UMOA_INSTRUCTION_API_CATALOG_V0_1",
        "authority": "AMF-UMOA",
        "sourceApi": API,
        "method": "OFFICIAL_FRONTEND_API_BOUNDED_MULTI_YEAR_SCAN",
        "scanIdRange": [start_id, end_id],
        "currentPublicInstructionCountObservedOn20260808": EXPECTED_CURRENT_PUBLIC_INSTRUCTION_COUNT,
        "result": result,
        "instructionCount": len(instructions),
        "witnessChecks": witness_checks,
        "duplicateReferences": duplicate_references,
        "entries": instructions,
        "boundary": {
            "catalogDiscoveryIsDependencyResolution": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "automaticRuleReconstructionAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_INSTRUCTION_API_CATALOG_VALIDATION_V0_1",
        "result": result,
        "checks": {
            "knownWitnessesRecovered": all_witnesses_pass,
            "atLeastCurrentPublicInstructionCountRecovered": minimum_count_pass,
            "scanIsBounded": start_id == DEFAULT_START_ID and end_id == DEFAULT_END_ID,
            "automaticResolutionForbidden": True,
            "automaticRequirementActivationForbidden": True,
            "automaticRuleReconstructionForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "instructionCount": len(instructions),
        "expectedMinimum": EXPECTED_CURRENT_PUBLIC_INSTRUCTION_COUNT,
        "witnessChecks": witness_checks,
        "nextActionIfIncomplete": (
            "Review missing witnesses/count and expand the bounded official API scan deliberately; "
            "do not infer missing Instruction references."
        ),
    }

    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"result": result, "instructionCount": len(instructions), "scan": [start_id, end_id]}, ensure_ascii=False))
    if result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
