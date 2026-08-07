#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC_DIR = ROOT / "regulatory" / "requirements" / "inst066-candidates"
MATRIX_DIR = ROOT / "regulatory" / "matrices"
COMPILED = ROOT / "regulatory" / "requirements" / "INST066_PROSPECTUS_REQUIREMENT_CANDIDATES_V0_1.json"
PLAN = ROOT / "regulatory" / "plans" / "INSTRUCTION_66_ATOMIZATION_PLAN_V0_1.yaml"
OUT = ROOT / "regulatory" / "validation" / "INST066_STAGED_SPEC_VALIDATION_V0_1.json"

REQ_ID_RE = re.compile(r"^INST066_ART(\d{3})_REQ(\d{3})$")
CIRC_ID_RE = re.compile(r"CIRC005_[A-Z0-9_]+")
EXPECTED_STATUS = "EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
EXPECTED_ACTIVATION = "FORBIDDEN"
REQUIRED_REQ_FIELDS = {
    "id",
    "articleNumber",
    "normalizedRequirementCandidate",
    "applicabilityCandidate",
    "products",
    "documentTypes",
    "canonicalFields",
    "questionIds",
    "clauseGroupIds",
    "controlIds",
    "evidenceTypes",
    "outputSectionIds",
    "reviewRoles",
    "circ005RequirementLinks",
}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def collect_circ005_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(MATRIX_DIR.glob("CIRC005_*.csv")):
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.reader(handle):
                for cell in row:
                    ids.update(CIRC_ID_RE.findall(cell))
    return ids


def parse_plan_counts() -> tuple[int | None, int | None]:
    text = PLAN.read_text(encoding="utf-8")
    compiled_match = re.search(r"(?m)^\s*compiled_count:\s*(\d+)\s*$", text)
    staged_match = re.search(r"(?m)^\s*staged_count:\s*(\d+)\s*$", text)
    expected_match = re.search(r"(?m)^\s*expected_compiled_total:\s*(\d+)\s*$", text)
    compiled = int(compiled_match.group(1)) if compiled_match else None
    staged = int(staged_match.group(1)) if staged_match else None
    expected = int(expected_match.group(1)) if expected_match else None
    if compiled is not None and staged is not None and expected is not None and compiled + staged != expected:
        raise ValueError(f"PLAN_COUNT_MISMATCH: compiled={compiled}, staged={staged}, expected={expected}")
    return staged, expected


