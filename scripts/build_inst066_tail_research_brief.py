#!/usr/bin/env python3
"""Extract a compact research brief for the final INST066 external-dependency articles.

The brief contains articles 74, 75, 76 and 80 exactly as represented in the deterministic
research queue. It is intended to drive official-source searches without guessing topics.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "regulatory" / "registries" / "INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json"
OUTPUT = ROOT / "regulatory" / "registries" / "INST066_TAIL_DEPENDENCY_RESEARCH_BRIEF_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST066_TAIL_DEPENDENCY_RESEARCH_BRIEF_VALIDATION_V0_1.json"
TARGETS = [74, 75, 76, 80]


def main() -> int:
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    by_number = {int(article["articleNumber"]): article for article in queue["articles"]}
    missing = [number for number in TARGETS if number not in by_number]
    if missing:
        raise RuntimeError(f"TAIL_ARTICLES_MISSING:{missing}")

    articles = []
    for number in TARGETS:
        source = by_number[number]
        articles.append(
            {
                "articleNumber": number,
                "articleTitle": source.get("articleTitle"),
                "dependencyOccurrenceCount": source["dependencyOccurrenceCount"],
                "unresolvedOccurrenceCount": source["unresolvedOccurrenceCount"],
                "countsByKind": source["countsByKind"],
                "researchPriority": source["researchPriority"],
                "dependencies": [
                    {
                        "dependencyId": dep["dependencyId"],
                        "dependencyKind": dep["dependencyKind"],
                        "referenceStatus": dep["referenceStatus"],
                        "officialReference": dep.get("officialReference"),
                        "sourceWording": dep.get("sourceWording"),
                        "sourceContext": dep.get("sourceContext"),
                        "activation": dep["activation"],
                    }
                    for dep in source["dependencies"]
                ],
            }
        )

    brief = {
        "schemaVersion": "INST066_TAIL_DEPENDENCY_RESEARCH_BRIEF_V0_1",
        "sourceId": queue["sourceId"],
        "sourceSha256": queue["sourceSha256"],
        "status": "READY_FOR_OFFICIAL_SOURCE_RESEARCH",
        "targetArticles": TARGETS,
        "articles": articles,
        "researchBoundary": (
            "Search terms must be derived from articleTitle/sourceContext. No implementing-instrument number "
            "or title may be guessed from the article number alone."
        ),
        "safety": queue["safety"],
    }
    OUTPUT.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    checks = {
        "allFourTargetArticlesPresent": [a["articleNumber"] for a in articles] == TARGETS,
        "allHaveDependencies": all(a["dependencyOccurrenceCount"] > 0 for a in articles),
        "allResearchPrioritiesTailReview": all(a["researchPriority"] == "NEXT_TAIL_REVIEW" for a in articles),
        "allActivationForbidden": all(
            dep["activation"].startswith("FORBIDDEN_")
            for article in articles for dep in article["dependencies"]
        ),
        "automaticResolutionForbidden": brief["safety"]["automaticDependencyResolutionAllowed"] is False,
        "readyForSubmissionFalse": brief["safety"]["readyForSubmissionMustRemainFalse"] is True,
    }
    status = "PASS" if all(checks.values()) else "FAIL"
    validation = {
        "validationId": "INST066_TAIL_DEPENDENCY_RESEARCH_BRIEF_VALIDATION_V0_1",
        "status": status,
        "checks": checks,
        "metrics": {
            "articleCount": len(articles),
            "dependencyOccurrenceCount": sum(a["dependencyOccurrenceCount"] for a in articles),
            "unresolvedOccurrenceCount": sum(a["unresolvedOccurrenceCount"] for a in articles),
        },
        "outputs": [relative(OUTPUT)],
    }
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(validation, ensure_ascii=False, indent=2))
    return 0 if status == "PASS" else 1


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


if __name__ == "__main__":
    raise SystemExit(main())
