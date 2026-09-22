#!/usr/bin/env python3
"""Discover the institutional CENTIF link for Decision CM/10/06/2022.

Scope is deliberately narrow:
- fetch only the three known CENTIF regulation pages;
- locate the exact target reference in page text / anchors;
- allow an explicitly marked TLS-unverified fallback ONLY to inspect page HTML
  when the institutional server presents an incomplete certificate chain;
- follow target links only with normal TLS verification;
- never materialize a binary in this discovery step.

Any href learned through the TLS-unverified fallback is a discovery hint only.
It must be fetched and validated with verified transport before normative use.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import ssl
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/CENTIF_TARGET_LINK_DISCOVERY_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/CENTIF_TARGET_LINK_DISCOVERY_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

PAGES = [
    "https://www.centif.sn/reglementation/fr/reglcommu",
    "https://site.centif.sn/reglementation/fr/reglcommu",
    "https://jokoo.centif.sn/reglementation/fr/reglcommu",
]
TARGET_RE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE)
SUBJECT_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)


class AnchorCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.anchors: list[dict[str, str]] = []
        self._href: str | None = None
        self._parts: list[str] = []
        self.text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        if tag.lower() == "a":
            data = dict(attrs)
            self._href = data.get("href")
            self._parts = []

    def handle_data(self, data: str) -> None:
        if data:
            self.text_parts.append(data)
            if self._href is not None:
                self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href is not None:
            text = re.sub(r"\s+", " ", " ".join(self._parts)).strip()
            self.anchors.append({"href": self._href, "text": text})
            self._href = None
            self._parts = []


def _read_url(url: str, *, max_bytes: int, context: ssl.SSLContext | None) -> dict[str, object]:
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urlopen(req, timeout=25, context=context) as response:
        raw = response.read(max_bytes + 1)
        if len(raw) > max_bytes:
            return {
                "status": "TOO_LARGE",
                "url": url,
                "finalUrl": response.geturl(),
                "contentType": response.headers.get("Content-Type"),
                "byteSizeAtLeast": len(raw),
                "raw": None,
            }
        return {
            "status": "OK",
            "url": url,
            "finalUrl": response.geturl(),
            "contentType": response.headers.get("Content-Type"),
            "raw": raw,
            "byteSize": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
        }


def is_certificate_error(exc: Exception) -> bool:
    if isinstance(exc, ssl.SSLCertVerificationError):
        return True
    if isinstance(exc, URLError) and isinstance(getattr(exc, "reason", None), ssl.SSLCertVerificationError):
        return True
    return "CERTIFICATE_VERIFY_FAILED" in str(exc)


def fetch(url: str, *, max_bytes: int = 20_000_000, allow_unverified_fallback: bool = False) -> dict[str, object]:
    try:
        result = _read_url(url, max_bytes=max_bytes, context=None)
        result["tlsVerified"] = True
        return result
    except (HTTPError, URLError, TimeoutError, ssl.SSLError) as exc:
        if allow_unverified_fallback and is_certificate_error(exc):
            try:
                result = _read_url(url, max_bytes=max_bytes, context=ssl._create_unverified_context())
                result["tlsVerified"] = False
                result["transportWarning"] = "TLS_CERTIFICATE_VERIFICATION_BYPASSED_FOR_HTML_DISCOVERY_ONLY"
                result["verifiedAttemptError"] = str(exc)
                return result
            except (HTTPError, URLError, TimeoutError, ssl.SSLError) as fallback_exc:
                return {
                    "status": "FETCH_ERROR",
                    "url": url,
                    "error": str(fallback_exc),
                    "verifiedAttemptError": str(exc),
                    "unverifiedFallbackAttempted": True,
                }
        return {"status": "FETCH_ERROR", "url": url, "error": str(exc), "tlsVerified": False}


def is_centif_url(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host == "centif.sn" or host.endswith(".centif.sn")


def inspect_page(url: str) -> dict[str, object]:
    result = fetch(url, max_bytes=5_000_000, allow_unverified_fallback=True)
    base = {k: v for k, v in result.items() if k != "raw"}
    if result.get("status") != "OK":
        return base

    raw = result["raw"]
    try:
        text_html = raw.decode("utf-8")
    except UnicodeDecodeError:
        text_html = raw.decode("latin-1", errors="replace")

    parser = AnchorCollector()
    parser.feed(text_html)
    page_text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.text_parts))).strip()
    target_in_page = bool(TARGET_RE.search(page_text))
    subject_in_page = bool(SUBJECT_RE.search(page_text))

    target_anchors = []
    for anchor in parser.anchors:
        anchor_text = re.sub(r"\s+", " ", html.unescape(anchor["text"])).strip()
        if TARGET_RE.search(anchor_text):
            absolute = urljoin(str(result.get("finalUrl") or url), anchor["href"])
            target_anchors.append({
                "text": anchor_text,
                "href": anchor["href"],
                "absoluteUrl": absolute,
                "institutionalHostAllowed": is_centif_url(absolute),
                "discoveredUnderVerifiedTls": result.get("tlsVerified") is True,
            })

    context = None
    match = TARGET_RE.search(page_text)
    if match:
        context = page_text[max(0, match.start() - 300): min(len(page_text), match.end() + 500)]

    return {
        **base,
        "targetReferencePresent": target_in_page,
        "sanctionsSubjectPresent": subject_in_page,
        "anchorCount": len(parser.anchors),
        "targetAnchors": target_anchors,
        "targetContext": context,
    }


def inspect_target_link(url: str) -> dict[str, object]:
    if not is_centif_url(url):
        return {"url": url, "status": "SKIPPED_NON_CENTIF_HOST"}
    # IMPORTANT: no unverified TLS fallback for target bytes.
    result = fetch(url, allow_unverified_fallback=False)
    raw = result.pop("raw", None)
    if result.get("status") != "OK" or not isinstance(raw, (bytes, bytearray)):
        return result
    content_type = str(result.get("contentType") or "").lower()
    result["pdfMagic"] = bytes(raw).startswith(b"%PDF-")
    result["contentTypeSuggestsPdf"] = "application/pdf" in content_type or "pdf" in content_type
    result["binaryMaterializedInRepository"] = False
    return result


def main() -> None:
    pages = [inspect_page(url) for url in PAGES]
    target_anchors: list[dict[str, object]] = []
    for page in pages:
        anchors = page.get("targetAnchors")
        if isinstance(anchors, list):
            target_anchors.extend(anchors)

    unique_urls: list[str] = []
    seen: set[str] = set()
    for anchor in target_anchors:
        url = str(anchor.get("absoluteUrl") or "")
        if url and url not in seen:
            seen.add(url)
            unique_urls.append(url)

    linked = [inspect_target_link(url) for url in unique_urls]
    reachable_pages = [p for p in pages if p.get("status") == "OK"]
    verified_pages = [p for p in reachable_pages if p.get("tlsVerified") is True]
    unverified_pages = [p for p in reachable_pages if p.get("tlsVerified") is False]
    reference_pages = [p for p in reachable_pages if p.get("targetReferencePresent") is True]
    pdf_links = [x for x in linked if x.get("pdfMagic") is True and x.get("tlsVerified") is True]

    if pdf_links:
        target_status = "VERIFIED_TLS_INSTITUTIONAL_PDF_LINK_FOUND"
    elif target_anchors:
        target_status = "TARGET_ANCHOR_DISCOVERED_BINARY_NOT_VERIFIED"
    elif reference_pages:
        target_status = "REFERENCE_PRESENT_NO_TARGET_ANCHOR"
    else:
        target_status = "REFERENCE_NOT_RETRIEVED_FROM_LIVE_PAGES"

    evidence = {
        "schemaVersion": "CENTIF_TARGET_LINK_DISCOVERY_V0_2",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "TARGETED_INSTITUTIONAL_PAGE_AND_ANCHOR_DISCOVERY_WITH_TLS_DIAGNOSTIC_FALLBACK",
        "result": "PASS",
        "targetStatus": target_status,
        "pages": pages,
        "targetAnchors": target_anchors,
        "linkedResponses": linked,
        "verifiedPageCount": len(verified_pages),
        "unverifiedDiscoveryPageCount": len(unverified_pages),
        "institutionalPdfLinkCount": len(pdf_links),
        "boundary": {
            "onlyKnownCentifPagesFetched": True,
            "unverifiedTlsAllowedForHtmlDiscoveryOnly": True,
            "unverifiedTlsAllowedForTargetBinary": False,
            "onlyTargetAnchorsFollowed": True,
            "nonCentifTargetLinksFollowed": False,
            "binaryMaterializedInRepository": False,
            "discoveryIsLegalStatusProof": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionRuleActivationAllowed": False,
            "automaticSanctionAmountActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If a target href is discovered under unverified page transport, treat it only as a locator. "
            "The linked document must be fetched with verified TLS or through another authoritative transport "
            "before materialization or normative comparison."
        ),
    }

    validation = {
        "schemaVersion": "CENTIF_TARGET_LINK_DISCOVERY_VALIDATION_V0_2",
        "result": "PASS",
        "checks": {
            "scopeIsRestrictedToKnownCentifPages": True,
            "unverifiedTlsRestrictedToHtmlDiscovery": True,
            "unverifiedTlsForbiddenForTargetBinary": True,
            "onlyTargetAnchorsFollowed": True,
            "binaryNotMaterialized": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "reachablePageCount": len(reachable_pages),
        "verifiedPageCount": len(verified_pages),
        "unverifiedDiscoveryPageCount": len(unverified_pages),
        "referencePageCount": len(reference_pages),
        "targetAnchorCount": len(target_anchors),
        "institutionalPdfLinkCount": len(pdf_links),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": "PASS",
        "targetStatus": target_status,
        "reachablePages": len(reachable_pages),
        "verifiedPages": len(verified_pages),
        "unverifiedDiscoveryPages": len(unverified_pages),
        "referencePages": len(reference_pages),
        "targetAnchors": len(target_anchors),
        "verifiedInstitutionalPdfLinks": len(pdf_links),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
