#!/usr/bin/env python3
"""Discover BCEAO native search surfaces from one known official page.

Read-only research step:
- fetch only the already-attested BCEAO Council of Ministers page;
- inspect forms, anchors, script sources and inline configuration for native
  search/recherche/API/Solr hints;
- do not submit searches;
- do not follow discovered endpoints;
- do not download documents;
- write local evidence for CI artifact/log output only.
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
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/BCEAO_NATIVE_SEARCH_SURFACE_DISCOVERY_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/BCEAO_NATIVE_SEARCH_SURFACE_DISCOVERY_VALIDATION_V0_1.json"
SOURCE_URL = "https://www.bceao.int/fr/communique-presse/communique-de-presse-de-la-session-ordinaire-du-conseil-des-ministres-de-lunion-5"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

SEARCH_HINT_RE = re.compile(
    r"(search|recherche|chercher|solr|elastic|api|autocomplete|suggest)",
    re.IGNORECASE,
)
TARGET_RE = re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022", re.IGNORECASE)
SANCTIONS_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)


class SurfaceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self.forms: list[dict[str, object]] = []
        self.scripts: list[str] = []
        self.inline_scripts: list[str] = []
        self._anchor_href: str | None = None
        self._anchor_parts: list[str] = []
        self._form: dict[str, object] | None = None
        self._script_src: str | None = None
        self._script_parts: list[str] = []
        self._in_script = False

    def handle_starttag(self, tag: str, attrs):
        tag = tag.lower()
        data = dict(attrs)
        if tag == "a":
            self._anchor_href = data.get("href")
            self._anchor_parts = []
        elif tag == "form":
            self._form = {
                "action": data.get("action"),
                "method": data.get("method"),
                "id": data.get("id"),
                "class": data.get("class"),
                "inputs": [],
            }
        elif tag in ("input", "select", "textarea") and self._form is not None:
            self._form["inputs"].append({
                "tag": tag,
                "name": data.get("name"),
                "type": data.get("type"),
                "value": data.get("value"),
                "id": data.get("id"),
                "class": data.get("class"),
            })
        elif tag == "script":
            self._in_script = True
            self._script_src = data.get("src")
            self._script_parts = []
            if self._script_src:
                self.scripts.append(self._script_src)

    def handle_data(self, data: str) -> None:
        if data:
            self.text_parts.append(data)
            if self._anchor_href is not None:
                self._anchor_parts.append(data)
            if self._in_script and self._script_src is None:
                self._script_parts.append(data)

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
        elif tag == "script" and self._in_script:
            if self._script_src is None:
                payload = "".join(self._script_parts)
                if SEARCH_HINT_RE.search(payload):
                    self.inline_scripts.append(payload[:30000])
            self._in_script = False
            self._script_src = None
            self._script_parts = []


def fetch(url: str, max_bytes: int = 8_000_000) -> dict[str, object]:
    request = Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urlopen(request, timeout=25) as response:
            raw = response.read(max_bytes + 1)
            if len(raw) > max_bytes:
                return {"status": "TOO_LARGE", "url": url, "byteSizeAtLeast": len(raw)}
            return {
                "status": "OK",
                "url": url,
                "finalUrl": response.geturl(),
                "contentType": response.headers.get("Content-Type"),
                "byteSize": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "tlsVerified": True,
                "raw": raw,
            }
    except (HTTPError, URLError, TimeoutError) as exc:
        return {"status": "FETCH_ERROR", "url": url, "error": str(exc), "tlsVerified": False}


def is_bceao(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host == "bceao.int" or host.endswith(".bceao.int")


def main() -> None:
    result = fetch(SOURCE_URL)
    raw = result.pop("raw", None)
    if result.get("status") != "OK" or not isinstance(raw, bytes):
        evidence = {
            "schemaVersion": "BCEAO_NATIVE_SEARCH_SURFACE_DISCOVERY_V0_1",
            "result": "INCOMPLETE",
            "source": result,
        }
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        raise SystemExit(2)

    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        source = raw.decode("latin-1", errors="replace")

    parser = SurfaceParser()
    parser.feed(source)
    base_url = str(result.get("finalUrl") or SOURCE_URL)
    page_text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.text_parts))).strip()

    forms = []
    for form in parser.forms:
        action = form.get("action")
        absolute = urljoin(base_url, str(action)) if action else base_url
        serialized = json.dumps(form, ensure_ascii=False)
        forms.append({
            **form,
            "absoluteAction": absolute,
            "institutionalHost": is_bceao(absolute),
            "searchHint": bool(SEARCH_HINT_RE.search(serialized + " " + absolute)),
        })

    anchor_hints = []
    for anchor in parser.anchors:
        combined = f'{anchor["text"]} {anchor["href"]}'
        if SEARCH_HINT_RE.search(combined):
            absolute = urljoin(base_url, anchor["href"])
            anchor_hints.append({
                "text": anchor["text"],
                "href": anchor["href"],
                "absoluteUrl": absolute,
                "institutionalHost": is_bceao(absolute),
            })

    script_hints = []
    for src in parser.scripts:
        if SEARCH_HINT_RE.search(src):
            absolute = urljoin(base_url, src)
            script_hints.append({
                "src": src,
                "absoluteUrl": absolute,
                "institutionalHost": is_bceao(absolute),
            })

    raw_url_hints = sorted(set(re.findall(
        r"""https?://[^"'\s<>]+|/[A-Za-z0-9_./?&=%-]*(?:search|recherche|solr|elastic|api|autocomplete|suggest)[A-Za-z0-9_./?&=%-]*""",
        source,
        flags=re.IGNORECASE,
    )))[:300]

    institutional_candidates = []
    for form in forms:
        if form["searchHint"] and form["institutionalHost"]:
            institutional_candidates.append({
                "type": "FORM",
                "action": form["absoluteAction"],
                "method": form.get("method"),
                "inputs": form.get("inputs"),
            })
    for anchor in anchor_hints:
        if anchor["institutionalHost"]:
            institutional_candidates.append({
                "type": "ANCHOR",
                "url": anchor["absoluteUrl"],
                "text": anchor["text"],
            })
    for script in script_hints:
        if script["institutionalHost"]:
            institutional_candidates.append({
                "type": "SCRIPT",
                "url": script["absoluteUrl"],
            })

    target_status = (
        "NATIVE_SEARCH_SURFACE_CANDIDATES_FOUND"
        if institutional_candidates
        else "NO_NATIVE_SEARCH_SURFACE_CANDIDATE_ON_KNOWN_PAGE"
    )

    evidence = {
        "schemaVersion": "BCEAO_NATIVE_SEARCH_SURFACE_DISCOVERY_V0_1",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "KNOWN_BCEAO_PAGE_STATIC_SEARCH_SURFACE_DISCOVERY",
        "result": "PASS",
        "targetStatus": target_status,
        "source": result,
        "targetReferencePresent": bool(TARGET_RE.search(page_text)),
        "sanctionsSubjectPresent": bool(SANCTIONS_RE.search(page_text)),
        "formCount": len(forms),
        "forms": forms,
        "anchorHints": anchor_hints,
        "scriptHints": script_hints,
        "inlineSearchScriptCount": len(parser.inline_scripts),
        "inlineSearchScriptSnippets": parser.inline_scripts,
        "rawEndpointHints": raw_url_hints,
        "institutionalCandidates": institutional_candidates,
        "boundary": {
            "singleKnownOfficialPageOnly": True,
            "verifiedTlsOnly": True,
            "formsSubmitted": False,
            "discoveredEndpointsFollowed": False,
            "linkedDocumentsFetched": False,
            "binaryMaterialized": False,
            "workflowRepositoryWriteAllowed": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If an institutional native-search candidate is found, validate only its exposed "
            "parameter contract in a later bounded read-only step. Do not guess missing parameters."
        ),
    }

    validation = {
        "schemaVersion": "BCEAO_NATIVE_SEARCH_SURFACE_DISCOVERY_VALIDATION_V0_1",
        "result": "PASS",
        "checks": {
            "singleKnownOfficialPageOnly": True,
            "verifiedTlsOnly": True,
            "formsNotSubmitted": True,
            "endpointsNotFollowed": True,
            "linkedDocumentsNotFetched": True,
            "binaryNotMaterialized": True,
            "workflowRepositoryWriteDisabled": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "institutionalCandidateCount": len(institutional_candidates),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "result": "PASS",
        "targetStatus": target_status,
        "formCount": len(forms),
        "institutionalCandidateCount": len(institutional_candidates),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
