#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "regulatory" / "sources" / "INSTRUCTION_58_CREPMF_2019.yaml"
METADATA = ROOT / "regulatory" / "materialized" / "INSTRUCTION_58_CREPMF_2019.metadata.json"
VALIDATION = ROOT / "regulatory" / "validation" / "INST058_MATERIALIZATION_VALIDATION_V0_1.json"


def replace_once(text: str, pattern: str, replacement: str) -> str:
    result, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise RuntimeError(f"EXPECTED_ONE_REPLACEMENT:{pattern}:got={count}")
    return result


def main() -> None:
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    validation = json.loads(VALIDATION.read_text(encoding="utf-8"))
    if validation.get("status") != "PASS":
        raise RuntimeError("MATERIALIZATION_VALIDATION_NOT_PASS")

    text = SOURCE.read_text(encoding="utf-8")
    text = replace_once(text, r"^  byte_size: .*?$", f"  byte_size: {metadata['byteSize']}")
    text = replace_once(text, r"^  sha256: .*?$", f"  sha256: {metadata['sha256']}")
    text = replace_once(text, r"^  page_count: .*?$", f"  page_count: {metadata['pageCount']}")
    text = replace_once(text, r"^  copy_status: .*?$", "  copy_status: MATERIALIZED_HASHED_AND_PAGE_VALIDATED")
    text = replace_once(text, r"^  extraction_status: .*?$", "  extraction_status: MATERIALIZED_ARTICLE_INDEX_EXTRACTED_UNVERIFIED")

    marker = "  requirement_prefix: INST058\n"
    if marker not in text:
        raise RuntimeError("REQUIREMENT_PREFIX_MARKER_NOT_FOUND")
    article_count_line = f"  article_count: {metadata['articleIndexCount']}\n"
    if re.search(r"(?m)^  article_count:", text):
        text = re.sub(r"(?m)^  article_count:.*$", article_count_line.rstrip(), text, count=1)
    else:
        text = text.replace(marker, marker + article_count_line)

    text = replace_once(
        text,
        r"^  requirement_activation: .*?$",
        "  requirement_activation: FORBIDDEN_PENDING_LEGAL_AND_COMPLIANCE_REVIEW",
    )

    SOURCE.write_text(text, encoding="utf-8")
    print(
        json.dumps(
            {
                "sourceId": metadata["sourceId"],
                "sha256": metadata["sha256"],
                "byteSize": metadata["byteSize"],
                "pageCount": metadata["pageCount"],
                "articleIndexCount": metadata["articleIndexCount"],
                "registryStatus": "PENDING_OFFICIAL_REGISTRY_CONFIRMATION",
                "activationAllowed": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
