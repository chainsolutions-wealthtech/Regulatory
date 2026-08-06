#!/usr/bin/env python3
"""Validate cross-file consistency of Instruction 66 source metadata."""

from __future__ import annotations

import hashlib
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf"
METADATA = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.metadata.json"
SOURCE = ROOT / "regulatory/sources/INSTRUCTION_66_CREPMF_2021.yaml"
OBSERVATION = ROOT / "regulatory/review-evidence/INST066_LEGAL_METADATA/SOURCE_OBSERVATION_V0_1.yaml"
ABROGATIONS = ROOT / "regulatory/registries/INST066_ABROGATED_TEXTS_INVENTORY_V0_1.yaml"
AMENDMENTS = ROOT / "regulatory/registries/INST066_AMENDMENTS_RECTIFICATIONS_REVIEW_V0_1.yaml"
DETAILED_VALIDATION = ROOT / "regulatory/validation/INST066_DETAILED_REQUIREMENTS_VALIDATION_V0_1.json"
OUTPUT = ROOT / "regulatory/validation/INST066_SOURCE_METADATA_CONSISTENCY_V0_1.json"
PNG_DIRECTORY = ROOT / "regulatory/review-evidence/INST066_LEGAL_METADATA"


def main() -> None:
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    source = SOURCE.read_text(encoding="utf-8")
    observation = OBSERVATION.read_text(encoding="utf-8")
    abrogations = ABROGATIONS.read_text(encoding="utf-8")
    amendments = AMENDMENTS.read_text(encoding="utf-8")
    detailed = json.loads(DETAILED_VALIDATION.read_text(encoding="utf-8"))

    digest = hashlib.sha256(PDF.read_bytes()).hexdigest()
    expected_digest = metadata["sha256"]
    expected_size = metadata["byteSize"]
    expected_pages = metadata["pageCount"]
    detailed_count = int(detailed["metrics"]["requirementCandidateCount"])
    source_count_match = re.search(
        r"^\s*detailed_requirement_candidate_count:\s*(\d+)\s*$",
        source,
        flags=re.MULTILINE,
    )
    source_count = int(source_count_match.group(1)) if source_count_match else None

    png_dimensions = {}
    for page in (64, 65):
        path = PNG_DIRECTORY / f"page-{page}.png"
        data = path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
            raise RuntimeError(f"INST066_RENDERED_PAGE_INVALID:{page}")
        png_dimensions[str(page)] = list(struct.unpack(">II", data[16:24]))

    references = re.findall(r"^  reference: (.+)$", abrogations, flags=re.MULTILINE)
    checks = {
        "pdfDigestMatchesMetadata": digest == expected_digest,
        "pdfByteSizeMatchesMetadata": PDF.stat().st_size == expected_size,
        "metadataPageCountIs65": expected_pages == 65,
        "sourceUsesSameDigest": f"sha256: {expected_digest}" in source,
        "observationUsesSameDigest": f"sha256: {expected_digest}" in observation,
        "abrogationInventoryUsesSameDigest": f"sha256: {expected_digest}" in abrogations,
        "actDateConsistent": all("2021-12-16" in value for value in (source, observation)),
        "effectiveDateConsistent": all("2022-01-01" in value for value in (source, observation)),
        "sevenAbrogatedReferencesObserved": len(references) == 7 and "reference_count: 7" in abrogations,
        "historicalRegistryCrosscheckStillOpen": "historical_registry_crosscheck_complete: false" in abrogations,
        "amendmentsInventoryDoesNotClaimCompleteness": "completeness_claimed: false" in amendments,
        "noSeparateModifierClaimIsQualified": "NO_SEPARATE_MODIFIER_IDENTIFIED_IN_SEARCHED_OFFICIAL_INDEXES" in amendments,
        "legalReviewStillPending": "legal_review_status: PENDING" in source,
        "complianceReviewStillPending": "compliance_review_status: PENDING" in source,
        "requirementActivationStillForbidden": "requirement_activation_allowed: false" in source,
        "detailedRequirementsRemainStructurallyValid": detailed["status"] == "PASS",
        "detailedRequirementCountNotRegressed": detailed_count >= 38,
        "detailedRequirementCountMatchesSource": source_count == detailed_count,
        "renderedPagesAvailable": all(width > 1000 and height > 1000 for width, height in png_dimensions.values()),
    }
    validation = {
        "validationId": "INST066_SOURCE_METADATA_CONSISTENCY_V0_1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "checks": checks,
        "sourceFacts": {
            "sha256": digest,
            "byteSize": PDF.stat().st_size,
            "pageCount": expected_pages,
            "actDateObserved": "2021-12-16",
            "effectiveFromObserved": "2022-01-01",
            "abrogatedReferenceCountObserved": len(references),
            "detailedRequirementCandidateCount": detailed_count,
            "renderedPageDimensions": png_dimensions,
        },
        "openItems": [
            "HISTORICAL_REGISTRY_CROSSCHECK",
            "AMENDMENTS_AND_RECTIFICATIONS_EXHAUSTIVE_REVIEW",
            "LEGAL_APPROVAL",
            "COMPLIANCE_APPROVAL",
            "PARAGRAPH_LEVEL_ATOMIZATION_REVIEW",
        ],
        "caveat": (
            "PASS means the source artifact and repository metadata are internally consistent. "
            "It does not approve legal interpretation or activate requirements."
        ),
    }
    OUTPUT.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    if validation["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
