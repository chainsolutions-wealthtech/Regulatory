#!/usr/bin/env python3
"""Generate a normalized PDF and deterministic pre-compliance review ZIP.

The DOCX remains the composition source. LibreOffice performs the rendering;
ExifTool normalizes mutable PDF metadata; qpdf normalizes the trailer/document
ID and streams. The resulting ZIP uses fixed entry timestamps, permissions and
ordering. This pipeline never changes ready_for_submission to true.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)


def main() -> None:
    args = parse_args()
    docx = Path(args.docx).resolve()
    generation_manifest = Path(args.generation_manifest).resolve()
    output_pdf = Path(args.output_pdf).resolve()
    pdf_manifest_path = Path(args.pdf_manifest).resolve()
    package_zip = Path(args.package_zip).resolve()
    package_manifest_path = Path(args.package_manifest).resolve()
    include_paths = [Path(value).resolve() for value in args.include]

    require_file(docx)
    require_file(generation_manifest)
    for include_path in include_paths:
        require_file(include_path)

    manifest = json.loads(generation_manifest.read_text(encoding="utf-8"))
    if manifest.get("ready_for_submission") is not False:
        raise SystemExit("ready_for_submission must remain false before PDF/package generation")
    generated_at = parse_utc_datetime(str(manifest.get("generated_at") or ""))
    generation_id = str(manifest.get("generation_id") or "")
    if not generation_id:
        raise SystemExit("generation_id missing from generation manifest")

    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    pdf_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    package_zip.parent.mkdir(parents=True, exist_ok=True)
    package_manifest_path.parent.mkdir(parents=True, exist_ok=True)

    check_tool("libreoffice")
    check_tool("pdfinfo")
    check_tool("exiftool")
    check_tool("qpdf")

    with tempfile.TemporaryDirectory(prefix="regulatory-pdf-") as temporary:
        temp = Path(temporary)
        libreoffice_dir = temp / "libreoffice"
        libreoffice_dir.mkdir(parents=True, exist_ok=True)
        render_dir = temp / "render"
        render_dir.mkdir(parents=True, exist_ok=True)
        profile_dir = temp / "profile"
        profile_dir.mkdir(parents=True, exist_ok=True)

        rendered_pdf = render_dir / f"{docx.stem}.pdf"
        env = os.environ.copy()
        env.update(
            {
                "HOME": str(libreoffice_dir),
                "TMPDIR": str(temp),
                "TZ": "UTC",
                "LC_ALL": "C.UTF-8",
                "LANG": "C.UTF-8",
                "SAL_USE_VCLPLUGIN": "svp",
            }
        )
        run(
            [
                "libreoffice",
                "--headless",
                "--nologo",
                "--nodefault",
                "--nofirststartwizard",
                f"-env:UserInstallation=file://{profile_dir}",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                str(render_dir),
                str(docx),
            ],
            env=env,
        )
        require_file(rendered_pdf)

        metadata_pdf = temp / "metadata-normalized.pdf"
        shutil.copyfile(rendered_pdf, metadata_pdf)
        exif_timestamp = generated_at.strftime("%Y:%m:%d %H:%M:%S+00:00")
        run(
            [
                "exiftool",
                "-overwrite_original",
                f"-CreateDate={exif_timestamp}",
                f"-ModifyDate={exif_timestamp}",
                f"-MetadataDate={exif_timestamp}",
                "-Creator=ChainSolutions Regulatory Prospectus Composer",
                "-Producer=LibreOffice Writer normalized by ChainSolutions Regulatory",
                str(metadata_pdf),
            ]
        )

        normalized_pdf = temp / "normalized.pdf"
        run(
            [
                "qpdf",
                "--deterministic-id",
                "--object-streams=generate",
                "--stream-data=compress",
                str(metadata_pdf),
                str(normalized_pdf),
            ]
        )
        require_pdf(normalized_pdf)
        shutil.copyfile(normalized_pdf, output_pdf)

    pdf_info = parse_pdfinfo(output_pdf)
    page_count = int(pdf_info.get("Pages", "0"))
    if page_count <= 0:
        raise SystemExit("Normalized PDF has no pages")

    pdf_sha = sha256_file(output_pdf)
    pdf_manifest = {
        "schema_version": "1.0.0",
        "generation_id": generation_id,
        "generated_at": generated_at.isoformat().replace("+00:00", "Z"),
        "source_docx": docx.name,
        "source_docx_sha256": sha256_file(docx),
        "pdf_file": output_pdf.name,
        "pdf_sha256": pdf_sha,
        "pdf_size_bytes": output_pdf.stat().st_size,
        "page_count": page_count,
        "renderer": "LibreOffice Writer headless",
        "normalization": "ExifTool fixed metadata + qpdf deterministic-id",
        "document_status": "DRAFT_PRE_COMPLIANCE_REVIEW",
        "ready_for_submission": False,
        "caveat": (
            "PDF de revue de pré-conformité produit depuis le DOCX validé. "
            "Il ne constitue ni un visa, ni une approbation AMF-UMOA, ni une soumission réglementaire."
        ),
    }
    write_json(pdf_manifest_path, pdf_manifest)

    package_entries = unique_sorted_paths(
        [docx, output_pdf, pdf_manifest_path, generation_manifest, *include_paths]
    )
    payload = [file_descriptor(item) for item in package_entries]
    package_manifest = {
        "schema_version": "1.0.0",
        "generation_id": generation_id,
        "generated_at": generated_at.isoformat().replace("+00:00", "Z"),
        "package_file": package_zip.name,
        "package_type": "PRE_COMPLIANCE_REVIEW_PACKAGE",
        "document_status": "DRAFT_PRE_COMPLIANCE_REVIEW",
        "ready_for_submission": False,
        "entry_count": len(payload) + 1,
        "entries": payload,
        "zip_determinism": {
            "entry_timestamp": "1980-01-01T00:00:00Z",
            "entry_permissions": "0644",
            "entry_order": "LEXICOGRAPHIC_BY_FILENAME",
            "compression": "DEFLATE_LEVEL_9",
        },
        "caveat": (
            "Package de revue uniquement. Les validations juridique, conformité, fiscale, sécurité et production "
            "restent obligatoires avant toute soumission."
        ),
    }
    write_json(package_manifest_path, package_manifest)

    package_entries = unique_sorted_paths([*package_entries, package_manifest_path])
    write_deterministic_zip(package_zip, package_entries)
    zip_sha = sha256_file(package_zip)

    result = {
        "status": "PASS",
        "generation_id": generation_id,
        "pdf_file": output_pdf.name,
        "pdf_sha256": pdf_sha,
        "pdf_pages": page_count,
        "package_file": package_zip.name,
        "package_sha256": zip_sha,
        "package_entries": len(package_entries),
        "ready_for_submission": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docx", required=True)
    parser.add_argument("--generation-manifest", required=True)
    parser.add_argument("--output-pdf", required=True)
    parser.add_argument("--pdf-manifest", required=True)
    parser.add_argument("--package-zip", required=True)
    parser.add_argument("--package-manifest", required=True)
    parser.add_argument("--include", action="append", default=[])
    return parser.parse_args()


def check_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(f"Required document tool is not installed: {name}")


def require_file(path_value: Path) -> None:
    if not path_value.is_file():
        raise SystemExit(f"Required file missing: {path_value}")


def require_pdf(path_value: Path) -> None:
    require_file(path_value)
    with path_value.open("rb") as handle:
        if handle.read(5) != b"%PDF-":
            raise SystemExit(f"Invalid PDF magic: {path_value}")


def run(command: list[str], env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, text=True, capture_output=True, env=env)


def parse_pdfinfo(pdf_path: Path) -> dict[str, str]:
    result = run(["pdfinfo", str(pdf_path)])
    parsed: dict[str, str] = {}
    for line in result.stdout.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        parsed[key.strip()] = value.strip()
    return parsed


def parse_utc_datetime(value: str) -> datetime:
    if not value:
        raise SystemExit("generated_at missing from generation manifest")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def sha256_file(path_value: Path) -> str:
    digest = hashlib.sha256()
    with path_value.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_descriptor(path_value: Path) -> dict[str, object]:
    return {
        "file_name": path_value.name,
        "sha256": sha256_file(path_value),
        "size_bytes": path_value.stat().st_size,
        "media_type": media_type(path_value.name),
    }


def media_type(file_name: str) -> str:
    lower = file_name.lower()
    if lower.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".json"):
        return "application/json"
    if lower.endswith(".md"):
        return "text/markdown"
    if lower.endswith(".csv"):
        return "text/csv"
    if lower.endswith(".zip"):
        return "application/zip"
    return "application/octet-stream"


def unique_sorted_paths(paths: list[Path]) -> list[Path]:
    by_name: dict[str, Path] = {}
    for item in paths:
        require_file(item)
        existing = by_name.get(item.name)
        if existing is not None and existing != item:
            raise SystemExit(f"Duplicate package filename from different paths: {item.name}")
        by_name[item.name] = item
    return [by_name[name] for name in sorted(by_name)]


def write_deterministic_zip(output: Path, files: list[Path]) -> None:
    temporary = output.with_suffix(output.suffix + ".tmp")
    with ZipFile(temporary, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for file_path in sorted(files, key=lambda item: item.name):
            info = ZipInfo(file_path.name, date_time=FIXED_ZIP_TIME)
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            info.create_system = 3
            archive.writestr(info, file_path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
    temporary.replace(output)


def write_json(path_value: Path, value: object) -> None:
    path_value.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
