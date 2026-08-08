#!/usr/bin/env python3
"""Make repeated Instruction 46 materialization byte-for-byte idempotent.

If the freshly downloaded official PDF has the same SHA-256 as the metadata already
committed at HEAD, preserve the original `retrievedAt` value. A repeated integrity
check must not create a Git diff solely because the clock moved forward.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELATIVE = "regulatory/materialized/INSTRUCTION_46_CREPMF_2011_REVISEE.metadata.json"
PATH = ROOT / RELATIVE


def main() -> None:
    current = json.loads(PATH.read_text(encoding="utf-8"))
    previous = read_head_metadata()

    result = {
        "status": "NO_PRIOR_METADATA",
        "sha256": current.get("sha256"),
        "retrievedAt": current.get("retrievedAt"),
    }

    if previous is not None:
        same_binary = previous.get("sha256") == current.get("sha256")
        if same_binary:
            prior_retrieved_at = previous.get("retrievedAt")
            if not prior_retrieved_at:
                raise RuntimeError("PRIOR_METADATA_MISSING_RETRIEVED_AT")
            current["retrievedAt"] = prior_retrieved_at
            PATH.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            result = {
                "status": "PRESERVED_FIRST_RETRIEVAL_TIMESTAMP_FOR_IDENTICAL_BINARY",
                "sha256": current.get("sha256"),
                "retrievedAt": prior_retrieved_at,
            }
        else:
            result = {
                "status": "BINARY_CHANGED_NEW_RETRIEVAL_TIMESTAMP_RETAINED",
                "previousSha256": previous.get("sha256"),
                "sha256": current.get("sha256"),
                "retrievedAt": current.get("retrievedAt"),
            }

    print(json.dumps(result, ensure_ascii=False, indent=2))


def read_head_metadata() -> dict | None:
    process = subprocess.run(
        ["git", "show", f"HEAD:{RELATIVE}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if process.returncode != 0:
        return None
    try:
        return json.loads(process.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("PRIOR_METADATA_INVALID_JSON") from exc


if __name__ == "__main__":
    main()
