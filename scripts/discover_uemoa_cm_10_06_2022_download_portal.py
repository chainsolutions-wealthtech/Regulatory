#!/usr/bin/env python3
"""Inspect the authoritative UEMOA E-DOCUCENTER download portal for CM/10/06/2022.

This step is discovery-only:
- fetch only the explicitly linked /fr/telecharger-documents page (two host aliases);
- inspect visible text, anchors, forms and script/source hints;
- do not submit forms;
- do not fetch linked documents;
- do not materialize any binary;
- do not infer legal status.
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
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_DOWNLOAD_PORTAL_DISCOVERY_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/UEMOA_DOWNLOAD_PORTAL_DISCOVERY_VALIDATION_V0_1.json"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

PAGES = [
    "https://e-docucenter.uemoa.int/fr/telecharger-documents",
    "https://www.e-docucenter.uemoa.int/fr/telecharger-documents",
]
TARGET_RE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE)
SANCTIONS_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)
YEAR_RE = re.compile(r"\b2022\b")
DOC_HINT_RE = re.compile(r"(\.pdf(?:$|[?#])|download|telecharg|télécharg|document|d[ée]cision|sanction)", re.IGNORECASE)
API_HINT_RE = re.compile(r"(api|ajax|search|recherche|document|download|telecharg)", re.IGNORECASE)


class PortalParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self.forms: list[dict[str, object]] = []
        self.scripts: list[str] = []
        self._anchor_href: str | None = None
        self._anchor_parts: list[str] = []
        self._form: dict[str, object] | None = None

    def handle_starttag(self, tag: str, attrs):
        d = dict(attrs)
        tag = tag.lower()
        if tag == "a":
            self._anchor_href = d.get("href")
            self._anchor_parts = []
        elif tag == "form":
            self._form = {
                "action": d.get("action"),
                "method": d.get("method"),
                "id": d.get("id"),
                "class": d.get("class"),
                "inputs": [],
            }
        elif tag in ("input", "select", "textarea") and self._form is not None:
            self._form["inputs"].append({
                "tag": tag,
                "name": d.get("name"),
                "type": d.get("type"),
                "value": d.get("value"),
                "id": d.get("id"),
            })
        elif tag == "script" and d.get("src"):
            self.scripts.append(d["src"])

    def handle_data(self, data: str) -> None:
        if data:
            self.text_parts.append(data)
            if self._anchor_href is not None:
                self._anchor_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "a" and self._anchor_href is not None:
            self.anchors.append({
                "href": self._anchor_href,
                "text": re.sub(r"\s+", " ", " ".join(self._anchor_parts)).strip(),
            })
            self._anchor_href = None
            self._anchor_parts = []
        elif tag == "form" and self._form is not None:
            self.forms.append(self._form)
            self._form = None


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


def inspect(url: str) -> dict[str, object]:
    result = fetch(url)
    base = {k: v for k, v in result.items() if k != "raw"}
    raw = result.get("raw")
    if result.get("status") != "OK" or not isinstance(raw, bytes):
        return base

    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        source = raw.decode("latin-1", errors="replace")

    parser = PortalParser()
    parser.feed(source)
    text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.text_parts))).strip()
    base_url = str(result.get("finalUrl") or url)

    document_links = []
    for a in parser.anchors:
        combined = f'{a["text"]} {a["href"]}'
        if DOC_HINT_RE.search(combined):
            absolute = urljoin(base_url, a["href"])
            document_links.append({
                "text": a["text"],
                "href": a["href"],
                "absoluteUrl": absolute,
                "host": urlparse(absolute).hostname,
                "pdfHint": bool(re.search(r"\.pdf(?:$|[?#])", absolute, re.I)),
                "targetReferenceHint": bool(TARGET_RE.search(combined)),
                "sanctionsHint": bool(SANCTIONS_RE.search(combined)),
                "year2022Hint": bool(YEAR_RE.search(combined)),
            })

    form_inventory = []
    for form in parser.forms:
        action = form.get("action")
        absolute_action = urljoin(base_url, str(action)) if action else base_url
        form_inventory.append({
            **form,
            "absoluteAction": absolute_action,
            "host": urlparse(absolute_action).hostname,
        })

    script_hints = []
    for src in parser.scripts:
        absolute = urljoin(base_url, src)
        if API_HINT_RE.search(src):
            script_hints.append({
                "src": src,
                "absoluteUrl": absolute,
                "host": urlparse(absolute).hostname,
            })

    source_url_hints = sorted(set(re.findall(
        r"""https?://[^"'\s<>]+|/[A-Za-z0-9_./?&=%-]*(?:api|ajax|search|recherche|document|download|telecharg)[A-Za-z0-9_./?&=%-]*""",
        source,
        flags=re.I,
    )))[:200]

    return {
        **base,
        "targetReferencePresent": bool(TARGET_RE.search(text)),
        "sanctionsSubjectPresent": bool(SANCTIONS_RE.search(text)),
        "year2022Present": bool(YEAR_RE.search(text)),
        "targetContext": context(text, TARGET_RE),
        "sanctionsContext": context(text, SANCTIONS_RE),
        "anchorCount": len(parser.anchors),
        "formCount": len(parser.forms),
        "scriptCount": len(parser.scripts),
        "documentLikeLinks": document_links,
        "forms": form_inventory,
        "scriptHints": script_hints,
        "sourceEndpointHints": source_url_hints,
    }


