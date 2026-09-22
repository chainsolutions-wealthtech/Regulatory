#!/usr/bin/env python3
"""Targeted BCEAO/UEMOA institutional link discovery for CM/10/06/2022.

This script does not crawl the web. It fetches only known authoritative pages
already linked to the 24 June 2022 sanctions revision and inventories document-like
links exposed by those pages. No binary is materialized and no legal effect is inferred.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/BCEAO_UEMOA_TARGETED_ARCHIVE_DISCOVERY_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/BCEAO_UEMOA_TARGETED_ARCHIVE_DISCOVERY_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

PAGES = [
    {
        "authority": "BCEAO",
        "url": "https://www.bceao.int/fr/communique-presse/communique-de-presse-de-la-session-ordinaire-du-conseil-des-ministres-de-lunion-5",
    },
    {
        "authority": "UEMOA_EDOCUCENTER",
        "url": "https://e-docucenter.uemoa.int/fr/27-principales-realisations-de-lunion",
    },
    {
        "authority": "UEMOA_EDOCUCENTER",
        "url": "https://www.e-docucenter.uemoa.int/fr/114-une-monnaie-commune-et-un-ecosysteme-financier-de-plus-en-plus-dynamique",
    },
]

TARGET_RE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE)
SANCTIONS_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)
DOC_HINT_RE = re.compile(r"(\.pdf(?:$|[?#])|document|decision|d[ée]cision|sanction|10[-_/ ]06[-_/ ]2022)", re.IGNORECASE)


class Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self._href: str | None = None
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        if tag.lower() == "a":
            d = dict(attrs)
            self._href = d.get("href")
            self._parts = []

    def handle_data(self, data: str) -> None:
        if data:
            self.text.append(data)
            if self._href is not None:
                self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append({
                "href": self._href,
                "text": re.sub(r"\s+", " ", " ".join(self._parts)).strip(),
            })
            self._href = None
            self._parts = []


def fetch(url: str, max_bytes: int = 8_000_000) -> dict[str, object]:
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urlopen(req, timeout=25) as response:
            raw = response.read(max_bytes + 1)
            if len(raw) > max_bytes:
                return {"status": "TOO_LARGE", "url": url, "byteSizeAtLeast": len(raw)}
            return {
                "status": "OK",
                "url": url,
                "finalUrl": response.geturl(),
                "contentType": response.headers.get("Content-Type"),
                "raw": raw,
                "byteSize": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "tlsVerified": True,
            }
    except (HTTPError, URLError, TimeoutError) as exc:
        return {"status": "FETCH_ERROR", "url": url, "error": str(exc), "tlsVerified": False}


def context(text: str, pattern: re.Pattern[str]) -> str | None:
    m = pattern.search(text)
    if not m:
        return None
    return text[max(0, m.start() - 350):min(len(text), m.end() + 700)]


def inspect(authority: str, url: str) -> dict[str, object]:
    result = fetch(url)
    base = {k: v for k, v in result.items() if k != "raw"}
    raw = result.get("raw")
    if result.get("status") != "OK" or not isinstance(raw, bytes):
        return {"authority": authority, **base}

    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        source = raw.decode("latin-1", errors="replace")
    parser = Parser()
    parser.feed(source)
    text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.text))).strip()
    base_url = str(result.get("finalUrl") or url)

    links = []
    for a in parser.anchors:
        absolute = urljoin(base_url, a["href"])
        combined = f'{a["text"]} {a["href"]}'
        if DOC_HINT_RE.search(combined):
            links.append({
                "text": a["text"],
                "href": a["href"],
                "absoluteUrl": absolute,
                "host": urlparse(absolute).hostname,
                "pdfHint": bool(re.search(r"\.pdf(?:$|[?#])", absolute, re.I)),
                "targetReferenceHint": bool(TARGET_RE.search(combined)),
                "sanctionsHint": bool(SANCTIONS_RE.search(combined)),
            })

    return {
        "authority": authority,
        **base,
        "targetReferencePresent": bool(TARGET_RE.search(text)),
        "sanctionsSubjectPresent": bool(SANCTIONS_RE.search(text)),
        "targetContext": context(text, TARGET_RE),
        "sanctionsContext": context(text, SANCTIONS_RE),
        "anchorCount": len(parser.anchors),
        "documentLikeLinks": links,
    }


def main() -> None:
    pages = [inspect(x["authority"], x["url"]) for x in PAGES]
    reachable = [p for p in pages if p.get("status") == "OK"]
    subject_pages = [p for p in reachable if p.get("sanctionsSubjectPresent") is True]
    exact_pages = [p for p in reachable if p.get("targetReferencePresent") is True]

    candidates = []
    for page in reachable:
        for link in page.get("documentLikeLinks", []) if isinstance(page.get("documentLikeLinks"), list) else []:
            if link.get("targetReferenceHint") or link.get("sanctionsHint"):
                candidates.append({
                    "authority": page.get("authority"),
                    "sourcePage": page.get("url"),
                    **link,
                })

    target_status = (
        "TARGET_DOCUMENT_LINK_CANDIDATE_FOUND"
        if candidates
        else "REVISION_CONTEXT_CONFIRMED_NO_TARGET_DOCUMENT_LINK"
    )

    evidence = {
        "schemaVersion": "BCEAO_UEMOA_TARGETED_ARCHIVE_DISCOVERY_V0_1",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "KNOWN_AUTHORITATIVE_PAGES_DOCUMENT_LINK_INVENTORY",
        "result": "PASS" if reachable else "INCOMPLETE",
        "targetStatus": target_status,
        "pageCount": len(PAGES),
        "reachablePageCount": len(reachable),
        "sanctionsSubjectPageCount": len(subject_pages),
        "exactReferencePageCount": len(exact_pages),
        "pages": pages,
        "targetDocumentCandidates": candidates,
        "boundary": {
            "knownPagesOnly": True,
            "verifiedTlsOnly": True,
            "linkedDocumentsFetched": False,
            "binaryMaterialized": False,
            "discoveryIsLegalStatusProof": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If a target document candidate is exposed, validate that exact authoritative URL in a separate step. "
            "Otherwise preserve the non-indexed archive recovery boundary."
        ),
    }

    validation = {
        "schemaVersion": "BCEAO_UEMOA_TARGETED_ARCHIVE_DISCOVERY_VALIDATION_V0_1",
        "result": evidence["result"],
        "checks": {
            "knownPagesOnly": True,
            "verifiedTlsOnly": True,
            "linkedDocumentsNotFetched": True,
            "binaryNotMaterialized": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "reachablePageCount": len(reachable),
        "sanctionsSubjectPageCount": len(subject_pages),
        "exactReferencePageCount": len(exact_pages),
        "targetDocumentCandidateCount": len(candidates),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": evidence["result"],
        "targetStatus": target_status,
        "reachablePages": len(reachable),
        "subjectPages": len(subject_pages),
        "exactReferencePages": len(exact_pages),
        "targetDocumentCandidates": len(candidates),
    }, ensure_ascii=False))

    if evidence["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
