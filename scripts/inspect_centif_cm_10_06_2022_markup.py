#!/usr/bin/env python3
"""Inspect CENTIF CM/10/06/2022 markup with fully verified repaired TLS.

V0.3 extends issuer recovery with a strictly pinned issuer fallback when the leaf omits AIA.
Security invariants:
- never disables TLS certificate verification;
- never disables hostname verification;
- follows only CA Issuers AIA URLs needed to build trust;
- fetches only the three known CENTIF regulation pages;
- does not follow target-adjacent application/document locators;
- does not materialize a regulatory binary;
- repository workflow remains read-only.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import ssl
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/CENTIF_TARGET_MARKUP_VERIFIED_TLS_2026-09-23.json"
VAL = ROOT / "regulatory/validation/CENTIF_TARGET_MARKUP_VERIFIED_TLS_VALIDATION_V0_3.json"
SYSTEM_CA = Path("/etc/ssl/certs/ca-certificates.crt")
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

PINNED_ISSUER_DN = "issuer=C = GB, O = Sectigo Limited, CN = Sectigo Public Server Authentication CA DV R36"
PINNED_INTERMEDIATE_URL = "http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt"
PINNED_INTERMEDIATE_SHA256 = "8c54c334b66ba4e426772af4a3f9136c19a1aec729fdb28c535c07a5a4ef22e0"

PAGES = [
    "https://www.centif.sn/reglementation/fr/reglcommu",
    "https://site.centif.sn/reglementation/fr/reglcommu",
    "https://jokoo.centif.sn/reglementation/fr/reglcommu",
]

TARGET_RE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.I)
PDF_RE = re.compile(r"""[^\s"'<>]{0,400}\.pdf(?:\?[^\s"'<>]*)?""", re.I)
LOCATOR_KEY_RE = re.compile(
    r"(href|src|url|uri|file|fichier|doc|document|download|telecharg|onclick|data|id)",
    re.I,
)


def run(args: list[str], *, input_text: str | None = None, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        input=input_text,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def fetch_bytes(url: str, *, context: ssl.SSLContext | None = None, timeout: int = 35) -> tuple[bytes, str, str | None]:
    req = Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "*/*",
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5",
        },
    )
    with urlopen(req, timeout=timeout, context=context) as response:
        return response.read(), response.geturl(), response.headers.get("Content-Type")


def extract_pems(text: str) -> list[str]:
    return re.findall(
        r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",
        text,
        flags=re.S,
    )


def cert_metadata(path: Path) -> dict[str, object]:
    cp = run([
        "openssl", "x509", "-in", str(path), "-noout",
        "-subject", "-issuer", "-serial", "-dates",
        "-fingerprint", "-sha256",
        "-ext", "authorityInfoAccess",
        "-ext", "subjectAltName",
    ])
    text = (cp.stdout + "\n" + cp.stderr).strip()
    return {
        "returncode": cp.returncode,
        "text": text,
        "caIssuers": re.findall(r"CA Issuers\s*-\s*URI:([^\s,]+)", text, flags=re.I),
    }


