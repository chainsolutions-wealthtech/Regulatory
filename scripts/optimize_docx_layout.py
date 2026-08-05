#!/usr/bin/env python3
"""Apply deterministic layout fixes to the generated OOXML package.

The generator deliberately stays small. This pass adds visible bullet glyphs and
prevents table rows from being split across rendered pages.
"""

from __future__ import annotations

import argparse
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
    args = parser.parse_args()
    path = Path(args.docx)
    if not path.exists():
        raise SystemExit(f"DOCX not found: {path}")

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

    print(
        f"Optimized {path}: visible bullets added and table rows marked cantSplit"
    )


if __name__ == "__main__":
    main()
