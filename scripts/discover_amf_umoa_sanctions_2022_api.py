#!/usr/bin/env python3
"""Discover CM/10/06/2022 across the official AMF-UMOA Actualite API.

This is a research-only cross-category scan. It deliberately does not infer legal
status, does not activate sanctions, and does not materialize any binary. If an
exact object is discovered, a later governed step must independently validate and
materialize the official document.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API = "https://www.amf-umoa.org/service/api/elastic/actualite"
EVIDENCE = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/AMF_UMOA_CROSS_CATEGORY_SCAN_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/AMF_UMOA_SANCTIONS_2022_CROSS_CATEGORY_SCAN_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

DEFAULT_START_ID = 1000000
DEFAULT_END_ID = 1000300
KNOWN_WITNESSES = {
    1000179: "CM/SJ/O01/03/2016",
    1000182: "CM/07/09/2021",
    1000184: "CM/13/09/2022",
}

TARGET_REFERENCE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE)
SANCTIONS_SUBJECT = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)


def clean(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def iter_text(value: object, *, parent_key: str = ""):
    if parent_key.lower() == "doc":
        return
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() == "doc":
                continue
            yield from iter_text(child, parent_key=str(key))
    elif isinstance(value, list):
        for child in value:
            yield from iter_text(child, parent_key=parent_key)


def fetch_actualite(actualite_id: int) -> dict[str, object]:
    url = API + "?" + urlencode({"id": actualite_id, "langue": "fr"})
    request = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read()
    except (HTTPError, URLError, TimeoutError) as exc:
        return {"actualiteId": actualite_id, "status": "HTTP_ERROR", "error": str(exc)}

    raw_sha = hashlib.sha256(raw).hexdigest()
    try:
        payload = json.loads(raw.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        return {"actualiteId": actualite_id, "status": "INVALID_JSON", "error": str(exc), "rawSha256": raw_sha}

    if not isinstance(payload, list) or len(payload) == 0:
        return {"actualiteId": actualite_id, "status": "EMPTY", "rawSha256": raw_sha}
    if len(payload) != 1 or not isinstance(payload[0], dict):
        return {"actualiteId": actualite_id, "status": "UNEXPECTED_SHAPE", "rawSha256": raw_sha}

    obj = payload[0]
    searchable = " ".join(iter_text(obj))
    title = clean(obj.get("titre"))
    summary = clean(obj.get("resume"))
    text = clean(obj.get("texte"))
    category = clean(obj.get("categorie"))
    doc = obj.get("doc")
    doc_present = isinstance(doc, str) and bool(doc.strip())

    exact_reference = bool(TARGET_REFERENCE.search(searchable))
    sanctions_subject = bool(SANCTIONS_SUBJECT.search(searchable))

    return {
        "actualiteId": actualite_id,
        "status": "OBJECT",
        "titre": title,
        "resume": summary,
        "texte": text,
        "categorie": category,
        "portalDate": clean(obj.get("date")),
        "portalValide": obj.get("valide"),
        "portalAbroge": obj.get("abroge"),
        "documentUrl": clean(obj.get("documentUrl")),
        "docPresent": doc_present,
        "docBase64Sha256": hashlib.sha256(doc.encode("ascii", errors="ignore")).hexdigest() if doc_present else None,
        "targetReferenceMatch": exact_reference,
        "sanctionsSubjectMatch": sanctions_subject,
        "apiUrl": url,
        "rawSha256": raw_sha,
    }


def compact(value: str) -> str:
    return re.sub(r"\s+", "", value).upper()


def witness_match(item: dict[str, object] | None, expected: str) -> bool:
    if not item or item.get("status") != "OBJECT":
        return False
    identity = " ".join(str(item.get(k) or "") for k in ("titre", "resume", "texte"))
    return compact(expected) in compact(identity)


def main() -> None:
    start_id = int(os.environ.get("AMF_SANCTIONS_SCAN_START", DEFAULT_START_ID))
    end_id = int(os.environ.get("AMF_SANCTIONS_SCAN_END", DEFAULT_END_ID))
    workers = max(1, min(int(os.environ.get("AMF_SANCTIONS_SCAN_WORKERS", "12")), 16))
    if start_id > end_id:
        raise SystemExit("AMF_SANCTIONS_SCAN_START must be <= AMF_SANCTIONS_SCAN_END")
    if end_id - start_id > 1000:
        raise SystemExit("Cross-category scan is deliberately bounded to at most 1001 IDs")

    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_actualite, i): i for i in range(start_id, end_id + 1)}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exc:  # noqa: BLE001
                results.append({"actualiteId": futures[future], "status": "UNEXPECTED_ERROR", "error": str(exc)})

    results.sort(key=lambda item: int(item["actualiteId"]))
    by_id = {int(item["actualiteId"]): item for item in results}
    objects = [item for item in results if item.get("status") == "OBJECT"]
    candidates = [
        item for item in objects
        if item.get("targetReferenceMatch") is True or item.get("sanctionsSubjectMatch") is True
    ]
    exact = [item for item in candidates if item.get("targetReferenceMatch") is True]
    subject = [item for item in candidates if item.get("sanctionsSubjectMatch") is True]

    witness_checks = [
        {
            "actualiteId": actualite_id,
            "expectedReference": expected,
            "found": by_id.get(actualite_id, {}).get("status") == "OBJECT",
            "referenceMatches": witness_match(by_id.get(actualite_id), expected),
        }
        for actualite_id, expected in KNOWN_WITNESSES.items()
    ]
    all_witnesses = all(x["found"] and x["referenceMatches"] for x in witness_checks)
    status_counts = Counter(str(item.get("status")) for item in results)
    error_count = sum(status_counts.get(k, 0) for k in ("HTTP_ERROR", "INVALID_JSON", "UNEXPECTED_SHAPE", "UNEXPECTED_ERROR"))
    request_count = end_id - start_id + 1
    error_rate = error_count / request_count
    result = "PASS" if all_witnesses and error_rate <= 0.05 else "INCOMPLETE"

    target_status = "FOUND_EXACT_REFERENCE" if exact else "NOT_FOUND_IN_SCAN_RANGE"
    evidence = {
        "schemaVersion": "AMF_UMOA_SANCTIONS_2022_CROSS_CATEGORY_SCAN_V0_1",
        "authority": "AMF-UMOA",
        "sourceApi": API,
        "method": "OFFICIAL_FRONTEND_API_BOUNDED_CROSS_CATEGORY_SCAN",
        "scanIdRange": [start_id, end_id],
        "requestCount": request_count,
        "result": result,
        "targetReference": "CM/10/06/2022",
        "targetStatus": target_status,
        "exactReferenceMatchCount": len(exact),
        "sanctionsSubjectMatchCount": len(subject),
        "objectCount": len(objects),
        "errorCount": error_count,
        "errorRate": error_rate,
        "statusCounts": dict(sorted(status_counts.items())),
        "witnessChecks": witness_checks,
        "candidates": candidates,
        "boundary": {
            "crossCategoryDiscoveryIsLegalStatusProof": False,
            "portalAbrogeMetadataIsLegalStatusProof": False,
            "binaryMaterializationPerformed": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticSanctionRuleActivationAllowed": False,
            "automaticSanctionAmountActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If an exact CM/10/06/2022 object with an official API document is found, "
            "materialize and independently validate that binary in a separate governed step. "
            "Otherwise preserve the institutional non-indexed recovery boundary."
        ),
    }

    validation = {
        "schemaVersion": "AMF_UMOA_SANCTIONS_2022_CROSS_CATEGORY_SCAN_VALIDATION_V0_1",
        "result": result,
        "checks": {
            "scanIsBounded": end_id - start_id <= 1000,
            "knownWitnessesRecovered": all_witnesses,
            "errorRateAcceptable": error_rate <= 0.05,
            "discoveryDoesNotMaterializeBinary": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "scanIdRange": [start_id, end_id],
        "targetStatus": target_status,
        "exactReferenceMatchCount": len(exact),
        "candidateCount": len(candidates),
        "witnessChecks": witness_checks,
    }

    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": result,
        "scan": [start_id, end_id],
        "objects": len(objects),
        "errors": error_count,
        "targetStatus": target_status,
        "exactReferenceMatches": len(exact),
        "subjectMatches": len(subject),
    }, ensure_ascii=False))

    if result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