def parse_aia_certificates(raw: bytes, work: Path, prefix: str) -> tuple[list[Path], dict[str, object]]:
    """Parse an AIA payload as X.509 or PKCS#7, returning PEM cert paths."""
    raw_path = work / f"{prefix}.bin"
    raw_path.write_bytes(raw)

    attempts: list[dict[str, object]] = []

    # DER X.509.
    der_pem = work / f"{prefix}-x509-der.pem"
    cp = run(["openssl", "x509", "-inform", "DER", "-in", str(raw_path), "-out", str(der_pem)])
    attempts.append({"format": "X509_DER", "returncode": cp.returncode, "stderr": cp.stderr.strip()})
    if cp.returncode == 0:
        return [der_pem], {"format": "X509_DER", "attempts": attempts}

    # PEM X.509.
    pem_pem = work / f"{prefix}-x509-pem.pem"
    cp = run(["openssl", "x509", "-inform", "PEM", "-in", str(raw_path), "-out", str(pem_pem)])
    attempts.append({"format": "X509_PEM", "returncode": cp.returncode, "stderr": cp.stderr.strip()})
    if cp.returncode == 0:
        return [pem_pem], {"format": "X509_PEM", "attempts": attempts}

    # DER PKCS#7.
    p7_der = work / f"{prefix}-p7-der.pem"
    cp = run([
        "openssl", "pkcs7", "-inform", "DER", "-in", str(raw_path),
        "-print_certs", "-out", str(p7_der),
    ])
    attempts.append({"format": "PKCS7_DER", "returncode": cp.returncode, "stderr": cp.stderr.strip()})
    if cp.returncode == 0:
        certs = extract_pems(p7_der.read_text(encoding="utf-8", errors="replace"))
        paths: list[Path] = []
        for i, pem in enumerate(certs):
            p = work / f"{prefix}-p7-der-{i}.pem"
            p.write_text(pem + "\n", encoding="utf-8")
            paths.append(p)
        if paths:
            return paths, {"format": "PKCS7_DER", "certificateCount": len(paths), "attempts": attempts}

    # PEM PKCS#7.
    p7_pem = work / f"{prefix}-p7-pem.pem"
    cp = run([
        "openssl", "pkcs7", "-inform", "PEM", "-in", str(raw_path),
        "-print_certs", "-out", str(p7_pem),
    ])
    attempts.append({"format": "PKCS7_PEM", "returncode": cp.returncode, "stderr": cp.stderr.strip()})
    if cp.returncode == 0:
        certs = extract_pems(p7_pem.read_text(encoding="utf-8", errors="replace"))
        paths = []
        for i, pem in enumerate(certs):
            p = work / f"{prefix}-p7-pem-{i}.pem"
            p.write_text(pem + "\n", encoding="utf-8")
            paths.append(p)
        if paths:
            return paths, {"format": "PKCS7_PEM", "certificateCount": len(paths), "attempts": attempts}

    return [], {"format": "UNPARSED", "attempts": attempts}


def certificate_fingerprint(path: Path) -> str:
    cp = run(["openssl", "x509", "-in", str(path), "-noout", "-fingerprint", "-sha256"])
    return cp.stdout.strip()


