#!/usr/bin/env python3
"""Overlay confirmed documentary resolutions on the immutable Instruction 66 inventory.

The raw inventory remains historical evidence. This script computes a current state
without rewriting it and without activating any requirement.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "regulatory/registries/INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json"
CIRCULAR_RESOLUTION_PATH = ROOT / "regulatory/registries/INST066_CONFIRMED_EXTERNAL_DEPENDENCY_RESOLUTIONS_V0_1.yaml"
INSTRUCTION_RESOLUTION_PATH = ROOT / "regulatory/registries/INST066_CONFIRMED_INSTRUCTION_DEPENDENCY_RESOLUTIONS_V0_1.yaml"
OUTPUT_PATH = ROOT / "regulatory/registries/INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_V0_1.json"
VALIDATION_PATH = ROOT / "regulatory/validation/INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_VALIDATION_V0_1.json"

BLOCK_RE = re.compile(
    r"(?ms)^  - dependency_id:\s*(\S+)\s*\n(.*?)(?=^  - dependency_id:|^boundary:|^explicitly_|\Z)"
)
FIELD_RE_TEMPLATE = r"(?m)^    {field}:\s*(.+?)\s*$"


def field(block: str, name: str) -> str | None:
    match = re.search(FIELD_RE_TEMPLATE.format(field=re.escape(name)), block)
    if not match:
        return None
    return match.group(1).strip().strip('"')


def parse_resolution_overlay(path_value: Path) -> tuple[int, dict[str, dict[str, str]]]:
    text = path_value.read_text(encoding="utf-8")
    count_match = re.search(r"(?m)^resolution_count:\s*(\d+)\s*$", text)
    if not count_match:
        raise RuntimeError(f"resolution_count missing from {path_value.name}")
    declared_count = int(count_match.group(1))
    resolutions: dict[str, dict[str, str]] = {}
    for dependency_id, block in BLOCK_RE.findall(text):
        if dependency_id in resolutions:
            raise RuntimeError(f"duplicate dependency_id in {path_value.name}: {dependency_id}")
        source_id = field(block, "resolved_source_id")
        official_reference = field(block, "official_reference")
        documentary_status = field(block, "documentary_status")
        activation = field(block, "activation")
        legal_review = field(block, "legal_review_status")
        compliance_review = field(block, "compliance_review_status")
        if not source_id or documentary_status != "RESOLVED":
            raise RuntimeError(f"invalid documentary resolution block: {dependency_id}")
        if activation != "FORBIDDEN":
            raise RuntimeError(f"resolved dependency activation must remain FORBIDDEN: {dependency_id}")
        if legal_review != "PENDING" or compliance_review != "PENDING":
            raise RuntimeError(f"human review boundary changed unexpectedly: {dependency_id}")
        resolutions[dependency_id] = {
            "resolvedSourceId": source_id,
            "officialReference": official_reference or "",
            "documentaryStatus": documentary_status,
            "activation": activation,
            "overlayRegistry": str(path_value.relative_to(ROOT)),
        }
    if declared_count != len(resolutions):
        raise RuntimeError(
            f"resolution_count mismatch in {path_value.name}: declared={declared_count} parsed={len(resolutions)}"
        )
    return declared_count, resolutions


def main() -> None:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    circular_count, circular_overlay = parse_resolution_overlay(CIRCULAR_RESOLUTION_PATH)
    instruction_count, instruction_overlay = parse_resolution_overlay(INSTRUCTION_RESOLUTION_PATH)

    overlap = sorted(set(circular_overlay) & set(instruction_overlay))
    if overlap:
        raise RuntimeError(f"dependency IDs duplicated across resolution overlays: {overlap}")
    overlay = {**circular_overlay, **instruction_overlay}
    declared_overlay_count = circular_count + instruction_count

    dependencies = inventory.get("dependencies")
    if not isinstance(dependencies, list):
        raise RuntimeError("raw inventory dependencies missing")

    raw_ids = {item.get("dependencyId") for item in dependencies}
    unknown_overlay_ids = sorted(set(overlay) - raw_ids)
    if unknown_overlay_ids:
        raise RuntimeError(f"overlay contains IDs absent from raw inventory: {unknown_overlay_ids}")

    effective: list[dict[str, object]] = []
    unresolved: list[dict[str, object]] = []
    resolved: list[dict[str, object]] = []
    counts_by_kind: dict[str, dict[str, int]] = {}

    for raw in dependencies:
        dependency_id = str(raw["dependencyId"])
        kind = str(raw["dependencyKind"])
        raw_source = raw.get("resolvedSourceId")
        raw_is_resolved = isinstance(raw_source, str) and bool(raw_source.strip())
        overlay_resolution = overlay.get(dependency_id)
        effective_source = overlay_resolution["resolvedSourceId"] if overlay_resolution else raw_source
        is_resolved = isinstance(effective_source, str) and bool(effective_source.strip())
        resolution_origin = (
            "CONFIRMED_RESOLUTION_OVERLAY"
            if overlay_resolution
            else "RAW_INVENTORY"
            if raw_is_resolved
            else "UNRESOLVED"
        )
        item = {
            "dependencyId": dependency_id,
            "articleNumber": raw.get("articleNumber"),
            "articleTitle": raw.get("articleTitle"),
            "dependencyKind": kind,
            "sourceWording": raw.get("sourceWording"),
            "sourceContext": raw.get("sourceContext"),
            "rawReferenceStatus": raw.get("referenceStatus"),
            "effectiveReferenceStatus": "RESOLVED_DOCUMENTARY" if is_resolved else "UNRESOLVED",
            "resolvedSourceId": effective_source if is_resolved else None,
            "officialReference": (
                overlay_resolution.get("officialReference")
                if overlay_resolution
                else raw.get("officialReference")
            ),
            "resolutionOrigin": resolution_origin,
            "resolutionOverlayRegistry": (
                overlay_resolution.get("overlayRegistry") if overlay_resolution else None
            ),
            "activation": "FORBIDDEN",
            "legalReviewStatus": "PENDING",
            "complianceReviewStatus": "PENDING",
        }
        effective.append(item)
        (resolved if is_resolved else unresolved).append(item)
        bucket = counts_by_kind.setdefault(kind, {"total": 0, "resolved": 0, "unresolved": 0})
        bucket["total"] += 1
        bucket["resolved" if is_resolved else "unresolved"] += 1

    total = len(effective)
    raw_expected = int(inventory["summary"]["dependencyOccurrenceCount"])
    if total != raw_expected:
        raise RuntimeError(f"raw occurrence count mismatch: {total} != {raw_expected}")

    circular = counts_by_kind.get("COUNCIL_CIRCULAR", {})
    instruction = counts_by_kind.get("COUNCIL_INSTRUCTION", {})
    named_instruction = counts_by_kind.get("EXPLICIT_NAMED_CREPMF_INSTRUCTION", {})
    output = {
        "schemaVersion": "INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_V0_1",
        "sourceInventory": str(INVENTORY_PATH.relative_to(ROOT)),
        "confirmedResolutionOverlays": [
            str(CIRCULAR_RESOLUTION_PATH.relative_to(ROOT)),
            str(INSTRUCTION_RESOLUTION_PATH.relative_to(ROOT)),
        ],
        "sourceInstructionSha256": inventory.get("sourceSha256"),
        "status": "CURRENT_DOCUMENTARY_STATE_HUMAN_LEGAL_AND_COMPLIANCE_REVIEW_PENDING",
        "summary": {
            "dependencyOccurrenceCount": total,
            "resolvedDocumentaryCount": len(resolved),
            "unresolvedDocumentaryCount": len(unresolved),
            "confirmedOverlayResolutionCount": declared_overlay_count,
            "confirmedCircularOverlayResolutionCount": circular_count,
            "confirmedInstructionFamilyOverlayResolutionCount": instruction_count,
            "circularOccurrenceCount": circular.get("total", 0),
            "resolvedCircularCount": circular.get("resolved", 0),
            "unresolvedCircularCount": circular.get("unresolved", 0),
            "instructionOccurrenceCount": instruction.get("total", 0),
            "resolvedInstructionCount": instruction.get("resolved", 0),
            "unresolvedInstructionCount": instruction.get("unresolved", 0),
            "namedInstructionOccurrenceCount": named_instruction.get("total", 0),
            "resolvedNamedInstructionCount": named_instruction.get("resolved", 0),
            "unresolvedNamedInstructionCount": named_instruction.get("unresolved", 0),
            "countsByKind": counts_by_kind,
        },
        "unresolvedDependencies": unresolved,
        "resolvedDependencies": resolved,
        "boundary": {
            "rawInventoryMutated": False,
            "documentaryResolutionIsRequirementActivation": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }

    expected_summary = {
        "dependencyOccurrenceCount": 49,
        "resolvedDocumentaryCount": 31,
        "unresolvedDocumentaryCount": 18,
        "confirmedOverlayResolutionCount": 29,
        "confirmedCircularOverlayResolutionCount": 25,
        "confirmedInstructionFamilyOverlayResolutionCount": 4,
        "circularOccurrenceCount": 34,
        "resolvedCircularCount": 25,
        "unresolvedCircularCount": 9,
        "instructionOccurrenceCount": 7,
        "resolvedInstructionCount": 3,
        "unresolvedInstructionCount": 4,
        "namedInstructionOccurrenceCount": 1,
        "resolvedNamedInstructionCount": 1,
        "unresolvedNamedInstructionCount": 0,
    }
    actual_summary = output["summary"]
    checks = {key: actual_summary[key] == expected for key, expected in expected_summary.items()}
    checks.update(
        {
            "overlayIdsAllExistInRawInventory": not unknown_overlay_ids,
            "overlayRegistriesDoNotOverlap": not overlap,
            "allEffectiveActivationsForbidden": all(item["activation"] == "FORBIDDEN" for item in effective),
            "rawInventoryUnmodifiedByDesign": True,
            "readyForSubmissionFalse": True,
        }
    )
    validation_result = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "schemaVersion": "INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_VALIDATION_V0_1",
        "result": validation_result,
        "expectedSummary": expected_summary,
        "actualSummary": {key: actual_summary[key] for key in expected_summary},
        "checks": checks,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"result": validation_result, **validation["actualSummary"]}, ensure_ascii=False))
    if validation_result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
