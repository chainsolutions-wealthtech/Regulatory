#!/usr/bin/env python3
"""Build a deterministic research queue from the INST066 external dependency inventory.

The queue groups every explicit external dependency by article and preserves the exact
OCR context already captured from the hash-bound Instruction 66 source. It is a research
control artifact only: grouping does not imply that two occurrences share the same
implementing instrument.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_IMPLEMENTING_TEXTS_INVENTORY_V0_1.json"
OUTPUT = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_VALIDATION_V0_1.json"


def main() -> int:
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    dependencies = inventory.get("dependencies", [])
    by_article: dict[int, list[dict]] = {}
    for dep in dependencies:
        article = int(dep["articleNumber"])
        by_article.setdefault(article, []).append(dep)

    articles = []
    for article_number in sorted(by_article):
        deps = sorted(by_article[article_number], key=lambda d: (d["dependencyKind"], d["dependencyId"]))
        kind_counts = Counter(d["dependencyKind"] for d in deps)
        unresolved = [d for d in deps if d["referenceStatus"] != "RESOLVED_SOURCE_ALREADY_MATERIALIZED"]
        resolved = [d for d in deps if d["referenceStatus"] == "RESOLVED_SOURCE_ALREADY_MATERIALIZED"]
        title = next((d.get("articleTitle") for d in deps if d.get("articleTitle")), None)
        articles.append(
            {
                "articleNumber": article_number,
                "articleTitle": title,
                "dependencyOccurrenceCount": len(deps),
                "unresolvedOccurrenceCount": len(unresolved),
                "resolvedOccurrenceCount": len(resolved),
                "countsByKind": dict(sorted(kind_counts.items())),
                "researchPriority": priority(article_number),
                "dependencies": [
                    {
                        "dependencyId": d["dependencyId"],
                        "dependencyKind": d["dependencyKind"],
                        "referenceStatus": d["referenceStatus"],
                        "officialReference": d.get("officialReference"),
                        "resolvedSourceId": d.get("resolvedSourceId"),
                        "sourcePages": d.get("sourcePages", []),
                        "sourceWording": d.get("sourceWording"),
                        "sourceContext": d.get("sourceContext"),
                        "activation": d["activation"],
                        "legalReviewStatus": d["legalReviewStatus"],
                        "complianceReviewStatus": d["complianceReviewStatus"],
                    }
                    for d in deps
                ],
                "groupingBoundary": (
                    "Occurrences are grouped only for research navigation. They must not be assumed to refer "
                    "to a single implementing instrument without official-source proof."
                ),
            }
        )

    queue = {
        "schemaVersion": "INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1",
        "sourceId": inventory["sourceId"],
        "sourceSha256": inventory["sourceSha256"],
        "status": "DETERMINISTIC_RESEARCH_QUEUE_FROM_EXTERNAL_DEPENDENCY_INVENTORY",
        "summary": {
            "articleCount": len(articles),
            "dependencyOccurrenceCount": len(dependencies),
            "unresolvedOccurrenceCount": sum(a["unresolvedOccurrenceCount"] for a in articles),
            "resolvedOccurrenceCount": sum(a["resolvedOccurrenceCount"] for a in articles),
            "articlesWithOnlyUnresolvedDependencies": [
                a["articleNumber"] for a in articles if a["resolvedOccurrenceCount"] == 0
            ],
            "articlesWithMixedResolvedAndUnresolvedDependencies": [
                a["articleNumber"] for a in articles if a["resolvedOccurrenceCount"] > 0 and a["unresolvedOccurrenceCount"] > 0
            ],
        },
        "articles": articles,
        "safety": {
            "groupingImpliesSameInstrument": False,
            "automaticReferenceInferenceAllowed": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    OUTPUT.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checks = {
        "articleCountMatchesInventory": len(articles) == inventory["summary"]["articleCountWithExternalDependencies"],
        "dependencyCountMatchesInventory": len(dependencies) == inventory["summary"]["dependencyOccurrenceCount"],
        "unresolvedCountMatchesInventory": queue["summary"]["unresolvedOccurrenceCount"] == inventory["summary"]["unresolvedReferenceCount"],
        "resolvedCountMatchesInventory": queue["summary"]["resolvedOccurrenceCount"] == inventory["summary"]["resolvedReferenceOccurrenceCount"],
        "allDependenciesPreserved": sum(len(a["dependencies"]) for a in articles) == len(dependencies),
        "allActivationStillForbidden": all(d["activation"].startswith("FORBIDDEN_") for a in articles for d in a["dependencies"]),
        "groupingDoesNotResolve": queue["safety"]["automaticDependencyResolutionAllowed"] is False,
        "readyForSubmissionRemainsFalse": queue["safety"]["readyForSubmissionMustRemainFalse"] is True,
    }
    status = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "validationId": "INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_VALIDATION_V0_1",
        "status": status,
        "checks": checks,
        "metrics": queue["summary"],
        "outputs": [relative(OUTPUT)],
        "caveat": "PASS validates research-queue completeness only; it does not identify or resolve implementing instruments.",
    }
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def priority(article: int) -> str:
    already_researched = {4, 5, 12, 13, 32, 37, 47, 53, 55, 59}
    if article in already_researched:
        return "SEARCH_PASS_RECORDED_OR_IN_PROGRESS"
    if article in {74, 75, 76, 80}:
        return "NEXT_TAIL_REVIEW"
    return "PENDING_STRUCTURED_REVIEW"


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