def build_verified_context(host: str, work: Path) -> tuple[ssl.SSLContext, dict[str, object]]:
    sclient = run(
        ["openssl", "s_client", "-showcerts", "-connect", f"{host}:443", "-servername", host],
        input_text="",
        timeout=45,
    )
    combined = sclient.stdout + "\n" + sclient.stderr
    presented = extract_pems(combined)
    if not presented:
        raise RuntimeError(f"No server certificate presented by {host}")

    presented_paths: list[Path] = []
    for i, pem in enumerate(presented):
        p = work / f"{host}-presented-{i}.pem"
        p.write_text(pem + "\n", encoding="utf-8")
        presented_paths.append(p)

    leaf = presented_paths[0]
    intermediates: list[Path] = presented_paths[1:]
    fetched_records: list[dict[str, object]] = []
    seen_urls: set[str] = set()
    seen_cert_fingerprints: set[str] = {
        certificate_fingerprint(p) for p in presented_paths
    }

    # Explore AIA chain breadth-first. A PKCS#7 bundle can contain several certs.
    frontier: list[Path] = [leaf] + intermediates[:]
    for depth in range(6):
        if not frontier:
            break
        next_frontier: list[Path] = []
        for cert in frontier:
            meta = cert_metadata(cert)
            for aia_url in meta.get("caIssuers", []):
                if not isinstance(aia_url, str) or aia_url in seen_urls:
                    continue
                seen_urls.add(aia_url)
                rec: dict[str, object] = {"url": aia_url, "depth": depth}
                try:
                    context = ssl.create_default_context() if aia_url.startswith("https://") else None
                    raw, final_url, content_type = fetch_bytes(aia_url, context=context, timeout=30)
                    rec.update({
                        "status": "FETCHED",
                        "finalUrl": final_url,
                        "contentType": content_type,
                        "byteSize": len(raw),
                        "sha256": hashlib.sha256(raw).hexdigest(),
                    })
                except Exception as exc:  # noqa: BLE001
                    rec.update({"status": "FETCH_ERROR", "error": str(exc)})
                    fetched_records.append(rec)
                    continue

                paths, parse_info = parse_aia_certificates(raw, work, f"{host}-aia-{depth}-{len(fetched_records)}")
                rec["parse"] = parse_info
                accepted: list[dict[str, object]] = []
                for p in paths:
                    fp = certificate_fingerprint(p)
                    if fp in seen_cert_fingerprints:
                        accepted.append({"fingerprint": fp, "duplicate": True})
                        continue
                    seen_cert_fingerprints.add(fp)
                    intermediates.append(p)
                    next_frontier.append(p)
                    accepted.append({
                        "fingerprint": fp,
                        "duplicate": False,
                        "metadata": cert_metadata(p),
                    })
                rec["certificates"] = accepted
                rec["status"] = "PARSED" if paths else "UNPARSED"
                fetched_records.append(rec)
        frontier = next_frontier

    # CENTIF currently omits AIA entirely while presenting a leaf issued by the
    # exact same Sectigo DV R36 intermediate previously recovered and verified
    # during the official UEMOA Bulletin 113 TLS repair. Use that issuer only
    # when the leaf issuer DN is an exact match, and pin the intermediate bytes.
    issuer_fallback: dict[str, object] | None = None
    leaf_meta = cert_metadata(leaf)
    if not intermediates and PINNED_ISSUER_DN in str(leaf_meta.get("text") or ""):
        issuer_fallback = {
            "reason": "LEAF_OMITS_AIA_EXACT_ISSUER_DN_MATCH",
            "issuerDn": PINNED_ISSUER_DN,
            "url": PINNED_INTERMEDIATE_URL,
            "expectedSha256": PINNED_INTERMEDIATE_SHA256,
        }
        try:
            raw, final_url, content_type = fetch_bytes(PINNED_INTERMEDIATE_URL, context=None, timeout=30)
            actual_sha = hashlib.sha256(raw).hexdigest()
            issuer_fallback.update({
                "fetchStatus": "FETCHED",
                "finalUrl": final_url,
                "contentType": content_type,
                "byteSize": len(raw),
                "actualSha256": actual_sha,
                "sha256PinnedMatch": actual_sha == PINNED_INTERMEDIATE_SHA256,
            })
            if actual_sha != PINNED_INTERMEDIATE_SHA256:
                raise RuntimeError(
                    f"Pinned Sectigo intermediate SHA mismatch: {actual_sha}"
                )
            paths, parse_info = parse_aia_certificates(raw, work, f"{host}-pinned-issuer")
            issuer_fallback["parse"] = parse_info
            if len(paths) != 1:
                raise RuntimeError(
                    f"Expected exactly one pinned Sectigo intermediate, got {len(paths)}"
                )
            issuer_meta = cert_metadata(paths[0])
            issuer_fallback["certificateMetadata"] = issuer_meta
            expected_subject = "subject=C = GB, O = Sectigo Limited, CN = Sectigo Public Server Authentication CA DV R36"
            if expected_subject not in str(issuer_meta.get("text") or ""):
                raise RuntimeError("Pinned intermediate subject DN mismatch")
            fp = certificate_fingerprint(paths[0])
            if fp not in seen_cert_fingerprints:
                seen_cert_fingerprints.add(fp)
                intermediates.append(paths[0])
            issuer_fallback["accepted"] = True
        except Exception as exc:  # noqa: BLE001
            issuer_fallback["accepted"] = False
            issuer_fallback["error"] = str(exc)

    chain_path = work / f"{host}-intermediates.pem"
    chain_path.write_text(
        "".join(p.read_text(encoding="utf-8") for p in intermediates),
        encoding="utf-8",
    )

    verify_args = ["openssl", "verify", "-CAfile", str(SYSTEM_CA)]
    if intermediates:
        verify_args += ["-untrusted", str(chain_path)]
    verify_args += [str(leaf)]
    verify = run(verify_args)
    verified = verify.returncode == 0

    diagnostic = {
        "sClientReturnCode": sclient.returncode,
        "sClientVerifyLines": [
            line for line in combined.splitlines()
            if "Verify return code" in line or "verify error" in line.lower()
        ],
        "presentedCertificateCount": len(presented_paths),
        "leaf": cert_metadata(leaf),
        "fetchedAiaObjects": fetched_records,
        "pinnedIssuerFallback": issuer_fallback,
        "intermediateCount": len(intermediates),
        "chainVerification": {
            "returncode": verify.returncode,
            "stdout": verify.stdout.strip(),
            "stderr": verify.stderr.strip(),
            "verified": verified,
        },
    }

    if not verified:
        raise RuntimeError("TLS_CHAIN_NOT_VERIFIED|" + json.dumps(diagnostic, ensure_ascii=False))

    repaired_bundle = work / f"{host}-repaired-ca.pem"
    repaired_bundle.write_bytes(SYSTEM_CA.read_bytes() + b"\n" + chain_path.read_bytes())
    context = ssl.create_default_context(cafile=str(repaired_bundle))
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context, diagnostic


class TargetMarkupParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[dict[str, object]] = []
        self.target_nodes: list[dict[str, object]] = []

    def handle_starttag(self, tag: str, attrs):
        attr_dict = dict(attrs)
        node = {
            "tag": tag,
            "attrs": attr_dict,
            "textParts": [],
            "descendants": [],
        }
        for ancestor in self.stack:
            ancestor["descendants"].append({"tag": tag, "attrs": attr_dict})
        self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs):
        entry = {"tag": tag, "attrs": dict(attrs)}
        for ancestor in self.stack:
            ancestor["descendants"].append(entry)

    def handle_data(self, data: str):
        if not data:
            return
        for node in self.stack:
            node["textParts"].append(data)

    def handle_endtag(self, tag: str):
        idx = next(
            (i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i]["tag"] == tag),
            None,
        )
        if idx is None:
            return
        closing = self.stack[idx:]
        self.stack = self.stack[:idx]
        for node in closing:
            text = re.sub(
                r"\s+",
                " ",
                html.unescape(" ".join(node["textParts"])),
            ).strip()
            if TARGET_RE.search(text):
                self.target_nodes.append({
                    "tag": node["tag"],
                    "attrs": node["attrs"],
                    "text": text[:7000],
                    "descendants": node["descendants"][:1000],
                })


def extract_locator_candidates(nodes: list[dict[str, object]], base_url: str) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    seen: set[tuple[str, str, str]] = set()
    for node in nodes:
        inventory = [{"tag": node["tag"], "attrs": node["attrs"]}] + list(node.get("descendants", []))
        for item in inventory:
            tag = str(item.get("tag") or "")
            attrs = item.get("attrs") or {}
            if not isinstance(attrs, dict):
                continue
            for key, value in attrs.items():
                if value is None:
                    continue
                text = str(value)
                if not (LOCATOR_KEY_RE.search(str(key)) or ".pdf" in text.lower()):
                    continue
                uniq = (tag, str(key), text)
                if uniq in seen:
                    continue
                seen.add(uniq)
                absolute = urljoin(base_url, text) if text.startswith(("/", "./", "../")) else None
                candidates.append({
                    "tag": tag,
                    "attribute": str(key),
                    "value": text,
                    "absoluteUrlIfPathLike": absolute,
                })
    return candidates[:1000]


