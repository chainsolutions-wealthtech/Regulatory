#!/usr/bin/env python3
"""Overlay confirmed documentary resolutions on the immutable Instruction 66 inventory.

The raw inventory remains historical evidence. This script computes a current state
without rewriting it and without activating any requirement. Resolution counters are
computed from source-of-truth overlays; they are never hard-coded as expected values.
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

BLOCK_RE = re.compile(r"(?ms)^  - dependency_id:\s*(\S+)\s*\n(.*?)(?=^  - dependency_id:|\Z)")
FIELD_RE_TEMPLATE = r"(?m)^    {field}:\s*(.+?)\s*$"


def field(block: str, name: str) -> str | None:
    match = re.search(FIELD_RE_TEMPLATE.format(field=re.escape(name)), block)
    if not match:
        return None
    return match.group(1).strip().strip('"')


def resolution_section(text: str, source_name: str) -> str:
    """Return only the YAML `resolutions:` list, excluding explicitly-open entries."""
    start_match = re.search(r"(?m)^resolutions:\s*$", text)
    if not start_match:
        raise RuntimeError(f"resolutions section missing from {source_name}")
    start = start_match.end()
    end_match = re.search(r"(?m)^(?:explicitly_[A-Za-z0-9_]+|boundary):\s*", text[start:])
    end = start + end_match.start() if end_match else len(text)
    section = text[start:end]
    if not section.strip():
        raise RuntimeError(f"resolutions section empty in {source_name}")
    return section


def parse_resolution_overlay(path_value: Path) -> tuple[int, dict[str, dict[str, str]]]:
    text = path_value.read_text(encoding="utf-8")
    count_match = re.search(r"(?m)^resolution_count:\s*(\d+)\s*$", text)
    if not count_match:
        raise RuntimeError(f"resolution_count missing from {path_value.name}")
    declared_count = int(count_match.group(1))
    section = resolution_section(text, path_value.name)
    resolutions: dict[str, dict[str, str]] = {}
    for dependency_id, block in BLOCK_RE.findall(section):
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

    raw_resolved_ids = {
        str(item["dependencyId"])
        for item in dependencies
        if isinstance(item.get("resolvedSourceId"), str) and item["resolvedSourceId"].strip()
    }
    overlay_on_raw_resolved = sorted(set(overlay) & raw_resolved_ids)
    if overlay_on_raw_resolved:
        raise RuntimeError(f"overlay redundantly targets raw-resolved dependencies: {overlay_on_raw_resolved}")

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
            "officialReference": overlay_resolution.get("officialReference") if overlay_resolution else raw.get("officialReference"),
            "resolutionOrigin": resolution_origin,
            "resolutionOverlayRegistry": overlay_resolution.get("overlayRegistry") if overlay_resolution else None,
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
    raw_counts_by_kind = inventory["summary"].get("countsByKind", {})

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
            "rawInventoryResolvedCount": len(raw_resolved_ids),
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

    stable_kind_totals_match = all(
        counts_by_kind.get(kind, {}).get("total", 0) == expected
        for kind, expected in raw_counts_by_kind.items()
    ) and set(counts_by_kind) == set(raw_counts_by_kind)
    per_kind_arithmetic_valid = all(
        bucket["resolved"] + bucket["unresolved"] == bucket["total"]
        for bucket in counts_by_kind.values()
    )
    expected_resolved_from_sources = len(raw_resolved_ids) + declared_overlay_count

    checks = {
        "rawOccurrenceCountPreserved": total == raw_expected,
        "resolvedPlusUnresolvedEqualsTotal": len(resolved) + len(unresolved) == total,
        "overlayDeclaredCountsMatchParsed": declared_overlay_count == len(overlay),
        "overlayIdsAllExistInRawInventory": not unknown_overlay_ids,
        "overlayRegistriesDoNotOverlap": not overlap,
        "overlayDoesNotRedundantlyTargetRawResolved": not overlay_on_raw_resolved,
        "resolvedCountEqualsRawPlusConfirmedOverlay": len(resolved) == expected_resolved_from_sources,
        "kindTotalsMatchImmutableInventory": stable_kind_totals_match,
        "perKindResolvedUnresolvedArithmeticValid": per_kind_arithmetic_valid,
        "allEffectiveActivationsForbidden": all(item["activation"] == "FORBIDDEN" for item in effective),
        "allHumanReviewsPending": all(
            item["legalReviewStatus"] == "PENDING" and item["complianceReviewStatus"] == "PENDING"
            for item in effective
        ),
        "rawInventoryUnmodifiedByDesign": True,
        "readyForSubmissionFalse": True,
    }
    validation_result = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "schemaVersion": "INST066_CURRENT_EXTERNAL_DEPENDENCY_STATE_VALIDATION_V0_1",
        "result": validation_result,
        "computedSummary": output["summary"],
        "immutableInventoryExpectations": {
            "dependencyOccurrenceCount": raw_expected,
            "countsByKind": raw_counts_by_kind,
        },
        "checks": checks,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"result": validation_result, **output["summary"]}, ensure_ascii=False))
    if validation_result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
