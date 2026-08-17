#!/usr/bin/env python3
"""Validate the seven historical source records explicitly abrogated by INST066 article 92.

This validator is intentionally conservative. It checks source-object coverage, declared
binary provenance and safety boundaries only; it does not infer dates, contents, legal
effects or reactivation from a newly materialized historical binary.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALIDATION_PATH = ROOT / "regulatory" / "validation" / "INST066_HISTORICAL_SOURCE_REGISTRY_VALIDATION_V0_1.json"

SOURCES = [
    {
        "seq": 1,
        "source_id": "DECISION_CREPMF_2012_119",
        "path": "regulatory/sources/DECISION_CREPMF_2012_119.yaml",
        "expected_grade": "ARTICLE_92_OFFICIAL_SOURCE_ONLY",
        "binary_required_now": False,
    },
    {
        "seq": 2,
        "source_id": "INSTRUCTION_46_CREPMF_2011_REVISEE",
        "path": "regulatory/sources/INSTRUCTION_46_CREPMF_2011_REVISEE.yaml",
        "expected_grade": "OFFICIAL_NORMATIVE_BINARY_MATERIALIZED",
        "binary_required_now": True,
    },
    {
        "seq": 3,
        "source_id": "INSTRUCTION_45_CREPMF_2011",
        "path": "regulatory/sources/INSTRUCTION_45_CREPMF_2011.yaml",
        "expected_grade": "TWO_DISTINCT_OFFICIAL_ACTS_REFERENCE_AND_TITLE_CORROBORATED",
        "binary_required_now": False,
    },
    {
        "seq": 4,
        "source_id": "INSTRUCTION_24_CREPMF_1999",
        "path": "regulatory/sources/INSTRUCTION_24_CREPMF_1999.yaml",
        "expected_grade": "TWO_DISTINCT_OFFICIAL_ACTS_REFERENCE_AND_TITLE_CORROBORATED",
        "binary_required_now": False,
    },
    {
        "seq": 5,
        "source_id": "INSTRUCTION_23_CREPMF_1999",
        "path": "regulatory/sources/INSTRUCTION_23_CREPMF_1999.yaml",
        "expected_grade": "ARTICLE_92_OFFICIAL_SOURCE_ONLY",
        "binary_required_now": False,
    },
    {
        "seq": 6,
        "source_id": "INSTRUCTION_22_CREPMF_1999",
        "path": "regulatory/sources/INSTRUCTION_22_CREPMF_1999.yaml",
        "expected_grade": "ARTICLE_92_OFFICIAL_SOURCE_ONLY",
        "binary_required_now": False,
    },
    {
        "seq": 7,
        "source_id": "INSTRUCTION_21_CREPMF_1999",
        "path": "regulatory/sources/INSTRUCTION_21_CREPMF_1999.yaml",
        "expected_grade": "ARTICLE_92_OFFICIAL_SOURCE_ONLY",
        "binary_required_now": False,
    },
]

INVENTORY = ROOT / "regulatory" / "registries" / "INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml"
CROSSCHECK = ROOT / "regulatory" / "review-evidence" / "INST066_HISTORICAL_CROSSCHECK" / "OFFICIAL_SOURCE_SEARCH_2026-08-08.yaml"


def main() -> int:
    checks: dict[str, bool] = {}
    records = []

    inventory = INVENTORY.read_text(encoding="utf-8")
    crosscheck = CROSSCHECK.read_text(encoding="utf-8")

    checks["inventoryReferenceCountSeven"] = "reference_count: 7" in inventory
    checks["sourceRecordCoverageDeclaredComplete"] = "source_records_created_count: 7" in inventory
    checks["crosscheckSourceRecordCoverageComplete"] = "source_records_created: 7" in crosscheck
    checks["historicalReactivationForbiddenInInventory"] = "historical_rule_reactivation_allowed: false" in inventory
    checks["historicalReactivationForbiddenInCrosscheck"] = "historical_rule_reactivation_allowed: false" in crosscheck
    checks["requirementActivationForbiddenInInventory"] = "requirement_activation_allowed: false" in inventory
    checks["requirementActivationForbiddenInCrosscheck"] = "requirement_activation_allowed: false" in crosscheck

    for spec in SOURCES:
        path = ROOT / spec["path"]
        exists = path.exists()
        text = path.read_text(encoding="utf-8") if exists else ""
        prefix = f"source{spec['seq']}"
        checks[f"{prefix}RecordExists"] = exists
        checks[f"{prefix}IdMatches"] = f"source_id: {spec['source_id']}" in text
        checks[f"{prefix}HistoricalStatusPresent"] = (
            "historical_status: EXPLICITLY_ABROGATED_BY_INSTRUCTION_66_ARTICLE_92" in text
        )
        checks[f"{prefix}ActivationForbidden"] = has_false(text, "activation_allowed") or has_false(text, "requirement_activation_allowed")
        checks[f"{prefix}HistoricalReactivationForbidden"] = has_false(text, "historical_rule_reactivation_allowed")
        checks[f"{prefix}AutomaticReconstructionForbidden"] = has_false(text, "automatic_rule_reconstruction_allowed") or spec["source_id"] == "INSTRUCTION_46_CREPMF_2011_REVISEE"
        checks[f"{prefix}InventoryLinksRecord"] = spec["path"] in inventory
        checks[f"{prefix}CrosscheckLinksRecord"] = spec["path"] in crosscheck

        binary_path = extract_scalar(text, "repository_copy")
        binary_declared = bool(binary_path and binary_path != "null")
        binary_materialized = bool(binary_declared and (ROOT / binary_path).is_file())
        checks[f"{prefix}DeclaredBinaryExists"] = (not binary_declared) or binary_materialized
        checks[f"{prefix}BinaryStateConsistent"] = binary_materialized if spec["binary_required_now"] else True

        records.append(
            {
                "seq": spec["seq"],
                "sourceId": spec["source_id"],
                "record": spec["path"],
                "expectedEvidenceGrade": spec["expected_grade"],
                "binaryRequiredNow": spec["binary_required_now"],
                "binaryDeclared": binary_declared,
                "binaryMaterialized": binary_materialized,
                "repositoryCopy": binary_path,
            }
        )

    materialized = sum(1 for record in records if record["binaryMaterialized"])
    missing = len(records) - materialized
    required_materialized = all(
        record["binaryMaterialized"]
        for record in records
        if record["binaryRequiredNow"]
    )
    checks["progressiveHistoricalBinaryAcquisitionAllowed"] = 1 <= materialized <= len(records)
    checks["requiredHistoricalBinariesMaterialized"] = required_materialized
    checks["materializedAndMissingCountsReconcile"] = materialized + missing == len(records)
    checks["instruction46OwnBinaryMaterialized"] = records[1]["binaryMaterialized"] is True

    status = "PASS" if all(checks.values()) else "FAIL"
    result = {
        "validationId": "INST066_HISTORICAL_SOURCE_REGISTRY_VALIDATION_V0_1",
        "status": status,
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceArticle": 92,
        "checks": checks,
        "metrics": {
            "expectedHistoricalSourceRecords": len(records),
            "sourceRecordsObserved": sum(1 for record in records if (ROOT / record["record"]).exists()),
            "ownHistoricalBinariesMaterialized": materialized,
            "ownHistoricalBinariesMissing": missing,
        },
        "records": records,
        "safety": {
            "historicalRuleReactivationAllowed": False,
            "automaticRuleReconstructionAllowedForMissingBinaries": False,
            "automaticMigrationInferenceAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
        },
        "caveat": (
            "PASS validates registry completeness, declared binary existence and safety boundaries only. "
            "Materializing an additional historical binary never reactivates an abrogated rule and does not "
            "validate its legal interpretation."
        ),
    }

    VALIDATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def has_false(text: str, key: str) -> bool:
    return bool(re.search(rf"(?m)^\s*{re.escape(key)}:\s*false\s*$", text))


def extract_scalar(text: str, key: str) -> str | None:
    match = re.search(rf"(?m)^\s*{re.escape(key)}:\s*(.+?)\s*$", text)
    if not match:
        return None
    value = match.group(1).strip().strip('"').strip("'")
    return value


if __name__ == "__main__":
    raise SystemExit(main())