def main() -> None:
    pages = [inspect(url) for url in PAGES]
    reachable = [p for p in pages if p.get("status") == "OK"]
    exact_pages = [p for p in reachable if p.get("targetReferencePresent") is True]
    subject_pages = [p for p in reachable if p.get("sanctionsSubjectPresent") is True]

    candidates = []
    for page in reachable:
        links = page.get("documentLikeLinks")
        if isinstance(links, list):
            for link in links:
                if link.get("targetReferenceHint") or link.get("sanctionsHint"):
                    candidates.append({
                        "sourcePage": page.get("url"),
                        **link,
                    })

    if candidates:
        target_status = "TARGET_DOCUMENT_LINK_CANDIDATE_EXPOSED"
    elif exact_pages:
        target_status = "TARGET_REFERENCE_PRESENT_WITHOUT_DOCUMENT_LINK"
    elif subject_pages:
        target_status = "SANCTIONS_CONTEXT_PRESENT_NO_TARGET_REFERENCE"
    else:
        target_status = "NO_TARGET_TEXT_OR_LINK_ON_DOWNLOAD_PORTAL"

    evidence = {
        "schemaVersion": "UEMOA_DOWNLOAD_PORTAL_DISCOVERY_V0_1",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "AUTHORITATIVE_DOWNLOAD_PORTAL_STATIC_DISCOVERY",
        "result": "PASS" if reachable else "INCOMPLETE",
        "targetStatus": target_status,
        "pageCount": len(PAGES),
        "reachablePageCount": len(reachable),
        "exactReferencePageCount": len(exact_pages),
        "sanctionsSubjectPageCount": len(subject_pages),
        "targetDocumentCandidates": candidates,
        "pages": pages,
        "boundary": {
            "authoritativePortalOnly": True,
            "verifiedTlsOnly": True,
            "formsSubmitted": False,
            "linkedDocumentsFetched": False,
            "binaryMaterialized": False,
            "discoveryIsLegalStatusProof": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If the static portal exposes a target link, validate it separately. "
            "If it exposes a search form or endpoint hint, inspect only that exact institutional mechanism "
            "in a later bounded step without bulk crawling."
        ),
    }

    validation = {
        "schemaVersion": "UEMOA_DOWNLOAD_PORTAL_DISCOVERY_VALIDATION_V0_1",
        "result": evidence["result"],
        "checks": {
            "authoritativePortalOnly": True,
            "verifiedTlsOnly": True,
            "formsNotSubmitted": True,
            "linkedDocumentsNotFetched": True,
            "binaryNotMaterialized": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "reachablePageCount": len(reachable),
        "exactReferencePageCount": len(exact_pages),
        "sanctionsSubjectPageCount": len(subject_pages),
        "targetDocumentCandidateCount": len(candidates),
        "formCountTotal": sum(int(p.get("formCount") or 0) for p in reachable),
        "scriptHintCountTotal": sum(len(p.get("scriptHints") or []) for p in reachable),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": evidence["result"],
        "targetStatus": target_status,
        "reachablePages": len(reachable),
        "exactReferencePages": len(exact_pages),
        "subjectPages": len(subject_pages),
        "targetDocumentCandidates": len(candidates),
        "forms": validation["formCountTotal"],
        "scriptHints": validation["scriptHintCountTotal"],
    }, ensure_ascii=False))

    if evidence["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
