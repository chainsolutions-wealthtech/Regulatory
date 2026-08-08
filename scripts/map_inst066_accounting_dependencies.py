#!/usr/bin/env python3
"""Map the five INST066 accounting-regulation dependencies to materialized Regulation 09/2006.

This mapping is intentionally NOT a resolution. It proves that the 2006 accounting
regulation is a materialized candidate matching the generic wording used by Instruction
66, while current-version/amendment review remains open because AMF-UMOA announced a
referential revision in 2023.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json"
SOURCE = ROOT / "regulatory" / "sources" / "REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING.yaml"
METADATA = ROOT / "regulatory" / "materialized" / "REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING.metadata.json"
SOURCE_VALIDATION = ROOT / "regulatory" / "validation" / "REGLEMENT_09_2006_ACCOUNTING_MATERIALIZATION_VALIDATION_V0_1.json"
OUTPUT = ROOT / "regulatory" / "registries" / "INST066_ACCOUNTING_DEPENDENCY_MAPPING_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST066_ACCOUNTING_DEPENDENCY_MAPPING_VALIDATION_V0_1.json"

EXPECTED_CANDIDATE = "REGLEMENT_09_2006_CM_UEMOA_ACCOUNTING"


def main() -> int:
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    source_validation = json.loads(SOURCE_VALIDATION.read_text(encoding="utf-8"))
    source_text = SOURCE.read_text(encoding="utf-8")

    if source_validation.get("status") != "PASS":
        raise RuntimeError("REGLEMENT_09_SOURCE_VALIDATION_NOT_PASS")
    if metadata.get("sourceId") != EXPECTED_CANDIDATE:
        raise RuntimeError("REGLEMENT_09_SOURCE_ID_MISMATCH")
    if metadata.get("legalMetadata", {}).get("currentLegalStatus") != "PENDING_CURRENT_VERSION_AND_AMENDMENTS_REVIEW":
        raise RuntimeError("CURRENT_VERSION_MUST_REMAIN_PENDING")
    if "copy_status: MATERIALIZED_HASHED_AND_IDENTITY_VALIDATED" not in source_text:
        raise RuntimeError("SOURCE_RECORD_NOT_MATERIALIZED")

    deps = [
        dep for dep in inventory.get("dependencies", [])
        if dep.get("dependencyKind") == "SPECIFIC_ACCOUNTING_REGULATION"
    ]
    deps.sort(key=lambda dep: (int(dep["articleNumber"]), dep["dependencyId"]))
    if len(deps) != 5:
        raise RuntimeError(f"EXPECTED_FIVE_ACCOUNTING_DEPENDENCIES:got={len(deps)}")

    mappings = []
    for dep in deps:
        mappings.append(
            {
                "dependencyId": dep["dependencyId"],
                "articleNumber": dep["articleNumber"],
                "articleTitle": dep.get("articleTitle"),
                "sourcePages": dep.get("sourcePages", []),
                "sourceWording": dep.get("sourceWording"),
                "sourceContext": dep.get("sourceContext"),
                "candidateSourceId": EXPECTED_CANDIDATE,
                "candidateReference": "Règlement n°09/2006/CM/UEMOA",
                "candidateSourceSha256": metadata["sha256"],
                "candidateRepositoryCopy": metadata["repositoryCopy"],
                "candidateEvidence": {
                    "officialGovernmentArchiveCopy": True,
                    "referenceDetectedInBinary": metadata["referenceDetection"]["present"],
                    "referencePages": metadata["referenceDetection"]["pages"],
                    "accountingTitleTermsDetected": all(metadata["titleDetection"]["termPresence"].values()),
                    "opcvmTextHitPages": metadata["opcvmDetection"]["pages"],
                },
                "mappingStatus": "CANDIDATE_SOURCE_MATERIALIZED_CURRENT_VERSION_PENDING",
                "resolutionStatus": "NOT_RESOLVED_CURRENT_VERSION_AND_SCOPE_REVIEW_PENDING",
                "activation": "FORBIDDEN_PENDING_CURRENT_VERSION_LEGAL_AND_COMPLIANCE_REVIEW",
                "legalReviewStatus": "PENDING",
                "complianceReviewStatus": "PENDING",
            }
        )

    result = {
        "schemaVersion": "INST066_ACCOUNTING_DEPENDENCY_MAPPING_V0_1",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "candidateSourceId": EXPECTED_CANDIDATE,
        "candidateReference": "Règlement n°09/2006/CM/UEMOA",
        "candidateSha256": metadata["sha256"],
        "status": "FIVE_DEPENDENCIES_MAPPED_TO_MATERIALIZED_CANDIDATE_CURRENT_VERSION_PENDING",
        "currentVersionStatus": "PENDING_CURRENT_VERSION_AND_AMENDMENTS_REVIEW",
        "dependencyCount": len(mappings),
        "articleNumbers": sorted({int(item["articleNumber"]) for item in mappings}),
        "mappings": mappings,
        "resolutionBoundary": {
            "candidateMaterializationIsResolution": False,
            "mustIdentifyCurrentAccountingVersion": True,
            "mustReviewAmendmentsAnd2023RevisionOutcome": True,
            "mustPerformHumanLegalReview": True,
            "mustPerformHumanComplianceReview": True,
        },
        "safety": {
            "automaticDependencyResolutionAllowed": False,
            "automaticRuleReconstructionAllowed": False,
            "requirementActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checks = {
        "sourceMaterializationPass": source_validation["status"] == "PASS",
        "candidateSourceMaterialized": "copy_status: MATERIALIZED_HASHED_AND_IDENTITY_VALIDATED" in source_text,
        "exactlyFiveAccountingDependencies": len(mappings) == 5,
        "allMappingsUseSameHash": all(item["candidateSourceSha256"] == metadata["sha256"] for item in mappings),
        "referenceDetectedInCandidateBinary": metadata["referenceDetection"]["present"] is True,
        "accountingTitleDetectedInCandidateBinary": all(metadata["titleDetection"]["termPresence"].values()),
        "currentVersionRemainsPending": result["currentVersionStatus"] == "PENDING_CURRENT_VERSION_AND_AMENDMENTS_REVIEW",
        "noDependencyMarkedResolved": all(item["resolutionStatus"].startswith("NOT_RESOLVED_") for item in mappings),
        "allActivationForbidden": all(item["activation"].startswith("FORBIDDEN_") for item in mappings),
        "automaticResolutionForbidden": result["safety"]["automaticDependencyResolutionAllowed"] is False,
        "readyForSubmissionRemainsFalse": result["safety"]["readyForSubmissionMustRemainFalse"] is True,
    }
    status = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "validationId": "INST066_ACCOUNTING_DEPENDENCY_MAPPING_VALIDATION_V0_1",
        "status": status,
        "checks": checks,
        "metrics": {
            "dependencyCount": len(mappings),
            "articleNumbers": result["articleNumbers"],
            "candidateSha256": metadata["sha256"],
            "opcvmTextHitPageCount": len(metadata["opcvmDetection"]["pages"]),
        },
        "outputs": [relative(OUTPUT)],
        "caveat": (
            "PASS validates deterministic mapping to a materialized 2006 candidate only. "
            "It does not establish the currently applicable accounting referential or resolve any dependency."
        ),
    }
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
