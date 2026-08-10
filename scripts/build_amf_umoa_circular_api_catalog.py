#!/usr/bin/env python3
"""Build the official AMF-UMOA multi-year circular catalog.

Primary discovery uses the same category-list request as the AMF-UMOA frontend:
`/service/api/elastic/actualite?categorie=Circulaire&page=0&size=100&langue=fr`.
A bounded ID scan is retained only as a fallback/cross-check. Catalog discovery is
research evidence only: it never resolves an Instruction 66 dependency and never
activates a regulatory requirement.
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
CATALOG = ROOT / "regulatory/registries/AMF_UMOA_CIRCULAR_API_CATALOG_V0_1.json"
VALIDATION = ROOT / "regulatory/validation/AMF_UMOA_CIRCULAR_API_CATALOG_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"
DEFAULT_START_ID = 1000040
DEFAULT_END_ID = 1000220
EXPECTED_PUBLIC_CIRCULAR_COUNT = 39
CATEGORY = "Circulaire"
LIST_PAGE = 0
LIST_SIZE = 100
KNOWN_WITNESSES = {
    1000051: (1, 2010),
    1000119: (1, 2019),
    1000129: (1, 2022),
    1000144: (16, 2022),
}
REFERENCE_RE = re.compile(
    r"CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,3})\s*[-/]\s*(20\d{2})",
    re.IGNORECASE,
)


def clean_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = re.sub(r"\s+", " ", value).strip()
    return cleaned or None


def extract_reference(*values: object) -> tuple[int | None, int | None]:
    text = " ".join(value for value in (clean_text(v) for v in values) if value)
    match = REFERENCE_RE.search(text)
    if not match:
        return None, None
    return int(match.group(1)), int(match.group(2))


def is_circular(obj: dict[str, object]) -> bool:
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
    return "circulaire" in categorie or titre.startswith("circulaire") or any(
        "circulaire" in value for value in tag_values
    )


def object_actualite_id(obj: dict[str, object]) -> int | None:
    for key in ("id", "actualiteId", "actualite_id"):
        value = obj.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    return None


def normalize_object(obj: dict[str, object], *, api_url: str, raw_sha256: str) -> dict[str, object] | None:
    if not is_circular(obj):
        return None
    actualite_id = object_actualite_id(obj)
    number, year = extract_reference(obj.get("titre"), obj.get("resume"), obj.get("texte"))
    doc = obj.get("doc")
    doc_present = isinstance(doc, str) and bool(doc.strip())
    return {
        "actualiteId": actualite_id,
        "status": "CIRCULAR",
        "number": number,
        "year": year,
        "reference": f"Circulaire n°{number:02d}/{year}" if number is not None and year is not None else None,
        "titre": clean_text(obj.get("titre")),
        "resume": clean_text(obj.get("resume")),
        "texte": clean_text(obj.get("texte")),
        "categorie": clean_text(obj.get("categorie")),
        "portalDate": clean_text(obj.get("date")),
        "portalValide": obj.get("valide"),
        "portalAbroge": obj.get("abroge"),
        "documentUrl": clean_text(obj.get("documentUrl")),
        "docPresent": doc_present,
        "docBase64Sha256": hashlib.sha256(doc.encode("ascii", errors="ignore")).hexdigest() if doc_present else None,
        "apiUrl": api_url,
        "rawSha256": raw_sha256,
    }


def fetch_category_list() -> tuple[str, str, list[dict[str, object]], dict[str, str]]:
    url = API + "?" + urlencode(
        {
            "categorie": CATEGORY,
            "page": LIST_PAGE,
            "size": LIST_SIZE,
            "langue": "fr",
        }
    )
    request = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urlopen(request, timeout=45) as response:
        raw = response.read()
        headers = {key.lower(): value for key, value in response.headers.items()}
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, list):
        raise RuntimeError(f"CATEGORY_LIST_UNEXPECTED_PAYLOAD:{type(payload).__name__}")
    raw_sha = hashlib.sha256(raw).hexdigest()
    normalized: list[dict[str, object]] = []
    for obj in payload:
        if not isinstance(obj, dict):
            continue
        item = normalize_object(obj, api_url=url, raw_sha256=raw_sha)
        if item:
            normalized.append(item)
    return url, raw_sha, normalized, headers


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
    except Exception as exc:  # noqa: BLE001
        return {
            "actualiteId": actualite_id,
            "status": "INVALID_JSON",
            "error": str(exc),
            "rawSha256": hashlib.sha256(raw).hexdigest(),
        }
    if not isinstance(payload, list) or len(payload) != 1 or not isinstance(payload[0], dict):
        return {"actualiteId": actualite_id, "status": "EMPTY_OR_UNEXPECTED"}
    item = normalize_object(
        payload[0],
        api_url=url,
        raw_sha256=hashlib.sha256(raw).hexdigest(),
    )
    if not item:
        return {"actualiteId": actualite_id, "status": "NON_CIRCULAR"}
    # The detail route is authoritative for its requested ID even if a legacy object
    # omitted the identifier field in the JSON payload.
    item["actualiteId"] = actualite_id
    return item


def bounded_scan(start_id: int, end_id: int, workers: int) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_actualite, actualite_id): actualite_id for actualite_id in range(start_id, end_id + 1)}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exc:  # noqa: BLE001
                results.append({"actualiteId": futures[future], "status": "UNEXPECTED_ERROR", "error": str(exc)})
    return [item for item in results if item.get("status") == "CIRCULAR"]


def sort_circulars(items: list[dict[str, object]]) -> list[dict[str, object]]:
    return sorted(
        items,
        key=lambda item: (
            int(item.get("year") or 9999),
            int(item.get("number") or 9999),
            int(item.get("actualiteId") or 999999999),
        ),
    )


def witness_checks(circulars: list[dict[str, object]]) -> list[dict[str, object]]:
    by_id = {
        int(item["actualiteId"]): item
        for item in circulars
        if isinstance(item.get("actualiteId"), int)
    }
    checks = []
    for actualite_id, (expected_number, expected_year) in KNOWN_WITNESSES.items():
        item = by_id.get(actualite_id)
        checks.append(
            {
                "actualiteId": actualite_id,
                "expectedNumber": expected_number,
                "expectedYear": expected_year,
                "found": item is not None,
                "numberMatches": item is not None and item.get("number") == expected_number,
                "yearMatches": item is not None and item.get("year") == expected_year,
            }
        )
    return checks


def deduplicate_by_id(items: list[dict[str, object]]) -> list[dict[str, object]]:
    by_key: dict[str, dict[str, object]] = {}
    for item in items:
        actualite_id = item.get("actualiteId")
        key = f"id:{actualite_id}" if actualite_id is not None else json.dumps(
            [item.get("titre"), item.get("documentUrl")], ensure_ascii=False
        )
        by_key[key] = item
    return list(by_key.values())


def main() -> None:
    start_id = int(os.environ.get("AMF_CIRCULAR_SCAN_START", DEFAULT_START_ID))
    end_id = int(os.environ.get("AMF_CIRCULAR_SCAN_END", DEFAULT_END_ID))
    workers = max(1, min(int(os.environ.get("AMF_CIRCULAR_SCAN_WORKERS", "8")), 16))
    if start_id > end_id:
        raise SystemExit("AMF_CIRCULAR_SCAN_START must be <= AMF_CIRCULAR_SCAN_END")

    list_error: str | None = None
    list_url: str | None = None
    list_raw_sha: str | None = None
    list_headers: dict[str, str] = {}
    list_items: list[dict[str, object]] = []
    try:
        list_url, list_raw_sha, list_items, list_headers = fetch_category_list()
    except Exception as exc:  # noqa: BLE001 - preserve diagnostic and use fallback
        list_error = f"{type(exc).__name__}:{exc}"

    method = "OFFICIAL_FRONTEND_CATEGORY_LIST"
    circulars = deduplicate_by_id(list_items)
    checks = witness_checks(circulars)
    list_complete = (
        len(circulars) >= EXPECTED_PUBLIC_CIRCULAR_COUNT
        and all(check["found"] and check["numberMatches"] and check["yearMatches"] for check in checks)
    )

    scan_items: list[dict[str, object]] = []
    if not list_complete:
        method = "OFFICIAL_FRONTEND_CATEGORY_LIST_PLUS_BOUNDED_ID_FALLBACK"
        scan_items = bounded_scan(start_id, end_id, workers)
        circulars = deduplicate_by_id([*list_items, *scan_items])
        checks = witness_checks(circulars)

    circulars = sort_circulars(circulars)
    all_witnesses_pass = all(
        check["found"] and check["numberMatches"] and check["yearMatches"] for check in checks
    )
    minimum_count_pass = len(circulars) >= EXPECTED_PUBLIC_CIRCULAR_COUNT

    reference_ids: dict[str, list[int | None]] = {}
    for item in circulars:
        reference = str(item.get("reference") or f"UNPARSED:{item.get('actualiteId')}")
        reference_ids.setdefault(reference, []).append(item.get("actualiteId") if isinstance(item.get("actualiteId"), int) else None)
    duplicate_references = {key: value for key, value in reference_ids.items() if len(value) > 1}

    result = "PASS" if all_witnesses_pass and minimum_count_pass else "INCOMPLETE"
    catalog = {
        "schemaVersion": "AMF_UMOA_CIRCULAR_API_CATALOG_V0_1",
        "authority": "AMF-UMOA",
        "sourceApi": API,
        "method": method,
        "categoryListRequest": {
            "url": list_url,
            "category": CATEGORY,
            "page": LIST_PAGE,
            "size": LIST_SIZE,
            "rawSha256": list_raw_sha,
            "responseHeaders": {
                key: value
                for key, value in list_headers.items()
                if key in {"x-total-count", "content-range", "content-type"}
            },
            "normalizedCircularCount": len(list_items),
            "error": list_error,
        },
        "fallbackScanIdRange": [start_id, end_id],
        "fallbackScanUsed": bool(scan_items),
        "fallbackCircularCount": len(scan_items),
        "publicCircularCountObservedOnPortal20260810": EXPECTED_PUBLIC_CIRCULAR_COUNT,
        "result": result,
        "circularCount": len(circulars),
        "witnessChecks": checks,
        "duplicateReferences": duplicate_references,
        "entries": circulars,
        "boundary": {
            "catalogDiscoveryIsDependencyResolution": False,
            "portalMetadataIsLegalStatusProof": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_CIRCULAR_API_CATALOG_VALIDATION_V0_1",
        "result": result,
        "checks": {
            "knownWitnessesRecovered": all_witnesses_pass,
            "atLeastCurrentPublicCircularCountRecovered": minimum_count_pass,
            "officialCategoryListAttempted": list_url is not None or list_error is not None,
            "fallbackScanIsBoundedWhenUsed": not scan_items or (start_id == DEFAULT_START_ID and end_id == DEFAULT_END_ID),
            "automaticResolutionForbidden": True,
            "automaticRequirementActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "circularCount": len(circulars),
        "expectedMinimum": EXPECTED_PUBLIC_CIRCULAR_COUNT,
        "categoryListCount": len(list_items),
        "fallbackCircularCount": len(scan_items),
        "witnessChecks": checks,
        "nextActionIfIncomplete": "Inspect the official category-list payload/headers before expanding the bounded fallback; do not infer missing circulars.",
    }

    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "result": result,
                "method": method,
                "circularCount": len(circulars),
                "categoryListCount": len(list_items),
                "fallbackCircularCount": len(scan_items),
            },
            ensure_ascii=False,
        )
    )
    if result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
