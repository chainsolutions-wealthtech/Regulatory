#!/usr/bin/env python3
"""Compile detailed, non-activated Instruction 66 requirement candidates."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BLOCKS_PATH = ROOT / "regulatory/requirements/INST066_ARTICLE_BLOCKS_V0_1.json"
SPEC_DIRECTORY = ROOT / "regulatory/requirements/inst066-candidates"
OUTPUT_PATH = ROOT / "regulatory/requirements/INST066_PROSPECTUS_REQUIREMENT_CANDIDATES_V0_1.json"
CROSSWALK_PATH = ROOT / "regulatory/matrices/INST066_CIRC005_DETAILED_CROSSWALK_V0_1.csv"
VALIDATION_PATH = ROOT / "regulatory/validation/INST066_DETAILED_REQUIREMENTS_VALIDATION_V0_1.json"
STATUS = "EXTRACTED_UNVERIFIED_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
ACTIVATION = "FORBIDDEN"
REQUIRED_KEYS = {
    "id", "articleNumber", "normalizedRequirementCandidate", "keywords",
    "applicabilityCandidate", "products", "documentTypes", "canonicalFields",
    "questionIds", "clauseGroupIds", "controlIds", "evidenceTypes",
    "outputSectionIds", "reviewRoles", "circ005RequirementLinks",
}


def main() -> None:
    blocks_document = read_json(BLOCKS_PATH)
    source_sha = blocks_document["sourceSha256"]
    blocks = {item["articleNumber"]: item for item in blocks_document["articles"]}
    if sorted(blocks) != list(range(1, 93)):
        raise RuntimeError("INST066_DETAILED_COMPILATION_REQUIRES_92_ARTICLE_BLOCKS")

    circ005_ids = load_circ005_ids()
    specs = load_specs()
    compiled = [compile_spec(spec, blocks, circ005_ids, source_sha) for spec in specs]
    compiled.sort(key=lambda item: (item["articleNumber"], item["id"]))

    document = {
        "schemaVersion": "INST066_PROSPECTUS_REQUIREMENT_CANDIDATES_V0_1",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "status": STATUS,
        "activation": ACTIVATION,
        "requirementCandidateCount": len(compiled),
        "requirements": compiled,
        "caveat": (
            "Les résumés normatifs, applicabilités, champs, questions, clauses et contrôles "
            "sont des candidats de modélisation. Ils restent inactifs jusqu'à double revue "
            "juridique et conformité fondée sur le PDF officiel."
        ),
    }
    write_json(OUTPUT_PATH, document)
    write_crosswalk(compiled)
    validation = validate(compiled, circ005_ids, source_sha)
    write_json(VALIDATION_PATH, validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    if validation["status"] != "PASS":
        raise SystemExit(1)


def load_specs() -> list[dict[str, Any]]:
    specs: list[dict[str, Any]] = []
    for path in sorted(SPEC_DIRECTORY.glob("*.json")):
        document = read_json(path)
        if document.get("status") != STATUS or document.get("activation") != ACTIVATION:
            raise RuntimeError(f"INST066_SPEC_MUST_REMAIN_INACTIVE:{path}")
        for spec in document.get("requirements", []):
            missing = sorted(REQUIRED_KEYS - set(spec))
            if missing:
                raise RuntimeError(f"INST066_SPEC_KEYS_MISSING:{path}:{spec.get('id')}:{missing}")
            spec = {**spec, "specFile": str(path.relative_to(ROOT))}
            specs.append(spec)
    if not specs:
        raise RuntimeError("INST066_DETAILED_REQUIREMENT_SPECS_MISSING")
    return specs


def compile_spec(
    spec: dict[str, Any],
    blocks: dict[int, dict[str, Any]],
    circ005_ids: set[str],
    source_sha: str,
) -> dict[str, Any]:
    article = int(spec["articleNumber"])
    block = blocks.get(article)
    if not block:
        raise RuntimeError(f"INST066_SPEC_ARTICLE_MISSING:{spec['id']}:{article}")
    unknown_links = sorted(set(spec["circ005RequirementLinks"]) - circ005_ids)
    if unknown_links:
        raise RuntimeError(f"INST066_SPEC_CIRC005_LINK_UNKNOWN:{spec['id']}:{unknown_links}")
    if set(spec["reviewRoles"]) != {"LEGAL", "COMPLIANCE"} and not (
        "LEGAL" in spec["reviewRoles"] and "COMPLIANCE" in spec["reviewRoles"]
    ):
        raise RuntimeError(f"INST066_SPEC_DUAL_REVIEW_REQUIRED:{spec['id']}")

    excerpt, keyword_hits = focused_excerpt(block["ocrText"], spec["keywords"])
    return {
        "id": spec["id"],
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "articleId": block["articleId"],
        "articleNumber": article,
        "sourcePages": list(range(block["startPage"], block["endPage"] + 1)),
        "sourceArticleTextSha256": block["ocrTextSha256"],
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
        "status": STATUS,
        "activation": ACTIVATION,
        "legalReviewStatus": "PENDING",
        "complianceReviewStatus": "PENDING",
        "specFile": spec["specFile"],
        "provenance": {
            "sourceArtifact": "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf",
            "ocrDerivative": "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.txt",
            "articleBlock": "regulatory/requirements/INST066_ARTICLE_BLOCKS_V0_1.json",
            "textQuality": "OCR_EXTRACTED_UNVERIFIED",
        },
    }


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
                if row.get("requirement_id"):
                    values.add(row["requirement_id"].strip())
    return values


def write_crosswalk(requirements: list[dict[str, Any]]) -> None:
    with CROSSWALK_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter=";", lineterminator="\n")
        writer.writerow([
            "inst066_requirement_id", "article_number", "circ005_requirement_id",
            "relationship", "canonical_fields", "controls", "review_status", "activation",
        ])
        for item in requirements:
            links = item["circ005RequirementLinks"] or [""]
            for link in links:
                writer.writerow([
                    item["id"], item["articleNumber"], link,
                    "SUPPLEMENTS_OR_CONSTRAINS" if link else "NO_EXACT_LINK_IDENTIFIED",
                    "|".join(item["canonicalFields"]), "|".join(item["controlIds"]),
                    "PENDING_LEGAL_AND_COMPLIANCE_REVIEW", ACTIVATION,
                ])


def validate(requirements: list[dict[str, Any]], circ005_ids: set[str], source_sha: str) -> dict[str, Any]:
    ids = [item["id"] for item in requirements]
    links = {link for item in requirements for link in item["circ005RequirementLinks"]}
    forbidden_words = {"ACTIVE", "APPROVED", "VALIDATED"}
    checks = {
        "sourceDigestValid": bool(re.fullmatch(r"[0-9a-f]{64}", source_sha)),
        "requirementIdsUnique": len(set(ids)) == len(ids),
        "stableRequirementIdFormat": all(re.fullmatch(r"INST066_ART[0-9]{3}_REQ[0-9]{3}", value) for value in ids),
        "allSourceArticlesValid": all(1 <= item["articleNumber"] <= 92 for item in requirements),
        "allSourceDigestsPresent": all(re.fullmatch(r"[0-9a-f]{64}", item["sourceArticleTextSha256"]) for item in requirements),
        "allRequirementsInactive": all(item["activation"] == ACTIVATION for item in requirements),
        "allRequirementsUnverified": all(item["status"] == STATUS for item in requirements),
        "noForbiddenStatus": all(item["status"] not in forbidden_words for item in requirements),
        "dualHumanReviewRequired": all("LEGAL" in item["reviewRoles"] and "COMPLIANCE" in item["reviewRoles"] for item in requirements),
        "allCirc005LinksResolve": links <= circ005_ids,
        "allRequirementsHaveControls": all(item["controlIds"] for item in requirements),
        "allRequirementsHaveEvidence": all(item["evidenceTypes"] for item in requirements),
        "allRequirementsHaveOutputOrSystemLocation": all(item["outputSectionIds"] for item in requirements),
    }
    return {
        "validationId": "INST066_DETAILED_REQUIREMENTS_VALIDATION_V0_1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "sourceId": "INSTRUCTION_66_CREPMF_2021",
        "sourceSha256": source_sha,
        "checks": checks,
        "metrics": {
            "requirementCandidateCount": len(requirements),
            "coveredArticleNumbers": sorted({item["articleNumber"] for item in requirements}),
            "circ005CrosswalkLinks": sum(len(item["circ005RequirementLinks"]) for item in requirements),
            "requirementsWithKeywordHits": sum(bool(item["sourceKeywordHits"]) for item in requirements),
        },
        "outputs": [str(OUTPUT_PATH.relative_to(ROOT)), str(CROSSWALK_PATH.relative_to(ROOT))],
        "caveat": "Validation structurelle uniquement; aucune interprétation juridique n'est approuvée.",
    }


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
