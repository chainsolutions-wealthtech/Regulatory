#!/usr/bin/env python3
"""Apply deterministic layout fixes to the generated OOXML package.

The generator deliberately stays small. This pass adds visible bullet glyphs,
prevents table rows from being split across rendered pages and refreshes the
DOCX digest recorded in the manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import tempfile
import zipfile
from pathlib import Path

FIXED_ZIP_DATE = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--docx",
        default="examples/generated/united-capital-diamond/prospectus-draft.docx",
    )
    parser.add_argument(
        "--manifest",
        default="examples/generated/united-capital-diamond/docx-manifest.json",
    )
    args = parser.parse_args()
    path = Path(args.docx)
    manifest_path = Path(args.manifest)
    if not path.exists():
        raise SystemExit(f"DOCX not found: {path}")
    if not manifest_path.exists():
        raise SystemExit(f"DOCX manifest not found: {manifest_path}")

    with zipfile.ZipFile(path) as archive:
        entries = {name: archive.read(name) for name in archive.namelist()}

    xml = entries["word/document.xml"].decode("utf-8")
    list_prefix = (
        '<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr>'
        '<w:r><w:t xml:space="preserve">• </w:t></w:r>'
    )
    xml = xml.replace(
        '<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr>',
        list_prefix,
    )
    xml = xml.replace(
        "<w:trPr><w:tblHeader/></w:trPr>",
        "<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>",
    )
    xml = re.sub(
        r"<w:tr>(?!<w:trPr>)",
        "<w:tr><w:trPr><w:cantSplit/></w:trPr>",
        xml,
    )
    entries["word/document.xml"] = xml.encode("utf-8")

    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False, dir=path.parent) as handle:
        temporary = Path(handle.name)

    try:
        with zipfile.ZipFile(
            temporary,
            "w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=9,
        ) as archive:
            for name in sorted(entries):
                info = zipfile.ZipInfo(name, FIXED_ZIP_DATE)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                info.create_system = 3
                archive.writestr(info, entries[name])
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["layout_optimizer"] = "scripts/optimize_docx_layout.py"
    manifest["layout_optimizer_version"] = "0.1.0"
    manifest["layout_fixes"] = ["VISIBLE_LIST_BULLETS", "TABLE_ROWS_CANNOT_SPLIT"]
    manifest["docx_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    manifest["docx_size_bytes"] = path.stat().st_size
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Optimized {path}: visible bullets added, table rows marked cantSplit, manifest refreshed"
    )


if __name__ == "__main__":
    main()
