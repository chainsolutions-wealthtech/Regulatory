#!/usr/bin/env python3
"""Build a bounded official AMF-UMOA Decision API catalog.

Research-only discovery for Council/AMF regulatory decisions, with an explicit search
for Decision CM/10/06/2022 (revised pecuniary sanctions regime). Discovery never
establishes legal effect, never resolves a regulatory dependency automatically and
never activates sanction amounts.
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
CATALOG = ROOT / "regulatory/registries/AMF_UMOA_DECISION_API_CATALOG_V0_1.json"
VALIDATION = ROOT / "regulatory/validation/AMF_UMOA_DECISION_API_CATALOG_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"
DEFAULT_START_ID = 1000160
DEFAULT_END_ID = 1000210
EXPECTED_CURRENT_PUBLIC_DECISION_COUNT = 10
KNOWN_WITNESSES = {
    1000178: "CM/13/12/2011",
    1000179: "CM/SJ/O01/03/2016",
    1000182: "CM/07/09/2021",
}
SANCTIONS_2022_PATTERNS = [
    re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE),
    re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE),
]


def clean(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def is_decision(obj: dict[str, object]) -> bool:
    category = (clean(obj.get("categorie")) or "").lower()
    title = (clean(obj.get("titre")) or "").lower()
    tags = obj.get("tags")
    tag_values: list[str] = []
    if isinstance(tags, list):
        for tag in tags:
            if isinstance(tag, str):
                tag_values.append(tag.lower())
            elif isinstance(tag, dict):
                for key in ("label", "libelle", "name", "nom"):
                    v = clean(tag.get(key))
                    if v:
                        tag_values.append(v.lower())
    return "decision" in category or "décision" in category or title.startswith(("decision", "décision")) or any(
        "decision" in tag or "décision" in tag for tag in tag_values
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
    except Exception as exc:  # noqa: BLE001
        return {
            "actualiteId": actualite_id,
            "status": "INVALID_JSON",
            "error": str(exc),
            "rawSha256": hashlib.sha256(raw).hexdigest(),
        }

    if not isinstance(payload, list) or len(payload) != 1 or not isinstance(payload[0], dict):
        return {"actualiteId": actualite_id, "status": "EMPTY_OR_UNEXPECTED", "rawSha256": hashlib.sha256(raw).hexdigest()}

    obj = payload[0]
    if not is_decision(obj):
        return {"actualiteId": actualite_id, "status": "NON_DECISION"}

    title = clean(obj.get("titre"))
    summary = clean(obj.get("resume"))
    text = clean(obj.get("texte"))
    identity_text = " ".join(v for v in (title, summary, text) if v)
    doc = obj.get("doc")
    doc_present = isinstance(doc, str) and bool(doc.strip())
    sanctions_reference_match = bool(SANCTIONS_2022_PATTERNS[0].search(identity_text))
    sanctions_subject_match = bool(SANCTIONS_2022_PATTERNS[1].search(identity_text))

    return {
        "actualiteId": actualite_id,
        "status": "DECISION",
        "titre": title,
        "resume": summary,
        "texte": text,
        "categorie": clean(obj.get("categorie")),
        "portalDate": clean(obj.get("date")),
        "portalValide": obj.get("valide"),
        "portalAbroge": obj.get("abroge"),
        "documentUrl": clean(obj.get("documentUrl")),
        "docPresent": doc_present,
        "docBase64Sha256": hashlib.sha256(doc.encode("ascii", errors="ignore")).hexdigest() if doc_present else None,
        "sanctions2022ReferenceMatch": sanctions_reference_match,
        "sanctionsSubjectMatch": sanctions_subject_match,
        "apiUrl": url,
        "rawSha256": hashlib.sha256(raw).hexdigest(),
    }


def witness_match(item: dict[str, object] | None, expected_reference: str) -> bool:
    if not item:
        return False
    compact_expected = re.sub(r"\s+", "", expected_reference).upper()
    identity = " ".join(str(item.get(k) or "") for k in ("titre", "resume", "texte"))
    compact_identity = re.sub(r"\s+", "", identity).upper()
    return compact_expected in compact_identity


def main() -> None:
    start_id = int(os.environ.get("AMF_DECISION_SCAN_START", DEFAULT_START_ID))
    end_id = int(os.environ.get("AMF_DECISION_SCAN_END", DEFAULT_END_ID))
    workers = max(1, min(int(os.environ.get("AMF_DECISION_SCAN_WORKERS", "8")), 16))
    if start_id > end_id:
        raise SystemExit("AMF_DECISION_SCAN_START must be <= AMF_DECISION_SCAN_END")

    results: list[dict[str, object]] = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_actualite, actualite_id): actualite_id for actualite_id in range(start_id, end_id + 1)}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as exc:  # noqa: BLE001
                results.append({"actualiteId": futures[future], "status": "UNEXPECTED_ERROR", "error": str(exc)})

    decisions = sorted(
        (item for item in results if item.get("status") == "DECISION"),
        key=lambda item: int(item["actualiteId"]),
    )
    by_id = {int(item["actualiteId"]): item for item in decisions}
    witness_checks = [
        {
            "actualiteId": actualite_id,
            "expectedReference": expected,
            "found": actualite_id in by_id,
            "referenceMatches": witness_match(by_id.get(actualite_id), expected),
        }
        for actualite_id, expected in KNOWN_WITNESSES.items()
    ]

    exact_2022 = [item for item in decisions if item.get("sanctions2022ReferenceMatch") is True]
    sanctions_subject = [item for item in decisions if item.get("sanctionsSubjectMatch") is True]
    all_witnesses_pass = all(check["found"] and check["referenceMatches"] for check in witness_checks)
    public_count_recovered = len(decisions) >= EXPECTED_CURRENT_PUBLIC_DECISION_COUNT
    result = "PASS" if all_witnesses_pass and public_count_recovered else "INCOMPLETE"

    catalog = {
        "schemaVersion": "AMF_UMOA_DECISION_API_CATALOG_V0_1",
        "authority": "AMF-UMOA",
        "sourceApi": API,
        "method": "OFFICIAL_FRONTEND_API_BOUNDED_MULTI_YEAR_SCAN",
        "scanIdRange": [start_id, end_id],
        "currentPublicDecisionCountObservedOn20260810": EXPECTED_CURRENT_PUBLIC_DECISION_COUNT,
        "result": result,
        "decisionCount": len(decisions),
        "witnessChecks": witness_checks,
        "sanctions2022ExactReferenceMatches": exact_2022,
        "sanctionsSubjectMatches": sanctions_subject,
        "entries": decisions,
        "boundary": {
            "catalogDiscoveryIsLegalStatusProof": False,
            "portalAbrogeMetadataIsLegalStatusProof": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticSanctionRuleActivationAllowed": False,
            "automaticSanctionAmountActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_DECISION_API_CATALOG_VALIDATION_V0_1",
        "result": result,
        "checks": {
            "knownWitnessesRecovered": all_witnesses_pass,
            "atLeastCurrentPublicDecisionCountRecovered": public_count_recovered,
            "scanIsBounded": start_id == DEFAULT_START_ID and end_id == DEFAULT_END_ID,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "decisionCount": len(decisions),
        "expectedMinimum": EXPECTED_CURRENT_PUBLIC_DECISION_COUNT,
        "sanctions2022ExactReferenceMatchCount": len(exact_2022),
        "sanctionsSubjectMatchCount": len(sanctions_subject),
        "witnessChecks": witness_checks,
        "nextAction": (
            "If CM/10/06/2022 is found, materialize its own official API binary and compare it to the 2016 source. "
            "If not found, preserve the institutional non-indexed recovery boundary and do not infer its contents."
        ),
    }

    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "result": result,
        "decisionCount": len(decisions),
        "exactSanctions2022": len(exact_2022),
        "sanctionsSubject": len(sanctions_subject),
        "scan": [start_id, end_id],
    }, ensure_ascii=False))
    if result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