def inspect_page(page: str, work: Path) -> dict[str, object]:
    host = urlparse(page).hostname or ""
    context, tls = build_verified_context(host, work)
    raw, final_url, content_type = fetch_bytes(page, context=context, timeout=45)
    source = raw.decode("utf-8", errors="replace")
    parser = TargetMarkupParser()
    parser.feed(source)

    nodes = sorted(parser.target_nodes, key=lambda x: len(str(x.get("text") or "")))
    candidates = extract_locator_candidates(nodes[:30], final_url)

    target_contexts: list[str] = []
    decoded_source = html.unescape(source)
    for match in TARGET_RE.finditer(decoded_source):
        target_contexts.append(decoded_source[max(0, match.start()-5000):min(len(decoded_source), match.end()+8000)])
        if len(target_contexts) >= 5:
            break

    pdf_strings = sorted(set(PDF_RE.findall(source)))

    return {
        "url": page,
        "status": "OK",
        "finalUrl": final_url,
        "contentType": content_type,
        "byteSize": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "tlsVerified": True,
        "tls": tls,
        "targetReferencePresent": bool(TARGET_RE.search(html.unescape(source))),
        "targetNodeCount": len(nodes),
        "targetNodes": nodes[:30],
        "candidateLocatorsNearTarget": candidates,
        "pdfStringsInPage": pdf_strings[:500],
        "rawTargetContexts": target_contexts,
    }


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    VAL.parent.mkdir(parents=True, exist_ok=True)

    pages: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="centif-pki-") as td:
        work = Path(td)
        for page in PAGES:
            try:
                pages.append(inspect_page(page, work))
            except Exception as exc:  # noqa: BLE001
                message = str(exc)
                diag = None
                if message.startswith("TLS_CHAIN_NOT_VERIFIED|"):
                    try:
                        diag = json.loads(message.split("|", 1)[1])
                    except Exception:
                        diag = {"raw": message}
                pages.append({
                    "url": page,
                    "status": "ERROR",
                    "error": message.split("|", 1)[0] if "|" in message else message,
                    "tlsVerified": False,
                    "tlsDiagnostic": diag,
                })

    verified_pages = [p for p in pages if p.get("tlsVerified") is True]
    target_pages = [p for p in verified_pages if p.get("targetReferencePresent") is True]
    candidates: list[dict[str, object]] = []
    for page in target_pages:
        for candidate in page.get("candidateLocatorsNearTarget", []):
            candidates.append({
                "sourcePage": page.get("url"),
                **candidate,
            })

    if candidates:
        target_status = "VERIFIED_TARGET_MARKUP_LOCATOR_CANDIDATES_FOUND"
    elif target_pages:
        target_status = "VERIFIED_TARGET_PRESENT_WITHOUT_MARKUP_LOCATOR"
    elif verified_pages:
        target_status = "VERIFIED_PAGES_RETRIEVED_TARGET_NOT_PRESENT"
    else:
        target_status = "CENTIF_TLS_CHAIN_STILL_NOT_VERIFIED"

    result = "PASS" if verified_pages else "INCOMPLETE"

    evidence = {
        "schemaVersion": "CENTIF_TARGET_MARKUP_VERIFIED_TLS_V0_3",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "AIA_X509_PKCS7_OR_PINNED_EXACT_ISSUER_TLS_RAW_MARKUP_INSPECTION",
        "result": result,
        "targetStatus": target_status,
        "pageCount": len(PAGES),
        "verifiedTlsPageCount": len(verified_pages),
        "verifiedTargetPageCount": len(target_pages),
        "candidateCount": len(candidates),
        "candidates": candidates,
        "pages": pages,
        "boundary": {
            "knownCentifPagesOnly": True,
            "tlsVerificationDisabled": False,
            "hostnameVerificationDisabled": False,
            "aiaUsedOnlyForCertificateChainRepair": True,
            "pinnedIssuerFallbackRestrictedByExactDnAndSha256": True,
            "candidateLocatorsFollowed": False,
            "binaryMaterialized": False,
            "workflowRepositoryWriteAllowed": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If a concrete institutional locator adjacent to CM/10/06/2022 is found, "
            "inspect only that exact locator in a separate read-only step."
        ),
    }

    validation = {
        "schemaVersion": "CENTIF_TARGET_MARKUP_VERIFIED_TLS_VALIDATION_V0_3",
        "result": result,
        "checks": {
            "knownCentifPagesOnly": True,
            "tlsVerificationNeverDisabled": True,
            "hostnameVerificationNeverDisabled": True,
            "aiaRestrictedToCertificateChainRepair": True,
            "pinnedIssuerFallbackRestrictedByExactDnAndSha256": True,
            "candidateLocatorsNotFollowed": True,
            "binaryNotMaterialized": True,
            "workflowRepositoryWriteDisabled": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "verifiedTlsPageCount": len(verified_pages),
        "verifiedTargetPageCount": len(target_pages),
        "candidateCount": len(candidates),
    }

    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VAL.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "result": result,
        "targetStatus": target_status,
        "verifiedTlsPageCount": len(verified_pages),
        "verifiedTargetPageCount": len(target_pages),
        "candidateCount": len(candidates),
    }, ensure_ascii=False))

    if result != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
