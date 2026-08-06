#!/usr/bin/env python3
"""Render final pages of the official Instruction 66 PDF for human review.

The generated images are evidence aids only. The script checks that the source
PDF hash matches the materialization metadata before rendering pages 64 and 65.
It does not confirm legal dates or abrogations automatically.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf"
METADATA_PATH = ROOT / "regulatory/materialized/INSTRUCTION_66_CREPMF_2021.metadata.json"
OUTPUT_DIRECTORY = ROOT / "regulatory/review-evidence/INST066_LEGAL_METADATA"
REVIEW_PATH = OUTPUT_DIRECTORY / "REVIEW_CHECKLIST_V0_1.yaml"


def main() -> None:
    if shutil.which("pdftoppm") is None:
        raise RuntimeError("MISSING_REQUIRED_TOOL:pdftoppm")
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    content = PDF_PATH.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    if digest != metadata["sha256"]:
        raise RuntimeError(f"INST066_SOURCE_DIGEST_MISMATCH:{digest}:{metadata['sha256']}")
    if metadata["pageCount"] != 65:
        raise RuntimeError(f"INST066_PAGE_COUNT_INVALID:{metadata['pageCount']}")

    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for page in (64, 65):
        prefix = OUTPUT_DIRECTORY / f"page-{page:02d}"
        subprocess.run(
            [
                "pdftoppm",
                "-f",
                str(page),
                "-l",
                str(page),
                "-r",
                "180",
                "-png",
                "-singlefile",
                str(PDF_PATH),
                str(prefix),
            ],
            check=True,
        )

    checklist = f"""source_id: INSTRUCTION_66_CREPMF_2021
review_version: 0.1.0
status: PENDING_HUMAN_LEGAL_AND_COMPLIANCE_REVIEW
source_integrity:
  repository_copy: regulatory/materialized/INSTRUCTION_66_CREPMF_2021.pdf
  sha256: {metadata['sha256']}
  byte_size: {metadata['byteSize']}
  page_count: {metadata['pageCount']}
rendered_evidence:
- page: 64
  file: regulatory/review-evidence/INST066_LEGAL_METADATA/page-64.png
  expected_subject: ARTICLE_92_ABROGATION_INVENTORY_BEGINNING
- page: 65
  file: regulatory/review-evidence/INST066_LEGAL_METADATA/page-65.png
  expected_subject: ARTICLE_92_ABROGATION_INVENTORY_END_EFFECTIVE_DATE_AND_SIGNATURE_DATE
review_items:
- id: INST066_REVIEW_EFFECTIVE_DATE
  extracted_candidate: 2022-01-01
  evidence_page: 65
  status: PENDING_HUMAN_CONFIRMATION
  confirmation_role: LEGAL_AND_COMPLIANCE
- id: INST066_REVIEW_SIGNED_DATE
  extracted_candidate: 2021-12-16
  evidence_page: 65
  status: PENDING_HUMAN_CONFIRMATION
  confirmation_role: LEGAL_AND_COMPLIANCE
- id: INST066_REVIEW_ABROGATION_INVENTORY
  extracted_candidate_count: 7
  evidence_pages: [64, 65]
  status: PENDING_HUMAN_CONFIRMATION_AND_REGISTRY_CROSSCHECK
  confirmation_role: LEGAL_AND_COMPLIANCE
claims:
  dates_confirmed: false
  abrogation_inventory_confirmed: false
  amendments_inventory_complete: false
  requirements_activated: false
notes:
- Le rendu est produit à partir du PDF officiel dont l'empreinte a été vérifiée avant conversion.
- La lecture visuelle doit être consignée par un relecteur humain ; ce fichier ne vaut pas confirmation juridique automatique.
"""
    REVIEW_PATH.write_text(checklist, encoding="utf-8")
    print(json.dumps({
        "status": "PASS",
        "sourceSha256": digest,
        "outputs": [
            str((OUTPUT_DIRECTORY / "page-64.png").relative_to(ROOT)),
            str((OUTPUT_DIRECTORY / "page-65.png").relative_to(ROOT)),
            str(REVIEW_PATH.relative_to(ROOT)),
        ],
        "datesConfirmed": False,
        "abrogationInventoryConfirmed": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
