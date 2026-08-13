#!/usr/bin/env python3
"""Regression test and diagnostic for deterministic PDF rendering.

Uses the versioned United Capital Diamond DOCX fixture and the exact production
normalizer. It does not weaken the two-render invariant: on divergence it emits
hashes, lengths, the first differing offset and bounded byte contexts, then
fails.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import tempfile

import generate_pdf_review_package as pdfgen

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "examples/generated/united-capital-diamond"
DOCX = FIXTURE / "prospectus-draft.docx"
MANIFEST = FIXTURE / "generation-manifest.json"
CONTEXT_BYTES = 96


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def first_difference(left: bytes, right: bytes) -> int | None:
    for index, (left_byte, right_byte) in enumerate(zip(left, right)):
        if left_byte != right_byte:
            return index
    if len(left) != len(right):
        return min(len(left), len(right))
    return None


def bounded_context(data: bytes, offset: int) -> dict[str, object]:
    start = max(0, offset - CONTEXT_BYTES)
    end = min(len(data), offset + CONTEXT_BYTES)
    chunk = data[start:end]
    return {
        "start": start,
        "end": end,
        "hex": chunk.hex(),
        "ascii": "".join(chr(value) if 32 <= value <= 126 else "." for value in chunk),
    }


def main() -> None:
    pdfgen.require_file(DOCX)
    pdfgen.require_file(MANIFEST)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    generated_at = pdfgen.parse_utc_datetime(str(manifest.get("generated_at") or ""))
    generation_id = str(manifest.get("generation_id") or "")
    if not generation_id:
        raise SystemExit("generation_id missing from fixture manifest")

    docx_sha = pdfgen.sha256_file(DOCX)
    raw_runs: list[bytes] = []
    normalized_runs: list[bytes] = []

    with tempfile.TemporaryDirectory(prefix="regulatory-pdf-determinism-test-") as temporary:
        temp = Path(temporary)
        for run_number in (1, 2):
            rendered = pdfgen.render_docx_to_pdf(DOCX, temp, run_number)
            raw = rendered.read_bytes()
            normalized = pdfgen.normalize_pdf_bytes(
                raw,
                generated_at=generated_at,
                deterministic_seed=f"{generation_id}|{docx_sha}",
            )
            raw_runs.append(raw)
            normalized_runs.append(normalized)

    offset = first_difference(normalized_runs[0], normalized_runs[1])
    result: dict[str, object] = {
        "validationId": "PDF_DETERMINISM_REGRESSION_V1",
        "fixture": str(DOCX.relative_to(ROOT)),
        "generationId": generation_id,
        "docxSha256": docx_sha,
        "raw": {
            "run1Length": len(raw_runs[0]),
            "run2Length": len(raw_runs[1]),
            "run1Sha256": sha256_bytes(raw_runs[0]),
            "run2Sha256": sha256_bytes(raw_runs[1]),
        },
        "normalized": {
            "run1Length": len(normalized_runs[0]),
            "run2Length": len(normalized_runs[1]),
            "run1Sha256": sha256_bytes(normalized_runs[0]),
            "run2Sha256": sha256_bytes(normalized_runs[1]),
            "firstDifferenceOffset": offset,
        },
        "status": "PASS" if offset is None else "FAIL",
        "readyForSubmission": False,
    }

    if offset is not None:
        result["normalized"]["run1Context"] = bounded_context(normalized_runs[0], offset)
        result["normalized"]["run2Context"] = bounded_context(normalized_runs[1], offset)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    if offset is not None:
        raise SystemExit("PDF_NORMALIZATION_NOT_DETERMINISTIC_DIAGNOSTIC")


if __name__ == "__main__":
    main()
