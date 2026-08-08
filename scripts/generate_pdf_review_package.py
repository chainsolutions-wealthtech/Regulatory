#!/usr/bin/env python3
"""Generate a reproducible PDF and deterministic pre-compliance review ZIP.

The DOCX remains the composition source. LibreOffice renders the same DOCX twice
with isolated profiles. Mutable PDF dates/IDs are normalized in-place without
changing byte lengths. The two normalized byte streams MUST be identical or the
pipeline fails. The ZIP uses fixed entry timestamps, permissions and ordering.

This pipeline never changes ready_for_submission to true.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

FIXED_ZIP_TIME = (1980, 1, 1, 0, 0, 0)
PDF_DATE_PATTERN = re.compile(rb"/(CreationDate|ModDate)\s*\((D:[^)]*)\)")
ISO_DATE_PATTERN = re.compile(
    rb"20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?"
)
PDF_ID_PATTERN = re.compile(
    rb"/ID\s*\[\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\]"
)
UUID_PATTERN = re.compile(rb"uuid:[0-9A-Fa-f-]{36}")


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

    docx_sha = sha256_file(docx)
    normalized_runs: list[bytes] = []
    with tempfile.TemporaryDirectory(prefix="regulatory-pdf-") as temporary:
        temp = Path(temporary)
        for run_number in (1, 2):
            rendered_pdf = render_docx_to_pdf(docx, temp, run_number)
            normalized_runs.append(
                normalize_pdf_bytes(
                    rendered_pdf.read_bytes(),
                    generated_at=generated_at,
                    deterministic_seed=f"{generation_id}|{docx_sha}",
                )
            )

    if normalized_runs[0] != normalized_runs[1]:
        raise SystemExit("PDF_NORMALIZATION_NOT_DETERMINISTIC")
    output_pdf.write_bytes(normalized_runs[0])
    require_pdf(output_pdf)

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
        "source_docx_sha256": docx_sha,
        "pdf_file": output_pdf.name,
        "pdf_sha256": pdf_sha,
        "pdf_size_bytes": output_pdf.stat().st_size,
        "page_count": page_count,
        "renderer": "LibreOffice Writer headless",
        "normalization": "Python fixed-length PDF date/ID normalization",
        "reproducibility_check": "TWO_ISOLATED_RENDER_RUNS_BYTE_IDENTICAL_AFTER_NORMALIZATION",
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

    with tempfile.TemporaryDirectory(prefix="regulatory-zip-check-") as temporary:
        second_zip = Path(temporary) / package_zip.name
        write_deterministic_zip(second_zip, package_entries)
        if package_zip.read_bytes() != second_zip.read_bytes():
            raise SystemExit("REVIEW_PACKAGE_ZIP_NOT_DETERMINISTIC")

    result = {
        "status": "PASS",
        "generation_id": generation_id,
        "pdf_file": output_pdf.name,
        "pdf_sha256": pdf_sha,
        "pdf_pages": page_count,
        "pdf_reproducible": True,
        "package_file": package_zip.name,
        "package_sha256": zip_sha,
        "package_entries": len(package_entries),
        "package_reproducible": True,
        "ready_for_submission": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


def render_docx_to_pdf(docx: Path, temp: Path, run_number: int) -> Path:
    home_dir = temp / f"home-{run_number}"
    render_dir = temp / f"render-{run_number}"
    profile_dir = temp / f"profile-{run_number}"
    for directory in (home_dir, render_dir, profile_dir):
        directory.mkdir(parents=True, exist_ok=True)
    rendered_pdf = render_dir / f"{docx.stem}.pdf"
    env = os.environ.copy()
    env.update(
        {
            "HOME": str(home_dir),
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
    require_pdf(rendered_pdf)
    return rendered_pdf


def normalize_pdf_bytes(data: bytes, generated_at: datetime, deterministic_seed: str) -> bytes:
    normalized = PDF_DATE_PATTERN.sub(
        lambda match: b"/" + match.group(1) + b" (" + normalize_pdf_date(match.group(2), generated_at) + b")",
        data,
    )
    normalized = ISO_DATE_PATTERN.sub(
        lambda match: normalize_iso_datetime(match.group(0), generated_at),
        normalized,
    )
    normalized = PDF_ID_PATTERN.sub(
        lambda match: normalize_pdf_id(match, deterministic_seed),
        normalized,
    )
    normalized = UUID_PATTERN.sub(
        lambda match: deterministic_uuid_bytes(match.group(0), deterministic_seed),
        normalized,
    )
    return normalized


def normalize_pdf_date(original: bytes, generated_at: datetime) -> bytes:
    digits = generated_at.strftime("%Y%m%d%H%M%S") + "0000"
    return replace_digits_preserving_length(original, digits)


def normalize_iso_datetime(original: bytes, generated_at: datetime) -> bytes:
    digits = generated_at.strftime("%Y%m%d%H%M%S") + "000000000000"
    return replace_digits_preserving_length(original, digits)


def replace_digits_preserving_length(original: bytes, digits: str) -> bytes:
    output = bytearray(original)
    digit_index = 0
    for index, value in enumerate(output):
        if 48 <= value <= 57:
            output[index] = ord(digits[digit_index % len(digits)])
            digit_index += 1
    return bytes(output)


def normalize_pdf_id(match: re.Match[bytes], deterministic_seed: str) -> bytes:
    first = deterministic_hex(deterministic_seed + "|pdf-id-1", len(match.group(1)))
    second = deterministic_hex(deterministic_seed + "|pdf-id-2", len(match.group(2)))
    return b"/ID [<" + first + b"><" + second + b">]"


def deterministic_uuid_bytes(original: bytes, deterministic_seed: str) -> bytes:
    digest = hashlib.sha256((deterministic_seed + "|uuid").encode("utf-8")).hexdigest()
    uuid = f"uuid:{digest[0:8]}-{digest[8:12]}-{digest[12:16]}-{digest[16:20]}-{digest[20:32]}"
    encoded = uuid.encode("ascii")
    if len(encoded) != len(original):
        return original
    return encoded


def deterministic_hex(seed: str, length: int) -> bytes:
    output = ""
    counter = 0
    while len(output) < length:
        output += hashlib.sha256(f"{seed}|{counter}".encode("utf-8")).hexdigest()
        counter += 1
    return output[:length].encode("ascii")


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
