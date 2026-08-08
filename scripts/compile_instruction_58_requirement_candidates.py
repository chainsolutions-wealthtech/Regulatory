#!/usr/bin/env python3
"""Compile detailed, non-activated Instruction 58 requirement candidates."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BLOCKS_PATH = ROOT / "regulatory/requirements/INST058_ARTICLE_BLOCKS_V0_1.json"
ATOMS_PATH = ROOT / "regulatory/requirements/INST058_ARTICLE_ATOMS_V0_1.json"
SPEC_DIRECTORY = ROOT / "regulatory/requirements/inst058-candidates"
INST066_PATH = ROOT / "regulatory/requirements/INST066_PROSPECTUS_REQUIREMENT_CANDIDATES_V0_1.json"
OUTPUT_PATH = ROOT / "regulatory/requirements/INST058_AUDITOR_REQUIREMENT_CANDIDATES_V0_1.json"
CROSSWALK_PATH = ROOT / "regulatory/matrices/INST058_CIRC005_INST066_CROSSWALK_V0_1.csv"
VALIDATION_PATH = ROOT / "regulatory/validation/INST058_DETAILED_REQUIREMENTS_VALIDATION_V0_1.json"
STATUS = "EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
ACTIVATION = "FORBIDDEN"
REQUIRED_KEYS = {
    "id", "articleNumber", "normalizedRequirementCandidate", "keywords",
    "applicabilityCandidate", "products", "documentTypes", "canonicalFields",
    "questionIds", "clauseGroupIds", "controlIds", "evidenceTypes",
    "outputSectionIds", "reviewRoles", "circ005RequirementLinks",
    "inst066RequirementLinks",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def focused_excerpt(text: str, keywords: list[str], maximum: int = 1800) -> tuple[str, list[str]]:
    normalized = normalize(text)
    folded = normalized.casefold()
    hits = [keyword for keyword in keywords if keyword.casefold() in folded]
    positions = [folded.find(keyword.casefold()) for keyword in hits]
    center = min(positions) if positions else 0
    start = max(0, center - 350)
    end = min(len(normalized), start + maximum)
    value = normalized[start:end]
    if start:
        value = "…" + value
    if end < len(normalized):
        value += "…"
    return value, hits


def load_circ005_ids() -> set[str]:
    values: set[str] = set()
    for path in sorted((ROOT / "regulatory/matrices").glob("CIRC005_*.csv")):
        with path.open("r", encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle, delimiter=";"):
                requirement_id = (row.get("requirement_id") or "").strip()
                if requirement_id:
                    values.add(requirement_id)
    return values


def load_inst066_ids() -> set[str]:
    document = read_json(INST066_PATH)
    if document.get("activation") != ACTIVATION:
        raise RuntimeError("INST066_REGISTRY_MUST_REMAIN_INACTIVE")
    return {item["id"] for item in document.get("requirements", [])}


def load_specs() -> list[dict[str, Any]]:
    specs: list[dict[str, Any]] = []
    for path in sorted(SPEC_DIRECTORY.glob("*.json")):
        document = read_json(path)
        if document.get("status") != STATUS or document.get("activation") != ACTIVATION:
            raise RuntimeError(f"INST058_SPEC_MUST_REMAIN_INACTIVE:{path}")
        for raw in document.get("requirements", []):
            missing = sorted(REQUIRED_KEYS - set(raw))
            if missing:
                raise RuntimeError(f"INST058_SPEC_KEYS_MISSING:{path}:{raw.get('id')}:{missing}")
            specs.append({**raw, "specFile": str(path.relative_to(ROOT))})
    if not specs:
        raise RuntimeError("INST058_DETAILED_REQUIREMENT_SPECS_MISSING")
    return specs


def compile_spec(
    spec: dict[str, Any],
    blocks: dict[int, dict[str, Any]],
    circ005_ids: set[str],
    inst066_ids: set[str],
    source_sha: str,
) -> dict[str, Any]:
    article = int(spec["articleNumber"])
    block = blocks.get(article)
    if not block:
        raise RuntimeError(f"INST058_SPEC_ARTICLE_MISSING:{spec['id']}:{article}")
    unknown_circ = sorted(set(spec["circ005RequirementLinks"]) - circ005_ids)
    if unknown_circ:
        raise RuntimeError(f"INST058_SPEC_CIRC005_LINK_UNKNOWN:{spec['id']}:{unknown_circ}")
    unknown_066 = sorted(set(spec["inst066RequirementLinks"]) - inst066_ids)
    if unknown_066:
        raise RuntimeError(f"INST058_SPEC_INST066_LINK_UNKNOWN:{spec['id']}:{unknown_066}")
    if not ("LEGAL" in spec["reviewRoles"] and "COMPLIANCE" in spec["reviewRoles"]):
        raise RuntimeError(f"INST058_SPEC_DUAL_REVIEW_REQUIRED:{spec['id']}")

    excerpt, keyword_hits = focused_excerpt(block["sourceTextCandidate"], spec["keywords"])
    return {
        "id": spec["id"],
        "sourceId": "INSTRUCTION_58_CREPMF_2019",
        "sourceSha256": source_sha,
        "articleId": block["articleId"],
        "articleNumber": article,
        "sourceBlockId": block["id"],
        "sourcePages": block["sourcePages"],
        "sourceArticleTextSha256": block["sourceTextSha256"],
        "sourceTextCandidate": excerpt,
        "sourceKeywordHits": keyword_hits,
        "normalizedRequirementCandidate": spec["normalizedRequirementCandidate"],
        "applicabilityCandidate": spec["applicabilityCandidate"],
        "products": spec["products"],
        "documentTypes": spec["documentTypes"],
        "canonicalFields": spec["canonicalFields"],
        "questionIds": spec["questionIds"],
        "clauseGroupIds": spec["clauseGroupIds"],
        "controlIds": spec["controlIds"],
        "evidenceTypes": spec["evidenceTypes"],
        "outputSectionIds": spec["outputSectionIds"],
        "reviewRoles": spec["reviewRoles"],
        "circ005RequirementLinks": spec["circ005RequirementLinks"],
        "inst066RequirementLinks": spec["inst066RequirementLinks"],
        "status": STATUS,
        "activation": ACTIVATION,
        "legalReviewStatus": "PENDING",
        "complianceReviewStatus": "PENDING",
        "specFile": spec["specFile"],
        "provenance": {
            "sourceArtifact": "regulatory/materialized/INSTRUCTION_58_CREPMF_2019.pdf",
            "ocrDerivative": "regulatory/materialized/INSTRUCTION_58_CREPMF_2019.txt",
            "articleBlock": "regulatory/requirements/INST058_ARTICLE_BLOCKS_V0_1.json",
            "textQuality": "OCR_EXTRACTED_UNVERIFIED",
        },
    }


def write_crosswalk(requirements: list[dict[str, Any]]) -> None:
    with CROSSWALK_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter=";", lineterminator="\n")
        writer.writerow([
            "inst058_requirement_id", "article_number", "circ005_requirement_id",
            "inst066_requirement_id", "relationship", "canonical_fields", "controls",
            "review_status", "activation",
        ])
        for item in requirements:
            circ_links = item["circ005RequirementLinks"] or [""]
            inst066_links = item["inst066RequirementLinks"] or [""]
            for circ in circ_links:
                for inst066 in inst066_links:
                    writer.writerow([
                        item["id"], item["articleNumber"], circ, inst066,
                        "SUPPLEMENTS_OR_CONSTRAINS",
                        "|".join(item["canonicalFields"]),
                        "|".join(item["controlIds"]),
                        "PENDING_LEGAL_AND_COMPLIANCE_REVIEW", ACTIVATION,
                    ])


def validate(
    requirements: list[dict[str, Any]],
    specs: list[dict[str, Any]],
    circ005_ids: set[str],
    inst066_ids: set[str],
    source_sha: str,
) -> dict[str, Any]:
    ids = [item["id"] for item in requirements]
    spec_ids = [item["id"] for item in specs]
    circ_links = {link for item in requirements for link in item["circ005RequirementLinks"]}
    inst066_links = {link for item in requirements for link in item["inst066RequirementLinks"]}
    checks = {
        "sourceDigestValid": bool(re.fullmatch(r"[0-9a-f]{64}", source_sha)),
        "allSpecsCompiled": sorted(ids) == sorted(spec_ids),
        "requirementIdsUnique": len(ids) == len(set(ids)),
        "stableRequirementIdFormat": all(re.fullmatch(r"INST058_ART[0-9]{3}_REQ[0-9]{3}", value) for value in ids),
        "allSourceArticlesValid": all(1 <= item["articleNumber"] <= 35 for item in requirements),
        "allSourceDigestsPresent": all(re.fullmatch(r"[0-9a-f]{64}", item["sourceArticleTextSha256"]) for item in requirements),
        "allRequirementsInactive": all(item["activation"] == ACTIVATION for item in requirements),
        "allRequirementsUnverified": all(item["status"] == STATUS for item in requirements),
        "explicitReviewStatesPending": all(item["legalReviewStatus"] == "PENDING" and item["complianceReviewStatus"] == "PENDING" for item in requirements),
        "dualHumanReviewRequired": all("LEGAL" in item["reviewRoles"] and "COMPLIANCE" in item["reviewRoles"] for item in requirements),
        "allCirc005LinksResolve": circ_links <= circ005_ids,
        "allInst066LinksResolve": inst066_links <= inst066_ids,
        "allRequirementsHaveControls": all(item["controlIds"] for item in requirements),
        "allRequirementsHaveEvidence": all(item["evidenceTypes"] for item in requirements),
        "allRequirementsHaveOutputOrSystemLocation": all(item["outputSectionIds"] for item in requirements),
        "sourceStatusNotPromoted": True,
    }
    return {
        "validationId": "INST058_DETAILED_REQUIREMENTS_VALIDATION_V0_1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "sourceId": "INSTRUCTION_58_CREPMF_2019",
        "sourceSha256": source_sha,
        "checks": checks,
        "metrics": {
            "requirementCandidateCount": len(requirements),
            "coveredArticleNumbers": sorted({item["articleNumber"] for item in requirements}),
            "circ005CrosswalkLinks": sum(len(item["circ005RequirementLinks"]) for item in requirements),
            "inst066CrosswalkLinks": sum(len(item["inst066RequirementLinks"]) for item in requirements),
            "requirementsWithKeywordHits": sum(bool(item["sourceKeywordHits"]) for item in requirements),
        },
        "outputs": [str(OUTPUT_PATH.relative_to(ROOT)), str(CROSSWALK_PATH.relative_to(ROOT))],
        "caveat": "Validation structurelle uniquement; aucune interprétation juridique ni sanction n'est activée.",
    }


def main() -> None:
    blocks_doc = read_json(BLOCKS_PATH)
    atoms_doc = read_json(ATOMS_PATH)
    source_sha = blocks_doc["sourceSha256"]
    if blocks_doc.get("articleBlockCount") != 35 or atoms_doc.get("articleAtomCount") != 35:
        raise RuntimeError("INST058_COMPILATION_REQUIRES_35_BLOCKS_AND_35_ATOMS")
    blocks = {item["articleNumber"]: item for item in blocks_doc["blocks"]}
    if sorted(blocks) != list(range(1, 36)):
        raise RuntimeError("INST058_COMPILATION_REQUIRES_CONTINUOUS_ARTICLES_1_TO_35")

    circ005_ids = load_circ005_ids()
    inst066_ids = load_inst066_ids()
    specs = load_specs()
    compiled = [compile_spec(spec, blocks, circ005_ids, inst066_ids, source_sha) for spec in specs]
    compiled.sort(key=lambda item: (item["articleNumber"], item["id"]))

    document = {
        "schemaVersion": "INST058_AUDITOR_REQUIREMENT_CANDIDATES_V0_1",
        "sourceId": "INSTRUCTION_58_CREPMF_2019",
        "sourceSha256": source_sha,
        "status": STATUS,
        "activation": ACTIVATION,
        "requirementCandidateCount": len(compiled),
        "requirements": compiled,
        "caveat": (
            "Les résumés, applicabilités, délais, sanctions, champs, questions et contrôles "
            "restent des candidats inactifs jusqu'à double revue juridique et conformité. "
            "La Décision n°CM/SJ/001/03/2016 doit être matérialisée séparément avant toute "
            "interprétation ou calcul de sanction."
        ),
    }
    OUTPUT_PATH.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_crosswalk(compiled)
    validation = validate(compiled, specs, circ005_ids, inst066_ids, source_sha)
    VALIDATION_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    if validation["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
