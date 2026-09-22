#!/usr/bin/env python3
"""Run three bounded exact searches against BCEAO native search.

Contract was discovered from the official Council of Ministers page:
GET /fr/search-bceao?search_api_fulltext=...

Read-only:
- exactly three deterministic queries;
- parse Drupal views-row result blocks and their anchors;
- do not follow result links;
- do not download documents;
- write evidence locally for CI logs/artifact only.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory/review-evidence/SANCTIONS_2016_2022/BCEAO_EXACT_SEARCH_DISCOVERY_2026-09-22.json"
VALIDATION = ROOT / "regulatory/validation/BCEAO_EXACT_SEARCH_DISCOVERY_VALIDATION_V0_1.json"
BASE = "https://www.bceao.int/fr/search-bceao"
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"

QUERIES = [
    "CM/10/06/2022",
    "CM 10 06 2022",
    "sanctions pécuniaires marché financier régional",
]

TARGET_RE = re.compile(r"CM\s*/?\s*10\s*/?\s*06\s*/?\s*2022", re.IGNORECASE)
SANCTIONS_RE = re.compile(r"sanctions?\s+p[ée]cuniaires?", re.IGNORECASE)
DECISION_RE = re.compile(r"d[ée]cision", re.IGNORECASE)


class ResultParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.depth = 0
        self.active_depth: int | None = None
        self.active_class: str | None = None
        self.parts: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self._anchor_href: str | None = None
        self._anchor_parts: list[str] = []
        self.result_blocks: list[dict[str, object]] = []
        self.page_text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        self.depth += 1
        data = dict(attrs)
        classes = (data.get("class") or "").split()
        if self.active_depth is None and any(
            c == "views-row" or c.startswith("views-row-") for c in classes
        ):
            self.active_depth = self.depth
            self.active_class = data.get("class")
            self.parts = []
            self.anchors = []
        if self.active_depth is not None and tag.lower() == "a":
            self._anchor_href = data.get("href")
            self._anchor_parts = []

    def handle_data(self, data: str) -> None:
        if not data:
            return
        self.page_text_parts.append(data)
        if self.active_depth is not None:
            self.parts.append(data)
            if self._anchor_href is not None:
                self._anchor_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.active_depth is not None and tag.lower() == "a" and self._anchor_href is not None:
            anchor_text = re.sub(r"\s+", " ", " ".join(self._anchor_parts)).strip()
            absolute = urljoin(self.base_url, self._anchor_href)
            self.anchors.append({
                "text": anchor_text,
                "href": self._anchor_href,
                "absoluteUrl": absolute,
                "host": urlparse(absolute).hostname,
            })
            self._anchor_href = None
            self._anchor_parts = []
        if self.active_depth is not None and self.depth == self.active_depth:
            text = re.sub(r"\s+", " ", html.unescape(" ".join(self.parts))).strip()
            self.result_blocks.append({
                "class": self.active_class,
                "text": text,
                "anchors": self.anchors,
                "targetReferenceMatch": bool(TARGET_RE.search(text)),
                "sanctionsSubjectMatch": bool(SANCTIONS_RE.search(text)),
                "decisionHint": bool(DECISION_RE.search(text)),
            })
            self.active_depth = None
            self.active_class = None
            self.parts = []
            self.anchors = []
        self.depth = max(0, self.depth - 1)


def fetch(query: str) -> dict[str, object]:
    url = BASE + "?" + urlencode({"search_api_fulltext": query})
    request = Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urlopen(request, timeout=25) as response:
            raw = response.read(6_000_000)
            return {
                "status": "OK",
                "query": query,
                "url": url,
                "finalUrl": response.geturl(),
                "contentType": response.headers.get("Content-Type"),
                "byteSize": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "tlsVerified": True,
                "raw": raw,
            }
    except (HTTPError, URLError, TimeoutError) as exc:
        return {
            "status": "FETCH_ERROR",
            "query": query,
            "url": url,
            "error": str(exc),
            "tlsVerified": False,
        }


def inspect(query: str) -> dict[str, object]:
    result = fetch(query)
    raw = result.pop("raw", None)
    if result.get("status") != "OK" or not isinstance(raw, bytes):
        return result
    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        source = raw.decode("latin-1", errors="replace")

    parser = ResultParser(str(result.get("finalUrl") or result["url"]))
    parser.feed(source)

    blocks = []
    for index, block in enumerate(parser.result_blocks, 1):
        blocks.append({"index": index, **block})

    target_blocks = [
        block for block in blocks
        if block["targetReferenceMatch"] or block["sanctionsSubjectMatch"]
    ]

    page_text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.page_text_parts))).strip()
    return {
        **result,
        "pageTargetReferencePresent": bool(TARGET_RE.search(page_text)),
        "pageSanctionsSubjectPresent": bool(SANCTIONS_RE.search(page_text)),
        "resultBlockCount": len(blocks),
        "targetResultBlockCount": len(target_blocks),
        "resultBlocks": blocks[:100],
        "targetResultBlocks": target_blocks[:50],
    }


def main() -> None:
    results = [inspect(query) for query in QUERIES]
    reachable = [r for r in results if r.get("status") == "OK"]
    matched = []
    for result in reachable:
        for block in result.get("targetResultBlocks", []):
            matched.append({"query": result["query"], **block})

    exact_blocks = sum(1 for b in matched if b.get("targetReferenceMatch") is True)
    sanctions_blocks = sum(1 for b in matched if b.get("sanctionsSubjectMatch") is True)

    if exact_blocks:
        target_status = "EXACT_REFERENCE_RESULT_BLOCK_FOUND"
    elif sanctions_blocks:
        target_status = "SANCTIONS_RESULT_BLOCK_FOUND_NO_EXACT_REFERENCE"
    elif any(int(r.get("resultBlockCount") or 0) > 0 for r in reachable):
        target_status = "SEARCH_RESULTS_PRESENT_NO_TARGET_BLOCK"
    else:
        target_status = "NO_RESULT_BLOCKS_FOR_BOUNDED_QUERIES"

    evidence = {
        "schemaVersion": "BCEAO_EXACT_SEARCH_DISCOVERY_V0_1",
        "sourceId": "DECISION_CM_10_06_2022",
        "reference": "CM/10/06/2022",
        "method": "BCEAO_NATIVE_GET_SEARCH_BOUNDED_QUERIES",
        "result": "PASS" if len(reachable) == len(QUERIES) else "INCOMPLETE",
        "searchAction": BASE,
        "searchMethod": "GET",
        "searchParameter": "search_api_fulltext",
        "queries": QUERIES,
        "queryCount": len(QUERIES),
        "reachableQueryCount": len(reachable),
        "targetStatus": target_status,
        "matchedResultBlockCount": len(matched),
        "exactReferenceResultBlockCount": exact_blocks,
        "sanctionsResultBlockCount": sanctions_blocks,
        "matchedResultBlocks": matched,
        "results": results,
        "boundary": {
            "nativeContractOnly": True,
            "exactlyThreeQueries": True,
            "resultLinksFollowed": False,
            "binaryMaterialized": False,
            "workflowRepositoryWriteAllowed": False,
            "automaticRelationshipInferenceAllowed": False,
            "automaticSanctionActivationAllowed": False,
            "readyForSubmissionMustRemainFalse": True,
        },
        "nextAction": (
            "If an exact or sanctions result block exposes specific BCEAO URLs, inspect only those "
            "exact URLs in a later read-only step. Otherwise do not widen the search arbitrarily."
        ),
    }

    validation = {
        "schemaVersion": "BCEAO_EXACT_SEARCH_DISCOVERY_VALIDATION_V0_1",
        "result": evidence["result"],
        "checks": {
            "nativeContractOnly": True,
            "exactlyThreeQueries": len(QUERIES) == 3,
            "resultLinksNotFollowed": True,
            "binaryNotMaterialized": True,
            "workflowRepositoryWriteDisabled": True,
            "automaticRelationshipInferenceForbidden": True,
            "automaticSanctionActivationForbidden": True,
            "readyForSubmissionFalse": True,
        },
        "targetStatus": target_status,
        "matchedResultBlockCount": len(matched),
        "exactReferenceResultBlockCount": exact_blocks,
        "sanctionsResultBlockCount": sanctions_blocks,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "result": evidence["result"],
        "targetStatus": target_status,
        "matchedResultBlocks": len(matched),
        "exactReferenceResultBlocks": exact_blocks,
        "sanctionsResultBlocks": sanctions_blocks,
    }, ensure_ascii=False))

    if evidence["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