def main() -> int:
    errors: list[str] = []
    spec_paths = sorted(SPEC_DIR.glob("*.json"))
    if not spec_paths:
        raise SystemExit("No Instruction 66 candidate specification files found")

    circ005_ids = collect_circ005_ids()
    all_ids: list[str] = []
    all_articles: list[int] = []
    total_requirements = 0
    file_counts: dict[str, int] = {}

    for path in spec_paths:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(errors, f"{path.relative_to(ROOT)}: invalid JSON: {exc}")
            continue

        if payload.get("schemaVersion") != "INST066_REQUIREMENT_SPEC_V0_1":
            fail(errors, f"{path.name}: unexpected schemaVersion {payload.get('schemaVersion')!r}")
        if payload.get("status") != EXPECTED_STATUS:
            fail(errors, f"{path.name}: status must remain {EXPECTED_STATUS}")
        if payload.get("activation") != EXPECTED_ACTIVATION:
            fail(errors, f"{path.name}: activation must remain {EXPECTED_ACTIVATION}")

        requirements = payload.get("requirements")
        if not isinstance(requirements, list) or not requirements:
            fail(errors, f"{path.name}: requirements must be a non-empty array")
            continue

        file_counts[str(path.relative_to(ROOT))] = len(requirements)
        total_requirements += len(requirements)

        for idx, req in enumerate(requirements, start=1):
            prefix = f"{path.name} requirement #{idx}"
            if not isinstance(req, dict):
                fail(errors, f"{prefix}: must be an object")
                continue
            missing = sorted(REQUIRED_REQ_FIELDS - set(req))
            if missing:
                fail(errors, f"{prefix}: missing fields {missing}")
                continue

            req_id = req.get("id")
            match = REQ_ID_RE.fullmatch(str(req_id))
            if not match:
                fail(errors, f"{prefix}: invalid requirement id {req_id!r}")
                continue

            article_from_id = int(match.group(1))
            article = req.get("articleNumber")
            if not isinstance(article, int) or not 1 <= article <= 92:
                fail(errors, f"{req_id}: articleNumber must be an integer in 1..92")
            elif article != article_from_id:
                fail(errors, f"{req_id}: articleNumber {article} does not match ID article {article_from_id}")

            all_ids.append(str(req_id))
            if isinstance(article, int):
                all_articles.append(article)

            normalized = req.get("normalizedRequirementCandidate")
            if not isinstance(normalized, str) or not normalized.strip():
                fail(errors, f"{req_id}: normalizedRequirementCandidate is empty")

            roles = req.get("reviewRoles")
            if not isinstance(roles, list) or "LEGAL" not in roles or "COMPLIANCE" not in roles:
                fail(errors, f"{req_id}: reviewRoles must include LEGAL and COMPLIANCE")

            for field in ("products", "documentTypes", "canonicalFields", "questionIds", "clauseGroupIds", "controlIds", "evidenceTypes", "outputSectionIds", "circ005RequirementLinks"):
                if not isinstance(req.get(field), list):
                    fail(errors, f"{req_id}: {field} must be an array")

            for circ_id in req.get("circ005RequirementLinks", []):
                if not isinstance(circ_id, str) or not CIRC_ID_RE.fullmatch(circ_id):
                    fail(errors, f"{req_id}: invalid CIRC005 link {circ_id!r}")
                elif circ_id not in circ005_ids:
                    fail(errors, f"{req_id}: unknown CIRC005 link {circ_id}")

    duplicates = sorted(req_id for req_id, count in Counter(all_ids).items() if count > 1)
    if duplicates:
        fail(errors, f"Duplicate Instruction 66 requirement IDs: {duplicates}")

    compiled_ids: set[str] = set()
    if COMPILED.exists():
        compiled_payload = json.loads(COMPILED.read_text(encoding="utf-8"))
        compiled_ids = {str(item.get("id")) for item in compiled_payload.get("requirements", []) if item.get("id")}
        unknown_compiled = sorted(compiled_ids - set(all_ids))
        if unknown_compiled:
            fail(errors, f"Compiled registry contains IDs absent from specs: {unknown_compiled}")

    try:
        staged_count, expected_total = parse_plan_counts()
    except ValueError as exc:
        fail(errors, str(exc))
        staged_count, expected_total = None, None

    compiled_count = len(compiled_ids)
    uncompiled_spec_ids = set(all_ids) - compiled_ids
    if staged_count is not None and len(uncompiled_spec_ids) != staged_count:
        fail(errors, f"Plan staged_count={staged_count} but specs contain {len(uncompiled_spec_ids)} uncompiled IDs")
    if expected_total is not None and total_requirements != expected_total:
        fail(errors, f"Plan expected_compiled_total={expected_total} but specs contain {total_requirements} requirements")

    result = {
        "schemaVersion": "INST066_STAGED_SPEC_VALIDATION_V0_1",
        "status": "PASS" if not errors else "FAIL",
        "activationAllowed": False,
        "metrics": {
            "specFileCount": len(spec_paths),
            "specRequirementCount": total_requirements,
            "compiledRequirementCount": compiled_count,
            "uncompiledStagedRequirementCount": len(uncompiled_spec_ids),
            "articleCoverageCount": len(set(all_articles)),
            "circ005IdentifierCount": len(circ005_ids),
        },
        "fileCounts": file_counts,
        "errors": errors,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
