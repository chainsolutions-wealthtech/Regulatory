#!/usr/bin/env python3
"""Safe V2 wrapper for revised Instruction 46 legal-metadata enrichment.

The V1 enrichment logic remains the source of article/date curation, but its source-record
synchronizer used a DOTALL regex that could consume blocks following `next_steps`. This
wrapper replaces only that synchronizer with a line-bounded implementation and restores
mandatory historical-source safety boundaries deterministically.
"""

from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
V1_PATH = ROOT / "scripts" / "enrich_instruction_46_revised_legal_metadata.py"
SOURCE_PATH = ROOT / "regulatory" / "sources" / "INSTRUCTION_46_CREPMF_2011_REVISEE.yaml"
INDEX_PATH = ROOT / "regulatory" / "requirements" / "INST046_REVISED_ARTICLE_INDEX_V0_1.yaml"
REVISION_DATE = "2018-07-30"
EFFECTIVE_FROM = "2018-07-30"


def load_v1():
    spec = importlib.util.spec_from_file_location("inst046_enrichment_v1", V1_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("UNABLE_TO_LOAD_INST046_ENRICHMENT_V1")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def safe_sync_source_record() -> None:
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

    # Deliberately line-bounded: never consume later YAML sections.
    next_steps_pattern = r"(?m)^  next_steps:\n(?:    - [^\n]*\n)+"
    next_steps = (
        "  next_steps:\n"
        "    - REVIEW_RELATIONSHIP_TO_DECISION_2012_119\n"
        "    - COMPLETE_HISTORICAL_CROSSCHECK\n"
        "    - HUMAN_LEGAL_AND_COMPLIANCE_REVIEW\n"
    )
    text, count = re.subn(next_steps_pattern, next_steps, text, count=1)
    if count != 1:
        raise RuntimeError(f"NEXT_STEPS_SYNC_FAILED:count={count}")

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

    if "\nsafety:\n" not in text:
        text = text.rstrip() + "\n\n" + safety_block()
    else:
        required = [
            "  requirement_activation_allowed: false",
            "  historical_rule_reactivation_allowed: false",
            "  automatic_rule_reconstruction_allowed: false",
            "  automatic_migration_inference_allowed: false",
            "  human_legal_review_required: true",
            "  human_compliance_review_required: true",
        ]
        missing = [line for line in required if line not in text]
        if missing:
            raise RuntimeError(f"EXISTING_SAFETY_BLOCK_INCOMPLETE:{missing}")

    if "\nnotes:\n" not in text:
        text = text.rstrip() + "\n\n" + notes_block()

    SOURCE_PATH.write_text(text.rstrip() + "\n", encoding="utf-8")


def safety_block() -> str:
    return (
        "safety:\n"
        "  requirement_activation_allowed: false\n"
        "  historical_rule_reactivation_allowed: false\n"
        "  automatic_rule_reconstruction_allowed: false\n"
        "  automatic_migration_inference_allowed: false\n"
        "  human_legal_review_required: true\n"
        "  human_compliance_review_required: true\n"
    )


def notes_block() -> str:
    return (
        "notes:\n"
        "  - \"Le PDF BRVM officiel est matérialisé, hashé et validé sur 9 pages ; l'OCR reste un dérivé d'extraction non normatif.\"\n"
        "  - \"L'Instruction 66 article 92 abroge explicitement cette Instruction ; son contenu historique ne doit pas être réactivé.\"\n"
        "  - \"La relation précise avec la Décision n°2012-119 reste en attente du binaire officiel propre de cette décision.\"\n"
    )


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def main() -> None:
    module = load_v1()
    module.sync_source_record = safe_sync_source_record
    module.main()

    text = SOURCE_PATH.read_text(encoding="utf-8")
    assertions = [
        "historical_rule_reactivation_allowed: false",
        "automatic_rule_reconstruction_allowed: false",
        "automatic_migration_inference_allowed: false",
        "human_legal_review_required: true",
        "human_compliance_review_required: true",
        "HUMAN_LEGAL_AND_COMPLIANCE_REVIEW",
    ]
    missing = [value for value in assertions if value not in text]
    if missing:
        raise RuntimeError(f"INST046_SOURCE_SAFETY_REPAIR_FAILED:{missing}")


if __name__ == "__main__":
    main()
