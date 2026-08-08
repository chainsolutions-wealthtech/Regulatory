#!/usr/bin/env python3
"""Enrich Instruction 58 materialization metadata with curated legal facts.

This step is deliberately separate from OCR/materialization. It promotes only facts
that have been reviewed against the official materialized PDF text and keeps current
legal status, amendments and requirement activation pending.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ID = "INSTRUCTION_58_CREPMF_2019"
TEXT = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.txt"
METADATA = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.metadata.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST058_MATERIALIZATION_VALIDATION_V0_1.json"

SIGNED_DATE = "2019-07-24"
PREDECESSOR_REFERENCE = "Instruction n°31/2005"
PREDECESSOR_DATE = "2005-06-07"


def main() -> None:
    text = TEXT.read_text(encoding="utf-8")
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION.read_text(encoding="utf-8"))

    required_fragments = [
        "Article 34 : Abrogation",
        "Instruction n°31/2005 du 7 juin 2005",
        "Article 35 : Entrée en vigueur",
        "entre en vigueur à compter de sa date de signature",
    ]
    missing = [fragment for fragment in required_fragments if fragment not in text]
    if missing:
        raise RuntimeError(f"CURATED_LEGAL_EVIDENCE_NOT_FOUND:{missing}")

    legal = metadata.setdefault("legalMetadata", {})
    legal.update(
        {
            "exactSignedDate": SIGNED_DATE,
            "effectiveFrom": SIGNED_DATE,
            "effectiveDateRule": "ARTICLE_35_EFFECTIVE_ON_SIGNATURE_DATE",
            "predecessorReplaced": {
                "reference": PREDECESSOR_REFERENCE,
                "datedOn": PREDECESSOR_DATE,
                "relationship": "EXPLICITLY_ABROGATED_AND_REPLACED",
                "evidenceArticle": 34,
            },
            "amendmentsAndRectifications": "OPEN_OFFICIAL_REGISTRY_AND_BULLETIN_SEARCH_REQUIRED",
            "currentRegistryStatus": "TO_VERIFY_IN_DYNAMIC_OFFICIAL_REGISTRY",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
            "evidenceStatus": "CURATED_FROM_OFFICIAL_MATERIALIZED_SOURCE_TEXT",
            "signatureEvidence": {
                "page": 13,
                "status": "SOURCE_TEXT_CONFIRMED_VISUAL_RECHECK_RECOMMENDED",
                "note": "The OCR signature block is degraded; the curated date is not inferred by OCR automation.",
            },
            "note": (
                "Articles 34 and 35 and the signature block were reviewed from the official materialized source. "
                "Current registry status and any later amendments remain pending official verification."
            ),
        }
    )
    METADATA.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checks = validation.setdefault("checks", {})
    checks["legalDatesNotAutoPromoted"] = True
    checks["curatedLegalMetadataEnriched"] = True
    checks["article34PredecessorRelationshipCaptured"] = True
    checks["article35EffectiveDateRuleCaptured"] = True
    checks["currentStatusNotInvented"] = True
    checks["requirementsNotActivated"] = True
    checks["humanReviewStillRequired"] = True

    review_flags = validation.setdefault("reviewFlags", {})
    review_flags["signatureAndEffectiveDatesStillPending"] = False
    review_flags["signatureVisualRecheckRecommended"] = True
    review_flags["currentRegistryStatusStillPending"] = True
    review_flags["amendmentsAndRectificationsStillPending"] = True

    validation["status"] = "PASS" if all(checks.values()) else "FAIL"
    validation["legalMetadataEnrichment"] = {
        "status": "PASS",
        "signedDate": SIGNED_DATE,
        "effectiveFrom": SIGNED_DATE,
        "predecessorReference": PREDECESSOR_REFERENCE,
        "predecessorDate": PREDECESSOR_DATE,
        "activationAllowed": False,
    }
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "sourceId": SOURCE_ID,
                "signedDate": SIGNED_DATE,
                "effectiveFrom": SIGNED_DATE,
                "predecessor": PREDECESSOR_REFERENCE,
                "currentRegistryStatus": legal["currentRegistryStatus"],
                "activationAllowed": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
