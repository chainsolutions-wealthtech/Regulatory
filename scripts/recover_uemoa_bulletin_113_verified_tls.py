#!/usr/bin/env python3
"""Recover UEMOA Bulletin 113 with a cryptographically verified repaired TLS chain.

The official UEMOA server currently omits an issuer needed by standard clients.
This script does NOT disable certificate verification. It:
1. obtains the server certificate chain with openssl s_client;
2. follows CA Issuers AIA URLs for missing issuer certificates;
3. verifies the leaf against the system trust store plus fetched intermediates;
4. fetches the exact official Bulletin 113 URL with hostname/TLS verification;
5. validates PDF magic/hash/size and, when local poppler tools exist, page count/text.

Read-only repository workflow. No regulatory activation is performed.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import ssl
import subprocess
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_BULLETIN_113_TLS_RECOVERY_2026-09-23.json"
VALIDATION = ROOT / "regulatory/validation/UEMOA_BULLETIN_113_TLS_RECOVERY_VALIDATION_V0_1.json"
PDF_OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/uemoa_bulletin_113_q2_2022.pdf"
TEXT_OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/uemoa_bulletin_113_q2_2022.txt"

HOST = "www.uemoa.int"
PORT = 443
PDF_URL = "https://www.uemoa.int/sites/default/files/bibliotheque/bulletin-officiel-ndeg113-de-luemoa-deuxieme-trimestre-2022.pdf"
URL_PROVENANCE = "https://www.ijdra.com/index.php/journal/article/view/829"
SYSTEM_CA = Path("/etc/ssl/certs/ca-certificates.crt")
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

TARGET_PATTERNS = [
    re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.I),
    re.compile(r"DECISION\s+N[°º]?\s*CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.I),
]
SANCTIONS_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.I)
MARKET_RE = re.compile(r"march[ée]\s+financier\s+r[ée]gional", re.I)


def run(args: list[str], *, input_text: str | None = None, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        input=input_text,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def extract_pems(output: str) -> list[str]:
    return re.findall(
        r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",
        output,
        flags=re.S,
    )


def cert_metadata(cert_path: Path) -> dict[str, object]:
    cp = run([
        "openssl", "x509", "-in", str(cert_path), "-noout",
        "-subject", "-issuer", "-serial", "-dates", "-fingerprint", "-sha256",
        "-ext", "subjectAltName", "-ext", "authorityInfoAccess",
    ])
    text = (cp.stdout + "\n" + cp.stderr).strip()
    aia = re.findall(r"CA Issuers\s*-\s*URI:([^\s,]+)", text, flags=re.I)
    return {
        "returncode": cp.returncode,
        "text": text,
        "caIssuers": aia,
    }


def fetch_bytes(url: str, *, context: ssl.SSLContext | None = None, timeout: int = 30) -> bytes:
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urlopen(req, timeout=timeout, context=context) as response:
        return response.read()


def cert_to_pem(raw: bytes, out_path: Path) -> tuple[bool, str]:
    der_path = out_path.with_suffix(".der")
    der_path.write_bytes(raw)
    # First try DER, then PEM.
    cp = run(["openssl", "x509", "-inform", "DER", "-in", str(der_path), "-out", str(out_path)])
    if cp.returncode == 0:
        return True, "DER"
    cp2 = run(["openssl", "x509", "-inform", "PEM", "-in", str(der_path), "-out", str(out_path)])
    return cp2.returncode == 0, "PEM" if cp2.returncode == 0 else "INVALID"


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)

    evidence: dict[str, object] = {
        "schemaVersion": "UEMOA_BULLETIN_113_TLS_RECOVERY_V0_1",
        "sourceId": "DECISION_CM_10_06_2022",
        "officialBulletin": "Bulletin Officiel N°113 de l'UEMOA, deuxième trimestre, 2022",
        "officialPdfUrl": PDF_URL,
        "urlProvenanceReference": URL_PROVENANCE,
        "method": "AIA_REPAIRED_FULL_TLS_VERIFICATION_AND_EXACT_OFFICIAL_PDF_FETCH",
        "result": "INCOMPLETE",
        "server": {"host": HOST, "port": PORT},
        "tls": {},
        "pdf": {},
        "textInspection": {},
        "boundary": {
            "tlsVerificationDisabled": False,
            "hostnameVerificationDisabled": False,
            "unverifiedPdfFetchAllowed": False,
            "officialUrlOnly": True,
            "binaryCommittedByWorkflow": False,
            "workflowRepositoryWriteAllowed": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
    }

    validation: dict[str, object] = {
        "schemaVersion": "UEMOA_BULLETIN_113_TLS_RECOVERY_VALIDATION_V0_1",
        "result": "INCOMPLETE",
        "checks": {
            "officialUrlOnly": True,
            "tlsVerificationNeverDisabled": True,
            "hostnameVerificationNeverDisabled": True,
            "workflowRepositoryWriteDisabled": True,
            "binaryNotCommittedByWorkflow": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
    }

    try:
        with tempfile.TemporaryDirectory(prefix="uemoa-tls-") as td:
            tmp = Path(td)

            sclient = run(
                ["openssl", "s_client", "-showcerts", "-connect", f"{HOST}:{PORT}", "-servername", HOST],
                input_text="",
                timeout=45,
            )
            pems = extract_pems(sclient.stdout + "\n" + sclient.stderr)
            evidence["tls"] = {
                "sClientReturnCode": sclient.returncode,
                "presentedCertificateCount": len(pems),
                "sClientVerifyLines": [
                    line for line in (sclient.stdout + "\n" + sclient.stderr).splitlines()
                    if "Verify return code" in line or "verify error" in line.lower()
                ],
            }
            if not pems:
                raise RuntimeError("No server certificate was recovered from openssl s_client")

            presented_paths: list[Path] = []
            for idx, pem in enumerate(pems):
                path = tmp / f"presented-{idx}.pem"
                path.write_text(pem + "\n", encoding="utf-8")
                presented_paths.append(path)

            leaf = presented_paths[0]
            leaf_meta = cert_metadata(leaf)
            evidence["tls"]["leaf"] = leaf_meta

            # Start with any intermediate certs already presented by the server.
            intermediate_paths = presented_paths[1:]
            fetched_intermediates: list[dict[str, object]] = []

            # Recursively follow AIA CA Issuers, max depth 4. Each fetched cert must
            # participate in an openssl-verified chain before use for HTTPS.
            current = leaf
            seen_urls: set[str] = set()
            for depth in range(4):
                meta = cert_metadata(current)
                urls = [u for u in meta.get("caIssuers", []) if isinstance(u, str)]
                candidate = next((u for u in urls if u not in seen_urls), None)
                if not candidate:
                    break
                seen_urls.add(candidate)
                try:
                    raw = fetch_bytes(candidate, context=ssl.create_default_context(), timeout=30) if candidate.startswith("https://") else fetch_bytes(candidate, context=None, timeout=30)
                except Exception as exc:  # noqa: BLE001
                    fetched_intermediates.append({"url": candidate, "status": "FETCH_ERROR", "error": str(exc)})
                    break
                cert_path = tmp / f"aia-{depth}.pem"
                ok, encoding = cert_to_pem(raw, cert_path)
                record: dict[str, object] = {
                    "url": candidate,
                    "status": "PARSED" if ok else "INVALID_CERTIFICATE",
                    "encoding": encoding,
                    "byteSize": len(raw),
                    "sha256": hashlib.sha256(raw).hexdigest(),
                }
                if not ok:
                    fetched_intermediates.append(record)
                    break
                record["metadata"] = cert_metadata(cert_path)
                fetched_intermediates.append(record)
                intermediate_paths.append(cert_path)
                current = cert_path

            evidence["tls"]["fetchedIntermediates"] = fetched_intermediates

            chain_path = tmp / "untrusted-chain.pem"
            chain_path.write_text(
                "".join(p.read_text(encoding="utf-8") for p in intermediate_paths),
                encoding="utf-8",
            )

            verify_args = ["openssl", "verify", "-CAfile", str(SYSTEM_CA)]
            if intermediate_paths:
                verify_args += ["-untrusted", str(chain_path)]
            verify_args += [str(leaf)]
            verify = run(verify_args)
            chain_verified = verify.returncode == 0
            evidence["tls"]["chainVerification"] = {
                "returncode": verify.returncode,
                "stdout": verify.stdout.strip(),
                "stderr": verify.stderr.strip(),
                "verified": chain_verified,
            }
            validation["checks"]["leafChainVerifiedToSystemRoot"] = chain_verified
            if not chain_verified:
                raise RuntimeError("Unable to verify UEMOA leaf certificate to the system trust store")

            bundle = tmp / "repaired-ca-bundle.pem"
            bundle.write_bytes(SYSTEM_CA.read_bytes() + b"\n" + chain_path.read_bytes())
            context = ssl.create_default_context(cafile=str(bundle))
            context.check_hostname = True
            context.verify_mode = ssl.CERT_REQUIRED

            request = Request(PDF_URL, headers={"User-Agent": UA, "Accept": "application/pdf,*/*;q=0.8"})
            with urlopen(request, timeout=90, context=context) as response:
                pdf = response.read()
                final_url = response.geturl()
                content_type = response.headers.get("Content-Type")

            pdf_magic = pdf.startswith(b"%PDF-")
            pdf_sha = hashlib.sha256(pdf).hexdigest()
            PDF_OUT.write_bytes(pdf)

            evidence["pdf"] = {
                "fetchStatus": "OK",
                "finalUrl": final_url,
                "contentType": content_type,
                "byteSize": len(pdf),
                "sha256": pdf_sha,
                "pdfMagic": pdf_magic,
                "tlsVerifiedWithRepairedChain": True,
            }
            validation["checks"]["pdfMagicValid"] = pdf_magic
            validation["checks"]["officialPdfFetchedWithVerifiedTls"] = True
            if not pdf_magic:
                raise RuntimeError("Official URL did not return a PDF binary")

            # Optional local PDF inspection.
            page_count = None
            if shutil.which("pdfinfo"):
                info = run(["pdfinfo", str(PDF_OUT)], timeout=45)
                m = re.search(r"^Pages:\s+(\d+)\s*$", info.stdout, flags=re.M)
                page_count = int(m.group(1)) if m else None

            extraction_status = "PDFTOTEXT_UNAVAILABLE"
            target_present = None
            sanctions_present = None
            market_present = None
            contexts: list[str] = []
            if shutil.which("pdftotext"):
                cp = run(["pdftotext", "-layout", str(PDF_OUT), str(TEXT_OUT)], timeout=120)
                extraction_status = "OK" if cp.returncode == 0 and TEXT_OUT.exists() else "FAILED"
                if extraction_status == "OK":
                    text = TEXT_OUT.read_text(encoding="utf-8", errors="replace")
                    normalized = normalize_text(text)
                    target_present = any(p.search(normalized) for p in TARGET_PATTERNS)
                    sanctions_present = bool(SANCTIONS_RE.search(normalized))
                    market_present = bool(MARKET_RE.search(normalized))
                    for pattern in TARGET_PATTERNS + [SANCTIONS_RE]:
                        m = pattern.search(normalized)
                        if m:
                            contexts.append(normalized[max(0, m.start()-350):min(len(normalized), m.end()+900)])

            evidence["textInspection"] = {
                "pageCount": page_count,
                "extractionStatus": extraction_status,
                "targetDecisionReferencePresent": target_present,
                "sanctionsPecuniairesPresent": sanctions_present,
                "marcheFinancierRegionalPresent": market_present,
                "contexts": contexts[:5],
            }
            validation["checks"]["targetDecisionReferencePresent"] = target_present
            validation["checks"]["textExtractionSucceeded"] = extraction_status == "OK"

            evidence["result"] = "PASS"
            validation["result"] = "PASS"

    except Exception as exc:  # noqa: BLE001
        evidence["error"] = str(exc)

    EVIDENCE.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": evidence["result"],
        "error": evidence.get("error"),
        "tls": evidence.get("tls"),
        "pdf": evidence.get("pdf"),
        "textInspection": evidence.get("textInspection"),
    }, ensure_ascii=False))

    if evidence["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
