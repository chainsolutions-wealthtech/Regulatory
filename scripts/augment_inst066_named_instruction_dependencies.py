#!/usr/bin/env python3
"""Augment the INST066 external-dependency inventory with explicit named CREPMF instructions.

The first-pass inventory detects generic references (Council circular/instruction), the
specific accounting regulation and Instruction 58. This pass detects any other explicit
`Instruction n°XX/CREPMF/YYYY` references present in the hash-bound article blocks.
It never guesses titles or legal status.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCKS_PATH = ROOT / "regulatory" / "requirements" / "INST066_ARTICLE_BLOCKS_V0_1.json"
INVENTORY_PATH = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json"
VALIDATION_PATH = ROOT / "regulatory" / "validation" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_VALIDATION_V0_1.json"

PATTERN = re.compile(
    r"Instruction\s+n\s*[°º]?\s*(?P<number>\d{1,3})\s*/\s*CREPMF\s*/\s*(?P<year>20\d{2})",
    re.IGNORECASE,
)


def main() -> None:
    blocks = json.loads(BLOCKS_PATH.read_text(encoding="utf-8"))
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))

    existing_keys = {
        (int(dep["articleNumber"]), normalize_ref(dep.get("officialReference")))
        for dep in inventory.get("dependencies", [])
        if dep.get("officialReference")
    }
    article_counters: Counter[int] = Counter()
    added = []

    for article in blocks.get("articles", []):
        article_number = int(article["articleNumber"])
        text = article.get("ocrText") or ""
        for match in PATTERN.finditer(text):
            number = int(match.group("number"))
            year = int(match.group("year"))
            reference = f"Instruction n°{number}/CREPMF/{year}"
            key = (article_number, normalize_ref(reference))
            if key in existing_keys:
                continue
            article_counters[article_number] += 1
            dep_id = f"INST066_ART{article_number:03d}_DEP_NAMED_INST_{article_counters[article_number]:02d}"
            source_id = known_source_id(number, year)
            status = (
                "RESOLVED_SOURCE_ALREADY_MATERIALIZED"
                if source_id == "INSTRUCTION_58_CREPMF_2019"
                else "EXPLICIT_REFERENCE_SOURCE_RECORD_OR_BINARY_TO_VERIFY"
            )
            activation = (
                "FORBIDDEN_PENDING_LEGAL_AND_COMPLIANCE_REVIEW"
                if status == "RESOLVED_SOURCE_ALREADY_MATERIALIZED"
                else "FORBIDDEN_PENDING_OFFICIAL_SOURCE_IDENTIFICATION_AND_REVIEW"
            )
            added.append(
                {
                    "dependencyId": dep_id,
                    "sourceId": "INSTRUCTION_66_CREPMF_2021",
                    "articleNumber": article_number,
                    "articleTitle": article.get("titleCandidate"),
                    "sourcePages": page_range(article.get("startPage"), article.get("endPage")),
                    "dependencyKind": "EXPLICIT_NAMED_CREPMF_INSTRUCTION",
                    "referenceStatus": status,
                    "officialReference": reference,
                    "resolvedSourceId": source_id,
                    "sourceWording": compact(match.group(0)),
                    "sourceContext": context(text, match.start(), match.end()),
                    "purposeCandidate": (
                        f"Instruction 66 explicitly names {reference}; its own official source and current legal status "
                        "must be verified before this dependency can be treated as resolved."
                    ),
                    "normativeBoundary": (
                        "The number/year are taken verbatim from Instruction 66. No title, date, amendment status or "
                        "normative content is inferred from the reference alone."
                    ),
                    "activation": activation,
                    "legalReviewStatus": "PENDING",
                    "complianceReviewStatus": "PENDING",
                }
            )
            existing_keys.add(key)

    inventory["dependencies"].extend(added)
    inventory["dependencies"].sort(
        key=lambda item: (int(item["articleNumber"]), item["dependencyKind"], item["dependencyId"])
    )
    refresh_summary(inventory)
    inventory.setdefault("method", {}).setdefault("detection", []).append("EXPLICIT_NAMED_CREPMF_INSTRUCTION")
    inventory["method"]["namedInstructionPass"] = (
        "Second deterministic pass captures explicit Instruction n°XX/CREPMF/YYYY references not already represented."
    )
    INVENTORY_PATH.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    named = [d for d in inventory["dependencies"] if d["dependencyKind"] == "EXPLICIT_NAMED_CREPMF_INSTRUCTION"]
    validation["metrics"] = inventory["summary"]
    validation.setdefault("checks", {})["additionalNamedCrepmfInstructionsDetected"] = len(named) > 0
    validation["checks"]["namedInstructionsRemainInactiveUntilVerified"] = all(
        d["activation"].startswith("FORBIDDEN_") for d in named
    )
    validation["namedInstructionReferences"] = sorted({d["officialReference"] for d in named})
    validation["status"] = "PASS" if all(validation["checks"].values()) else "FAIL"
    VALIDATION_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "status": validation["status"],
                "addedOccurrences": len(added),
                "references": validation["namedInstructionReferences"],
                "totalDependencies": inventory["summary"]["dependencyOccurrenceCount"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def known_source_id(number: int, year: int) -> str | None:
    if (number, year) == (58, 2019):
        return "INSTRUCTION_58_CREPMF_2019"
    candidate = ROOT / "regulatory" / "sources" / f"INSTRUCTION_{number}_CREPMF_{year}.yaml"
    if candidate.exists():
        return f"INSTRUCTION_{number}_CREPMF_{year}"
    return None


def refresh_summary(inventory: dict) -> None:
    deps = inventory["dependencies"]
    counts = Counter(d["dependencyKind"] for d in deps)
    unresolved = [d for d in deps if d["referenceStatus"] not in {"RESOLVED_SOURCE_ALREADY_MATERIALIZED"}]
    resolved = [d for d in deps if d["referenceStatus"] == "RESOLVED_SOURCE_ALREADY_MATERIALIZED"]
    articles = sorted({int(d["articleNumber"]) for d in deps})
    inventory["summary"] = {
        "dependencyOccurrenceCount": len(deps),
        "unresolvedReferenceCount": len(unresolved),
        "resolvedReferenceOccurrenceCount": len(resolved),
        "articleCountWithExternalDependencies": len(articles),
        "articleNumbersWithExternalDependencies": articles,
        "countsByKind": dict(sorted(counts.items())),
    }


def normalize_ref(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", "", value.lower().replace("º", "°"))


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def context(text: str, start: int, end: int, radius: int = 500) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    value = compact(text[left:right])
    return ("… " if left else "") + value + (" …" if right < len(text) else "")


def page_range(start, end):
    if start is None:
        return []
    end = start if end is None or end < start else end
    return list(range(int(start), int(end) + 1))


if __name__ == "__main__":
    main()
