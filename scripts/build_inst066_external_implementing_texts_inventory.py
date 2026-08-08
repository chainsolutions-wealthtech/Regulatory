#!/usr/bin/env python3
"""Derive external implementing-text dependencies explicitly referenced by Instruction 66.

The materialized Instruction 66 remains the source of truth. This inventory does not
invent references or titles for implementing instruments. It records only explicit
cross-references found in the hash-bound OCR article blocks and keeps every unresolved
instrument inactive until its own official source is identified and reviewed.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_BLOCKS = ROOT / "regulatory" / "requirements" / "INST066_ARTICLE_BLOCKS_V0_1.json"
SOURCE_RECORD = ROOT / "regulatory" / "sources" / "INSTRUCTION_66_CREPMF_2021.yaml"
OUTPUT = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_VALIDATION_V0_1.json"

SOURCE_ID = "INSTRUCTION_66_CREPMF_2021"
SOURCE_SHA256 = "3f964f2f6ab9ce9eb16912ccda13f34b5023a188dfb18fcba7065590c770d396"

PATTERNS = [
    {
        "kind": "COUNCIL_CIRCULAR",
        "regex": re.compile(r"\b(?:Une|une|La|la)?\s*Circulaire\s+du\s+Conseil\s+R[ée]gional\b", re.IGNORECASE),
        "status": "REFERENCE_NOT_YET_IDENTIFIED",
    },
    {
        "kind": "COUNCIL_INSTRUCTION",
        "regex": re.compile(r"\b(?:Une|une|La|la)?\s*Instruction\s+du\s+Conseil\s+R[ée]gional\b", re.IGNORECASE),
        "status": "REFERENCE_NOT_YET_IDENTIFIED",
    },
    {
        "kind": "SPECIFIC_ACCOUNTING_REGULATION",
        "regex": re.compile(
            r"r[ée]glementation\s+comptable\s+sp[ée]cifique\s+applicable\s+aux\s+intervenants\s+agr[ée][ée]s\s+du\s+march[ée]\s+financier\s+r[ée]gional(?:\s+de\s+l['’]UMOA)?",
            re.IGNORECASE,
        ),
        "status": "REFERENCE_NOT_YET_IDENTIFIED",
    },
    {
        "kind": "EXPLICIT_NAMED_INSTRUCTION_58",
        "regex": re.compile(r"Instruction\s+n[°º]?\s*58\s*/\s*CREPMF\s*/\s*2019", re.IGNORECASE),
        "status": "RESOLVED_SOURCE_ALREADY_MATERIALIZED",
    },
]


def main() -> int:
    source_bytes = (ROOT / "regulatory" / "materialized" / "INSTRUCTION_66_CREPMF_2021.pdf").read_bytes()
    actual_sha = hashlib.sha256(source_bytes).hexdigest()
    if actual_sha != SOURCE_SHA256:
        raise RuntimeError(f"INST066_SOURCE_SHA_MISMATCH:{actual_sha}")

    source_record = SOURCE_RECORD.read_text(encoding="utf-8")
    if f"sha256: {SOURCE_SHA256}" not in source_record:
        raise RuntimeError("INST066_SOURCE_RECORD_SHA_MISMATCH")

    blocks = json.loads(SOURCE_BLOCKS.read_text(encoding="utf-8"))
    if blocks.get("sourceId") != SOURCE_ID:
        raise RuntimeError("ARTICLE_BLOCK_SOURCE_ID_MISMATCH")
    if blocks.get("sourceSha256") != SOURCE_SHA256:
        raise RuntimeError("ARTICLE_BLOCK_SOURCE_SHA_MISMATCH")

    dependencies: list[dict[str, object]] = []
    counters: Counter[tuple[int, str]] = Counter()

    for article in blocks.get("articles", []):
        article_number = int(article["articleNumber"])
        text = article.get("ocrText") or ""
        title = article.get("titleCandidate")
        start_page = article.get("startPage")
        end_page = article.get("endPage")

        for pattern in PATTERNS:
            for match in pattern["regex"].finditer(text):
                kind = pattern["kind"]
                counters[(article_number, kind)] += 1
                occurrence = counters[(article_number, kind)]
                dep_id = f"INST066_ART{article_number:03d}_DEP_{short_kind(kind)}_{occurrence:02d}"
                excerpt = context_excerpt(text, match.start(), match.end())
                dependencies.append(
                    {
                        "dependencyId": dep_id,
                        "sourceId": SOURCE_ID,
                        "articleNumber": article_number,
                        "articleTitle": title,
                        "sourcePages": page_range(start_page, end_page),
                        "dependencyKind": kind,
                        "referenceStatus": pattern["status"],
                        "officialReference": (
                            "Instruction n°58/CREPMF/2019"
                            if kind == "EXPLICIT_NAMED_INSTRUCTION_58"
                            else None
                        ),
                        "resolvedSourceId": (
                            "INSTRUCTION_58_CREPMF_2019"
                            if kind == "EXPLICIT_NAMED_INSTRUCTION_58"
                            else None
                        ),
                        "sourceWording": normalize(match.group(0)),
                        "sourceContext": excerpt,
                        "purposeCandidate": derive_purpose(article_number, title, kind, excerpt),
                        "normativeBoundary": (
                            "The dependency is recorded because Instruction 66 explicitly refers to it. "
                            "No missing reference, title, rule, threshold, method or obligation is inferred."
                        ),
                        "activation": (
                            "FORBIDDEN_PENDING_OFFICIAL_SOURCE_IDENTIFICATION_AND_REVIEW"
                            if pattern["status"] != "RESOLVED_SOURCE_ALREADY_MATERIALIZED"
                            else "FORBIDDEN_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
                        ),
                        "legalReviewStatus": "PENDING",
                        "complianceReviewStatus": "PENDING",
                    }
                )

    dependencies.sort(key=lambda item: (item["articleNumber"], item["dependencyKind"], item["dependencyId"]))
    kind_counts = Counter(item["dependencyKind"] for item in dependencies)
    unresolved = [item for item in dependencies if item["referenceStatus"] == "REFERENCE_NOT_YET_IDENTIFIED"]
    resolved = [item for item in dependencies if item["referenceStatus"] == "RESOLVED_SOURCE_ALREADY_MATERIALIZED"]
    article_numbers = sorted({int(item["articleNumber"]) for item in dependencies})

    inventory = {
        "schemaVersion": "INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1",
        "sourceId": SOURCE_ID,
        "sourceSha256": SOURCE_SHA256,
        "sourceArticleCount": blocks.get("articleCount"),
        "status": "DERIVED_FROM_HASHED_OFFICIAL_SOURCE_PENDING_EXTERNAL_SOURCE_IDENTIFICATION_AND_REVIEW",
        "scope": "EXPLICIT_EXTERNAL_IMPLEMENTING_OR_DETAIL_TEXT_REFERENCES_IN_INSTRUCTION_66",
        "method": {
            "input": relative(SOURCE_BLOCKS),
            "detection": [item["kind"] for item in PATTERNS],
            "rule": "Record explicit references only; do not infer unnamed implementing instruments beyond the wording present in Instruction 66.",
        },
        "summary": {
            "dependencyOccurrenceCount": len(dependencies),
            "unresolvedReferenceCount": len(unresolved),
            "resolvedReferenceOccurrenceCount": len(resolved),
            "articleCountWithExternalDependencies": len(article_numbers),
            "articleNumbersWithExternalDependencies": article_numbers,
            "countsByKind": dict(sorted(kind_counts.items())),
        },
        "dependencies": dependencies,
        "safety": {
            "missingReferenceInferenceAllowed": False,
            "automaticRuleReconstructionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checks = {
        "sourcePdfHashMatches": actual_sha == SOURCE_SHA256,
        "articleBlocksHashMatches": blocks.get("sourceSha256") == SOURCE_SHA256,
        "articleBlocksCount92": blocks.get("articleCount") == 92,
        "circularReferencesDetected": kind_counts.get("COUNCIL_CIRCULAR", 0) > 0,
        "accountingRegulationReferencesDetected": kind_counts.get("SPECIFIC_ACCOUNTING_REGULATION", 0) > 0,
        "instructionReferencesDetected": kind_counts.get("COUNCIL_INSTRUCTION", 0) > 0,
        "instruction58ReferencesDetected": kind_counts.get("EXPLICIT_NAMED_INSTRUCTION_58", 0) > 0,
        "unresolvedReferencesRemainInactive": all(
            item["activation"] == "FORBIDDEN_PENDING_OFFICIAL_SOURCE_IDENTIFICATION_AND_REVIEW"
            for item in unresolved
        ),
        "resolvedInstruction58StillPendingHumanReview": all(
            item["activation"] == "FORBIDDEN_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
            for item in resolved
        ),
        "allDependenciesRequireHumanReview": all(
            item["legalReviewStatus"] == "PENDING" and item["complianceReviewStatus"] == "PENDING"
            for item in dependencies
        ),
    }
    status = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "validationId": "INST066_EXTERNAL_IMPLEMENTING_TEXTS_VALIDATION_V0_1",
        "status": status,
        "sourceId": SOURCE_ID,
        "sourceSha256": SOURCE_SHA256,
        "checks": checks,
        "metrics": inventory["summary"],
        "outputs": [relative(OUTPUT)],
        "caveat": (
            "PASS validates deterministic discovery of explicit external-text references only. "
            "It does not identify the unresolved instruments, validate their legal status, or activate any requirement."
        ),
    }
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def short_kind(kind: str) -> str:
    return {
        "COUNCIL_CIRCULAR": "CIRC",
        "COUNCIL_INSTRUCTION": "INST",
        "SPECIFIC_ACCOUNTING_REGULATION": "ACCT",
        "EXPLICIT_NAMED_INSTRUCTION_58": "INST058",
    }[kind]


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def context_excerpt(text: str, start: int, end: int, radius: int = 650) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    excerpt = normalize(text[left:right])
    if left > 0:
        excerpt = "… " + excerpt
    if right < len(text):
        excerpt += " …"
    return excerpt


def derive_purpose(article_number: int, title: str | None, kind: str, excerpt: str) -> str:
    title_text = title or f"Article {article_number}"
    if kind == "SPECIFIC_ACCOUNTING_REGULATION":
        return f"Detailed accounting/valuation/reporting rules referenced by {title_text}."
    if kind == "EXPLICIT_NAMED_INSTRUCTION_58":
        return f"Auditor certification/reporting rules referenced by {title_text}."
    return f"Implementing details expressly delegated by {title_text}; exact instrument reference remains to be identified from an official source."


def page_range(start: int | None, end: int | None) -> list[int]:
    if start is None:
        return []
    if end is None or end < start:
        return [int(start)]
    return list(range(int(start), int(end) + 1))


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
