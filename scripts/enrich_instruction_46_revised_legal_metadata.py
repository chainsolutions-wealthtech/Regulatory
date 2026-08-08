#!/usr/bin/env python3
"""Curate legal metadata and article index for the materialized revised Instruction 46.

This script promotes only facts directly observed in the official materialized text.
The source remains historical and abrogated by Instruction 66 article 92.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ID = "INSTRUCTION_46_CREPMF_2011_REVISEE"
TEXT_PATH = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.txt"
METADATA_PATH = ROOT / "regulatory" / "materialized" / f"{SOURCE_ID}.metadata.json"
VALIDATION_PATH = ROOT / "regulatory" / "validation" / "INST046_REVISED_MATERIALIZATION_VALIDATION_V0_1.json"
SOURCE_PATH = ROOT / "regulatory" / "sources" / f"{SOURCE_ID}.yaml"
INDEX_PATH = ROOT / "regulatory" / "requirements" / "INST046_REVISED_ARTICLE_INDEX_V0_1.yaml"

REVISION_DATE = "2018-07-30"
EFFECTIVE_FROM = "2018-07-30"
ARTICLE_RE = re.compile(r"(?mi)^\s*Article\s+(?P<label>1(?:er|°°)?|[0-9]{1,2})\s*$")


def main() -> None:
    text = TEXT_PATH.read_text(encoding="utf-8")
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))

    required_fragments = [
        "Article 20",
        "d’un délai de six (06) mois",
        "Article 21",
        "prend     effet à compter           de la date     de sa signature",
        "Fait à Abidjan, le 30 juillet 2018",
    ]
    missing = [fragment for fragment in required_fragments if fragment not in text]
    if missing:
        raise RuntimeError(f"CURATED_LEGAL_EVIDENCE_NOT_FOUND:{missing}")

    articles = article_locations(text)
    article_numbers = [item[0] for item in articles]
    expected = list(range(1, 22))
    if article_numbers != expected:
        raise RuntimeError(f"ARTICLE_SEQUENCE_MISMATCH:{article_numbers}")

    legal = metadata.setdefault("legalMetadata", {})
    legal.update(
        {
            "revisionDate": REVISION_DATE,
            "effectiveFrom": EFFECTIVE_FROM,
            "effectiveDateRule": "ARTICLE_21_EFFECTIVE_ON_SIGNATURE_DATE",
            "transitionalRule": {
                "article": 20,
                "scope": "OPCVM_AGREES_AVANT_PUBLICATION",
                "compliancePeriodMonths": 6,
                "status": "CURATED_FROM_OFFICIAL_MATERIALIZED_SOURCE_TEXT",
            },
            "finalClause": {
                "article": 21,
                "abrogationWordingScope": "ALL_PRIOR_CONTRARY_PROVISIONS",
                "status": "CURATED_FROM_OFFICIAL_MATERIALIZED_SOURCE_TEXT",
            },
            "relationshipToDecision2012_119": "PENDING_HISTORICAL_OFFICIAL_SOURCE_REVIEW",
            "currentLegalStatus": "ABROGATED_BY_INSTRUCTION_66_EFFECTIVE_2022_01_01",
            "reviewStatus": "PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
            "evidenceStatus": "CURATED_FROM_OFFICIAL_MATERIALIZED_SOURCE_TEXT",
        }
    )
    metadata["articleIndex"] = relative(INDEX_PATH)
    metadata["articleIndexCount"] = len(articles)
    metadata["firstIndexedArticle"] = 1
    metadata["lastIndexedArticle"] = 21
    metadata["missingArticleNumbers"] = []
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    write_index(articles)

    checks = validation.setdefault("checks", {})
    checks.update(
        {
            "curatedLegalMetadataEnriched": True,
            "article20TransitionalRuleCaptured": True,
            "article21EffectiveDateRuleCaptured": True,
            "articleSequenceContinuous1To21": True,
            "historicalAbrogationPreserved": True,
            "historicalRuleReactivationForbidden": True,
            "requirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
        }
    )
    validation["status"] = "PASS" if validation_checks_pass(checks) else "FAIL"
    validation["legalMetadataEnrichment"] = {
        "status": "PASS",
        "revisionDate": REVISION_DATE,
        "effectiveFrom": EFFECTIVE_FROM,
        "effectiveDateRule": "ARTICLE_21_EFFECTIVE_ON_SIGNATURE_DATE",
        "transitionalPeriodMonths": 6,
        "articleCount": 21,
        "activationAllowed": False,
    }
    validation.setdefault("outputs", []).append(relative(INDEX_PATH)) if relative(INDEX_PATH) not in validation.setdefault("outputs", []) else None
    VALIDATION_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sync_source_record()

    print(
        json.dumps(
            {
                "sourceId": SOURCE_ID,
                "revisionDate": REVISION_DATE,
                "effectiveFrom": EFFECTIVE_FROM,
                "articleCount": 21,
                "relationshipToDecision2012_119": "PENDING_HISTORICAL_OFFICIAL_SOURCE_REVIEW",
                "currentLegalStatus": "ABROGATED_BY_INSTRUCTION_66_EFFECTIVE_2022_01_01",
                "activationAllowed": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def article_locations(text: str) -> list[tuple[int, int]]:
    locations: list[tuple[int, int]] = []
    for match in ARTICLE_RE.finditer(text):
        label = match.group("label").lower().replace("°", "")
        number = 1 if label.startswith("1er") else int(re.sub(r"\D", "", label) or "1")
        line = text.count("\n", 0, match.start()) + 1
        locations.append((number, line))
    unique: dict[int, int] = {}
    for number, line in locations:
        unique.setdefault(number, line)
    return sorted(unique.items())


def write_index(articles: list[tuple[int, int]]) -> None:
    lines = [
        "index_id: INST046_REVISED_ARTICLE_INDEX_V0_1",
        f"source_id: {SOURCE_ID}",
        "status: HISTORICAL_SOURCE_INDEX_EXTRACTED_UNVERIFIED",
        "historical_status: EXPLICITLY_ABROGATED_BY_INSTRUCTION_66_ARTICLE_92",
        "requirement_activation: FORBIDDEN",
        "article_count: 21",
        "first_article: 1",
        "last_article: 21",
        "missing_article_numbers: []",
        "articles:",
    ]
    for number, line in articles:
        lines.extend(
            [
                f"  - id: INST046_REVISED_ARTICLE_{number:03d}",
                f"    article_number: {number}",
                f"    extracted_text_line: {line}",
                "    status: EXTRACTED_UNVERIFIED_REVIEW_PENDING",
                "    activation_allowed: false",
            ]
        )
    lines.extend(
        [
            "review_boundaries:",
            "  historical_rule_reactivation_allowed: false",
            "  legal_review_status: PENDING",
            "  compliance_review_status: PENDING",
            "  relationship_to_instruction_66: EXPLICITLY_ABROGATED_BY_ARTICLE_92",
        ]
    )
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def sync_source_record() -> None:
    text = SOURCE_PATH.read_text(encoding="utf-8")
    replacements = {
        r"(?m)^  revision_date:.*$": f"  revision_date: '{REVISION_DATE}'",
        r"(?m)^  effective_from:.*$": f"  effective_from: '{EFFECTIVE_FROM}'",
        r"(?m)^  relationship_to_decision_2012_119:.*$": "  relationship_to_decision_2012_119: PENDING_HISTORICAL_OFFICIAL_SOURCE_REVIEW",
        r"(?m)^  binary_acquisition_status:.*$": "  binary_acquisition_status: MATERIALIZED_HASHED_AND_PAGE_VALIDATED",
    }
    for pattern, replacement in replacements.items():
        text, count = re.subn(pattern, replacement, text, count=1)
        if count != 1:
            raise RuntimeError(f"SOURCE_RECORD_SYNC_FAILED:{pattern}:count={count}")

    text = re.sub(
        r"(?ms)^  next_steps:\n(?:    - .*\n)+",
        "  next_steps:\n"
        "    - REVIEW_RELATIONSHIP_TO_DECISION_2012_119\n"
        "    - COMPLETE_HISTORICAL_CROSSCHECK\n"
        "    - HUMAN_LEGAL_AND_COMPLIANCE_REVIEW\n",
        text,
        count=1,
    )

    stale_note = '  - "Le PDF n\'est pas encore matérialisé dans le dépôt ; aucune empreinte SHA-256 ni taille n\'est inventée."'
    replacement_note = (
        '  - "Le PDF BRVM officiel est matérialisé, hashé et validé sur 9 pages ; '
        'l\'OCR reste un dérivé d\'extraction non normatif."'
    )
    if stale_note in text:
        text = text.replace(stale_note, replacement_note, 1)

    index_marker = "  first_page_visual_identity_status: CONFIRMED\n"
    index_line = f"  article_index: {relative(INDEX_PATH)}\n"
    if index_line not in text:
        if index_marker not in text:
            raise RuntimeError("SOURCE_RECORD_INDEX_MARKER_MISSING")
        text = text.replace(index_marker, index_marker + index_line, 1)

    legal_marker = f"  effective_from: '{EFFECTIVE_FROM}'\n"
    legal_extra = (
        "  effective_date_rule: ARTICLE_21_EFFECTIVE_ON_SIGNATURE_DATE\n"
        "  transitional_article_20_compliance_period_months: 6\n"
        "  final_clause_article_21: ALL_PRIOR_CONTRARY_PROVISIONS_ABROGATED\n"
    )
    if "  effective_date_rule:" not in text:
        text = text.replace(legal_marker, legal_marker + legal_extra, 1)

    SOURCE_PATH.write_text(text, encoding="utf-8")


def validation_checks_pass(checks: dict[str, object]) -> bool:
    for key, value in checks.items():
        if key == "requirementActivationAllowed":
            if value is not False:
                return False
        elif value is not True:
            return False
    return True


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    main()
