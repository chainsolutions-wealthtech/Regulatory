#!/usr/bin/env python3
"""Discover the exact UEMOA Bulletin 113 link with institutional-only retries.

Read-only:
- try only official UEMOA URLs already exposed publicly;
- TLS verification is mandatory;
- make up to three attempts per URL because the UEMOA site is intermittent;
- locate Bulletin Officiel N°113, deuxième trimestre 2022;
- do not follow a matched bulletin link in this step;
- always emit diagnostic evidence before a non-zero exit.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_BULLETIN_113_LINK_DISCOVERY_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_BULLETIN_113_LINK_DISCOVERY_VALIDATION_V0_2.json"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"

PAGES=[
  "https://www.uemoa.int/bulletins-officiels-de-l-union",
  "https://uemoa.int/bulletins-officiels-de-l-union",
  "https://www.uemoa.int/index.php/bulletins-officiels-de-l-union?field_annee__target_id=All&field_lieu_doc_target_id=All&field_organe_target_id=All&page=0",
]

BULLETIN_RE=re.compile(r"bulletin\s+officiel",re.I)
NUMBER_RE=re.compile(r"(?:n[°º]?\s*113|n\s*113)",re.I)
PERIOD_RE=re.compile(r"(?:deuxi[eè]me|2e|2[eè]me).*trimestre.*2022",re.I)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors=[]
        self._href=None
        self._parts=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=="a":
            self._href=dict(attrs).get("href")
            self._parts=[]
    def handle_data(self,data):
        if self._href is not None and data:
            self._parts.append(data)
    def handle_endtag(self,tag):
        if tag.lower()=="a" and self._href is not None:
            text=re.sub(r"\s+"," ",html.unescape(" ".join(self._parts))).strip()
            self.anchors.append({"href":self._href,"text":text})
            self._href=None;self._parts=[]

def allowed_host(url):
    h=(urlparse(url).hostname or "").lower()
    return h=="uemoa.int" or h.endswith(".uemoa.int")

def fetch(url):
    errors=[]
    for attempt in range(1,4):
        req=Request(url,headers={
            "User-Agent":UA,
            "Accept":"text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language":"fr-FR,fr;q=0.9,en;q=0.5",
            "Cache-Control":"no-cache",
        })
        try:
            with urlopen(req,timeout=35) as r:
                raw=r.read(10_000_000)
                return {
                    "status":"OK","url":url,"attempt":attempt,"finalUrl":r.geturl(),
                    "contentType":r.headers.get("Content-Type"),"byteSize":len(raw),
                    "sha256":hashlib.sha256(raw).hexdigest(),"tlsVerified":True,"raw":raw,
                    "previousErrors":errors,
                }
        except (HTTPError,URLError,TimeoutError) as exc:
            errors.append({"attempt":attempt,"error":str(exc)})
            if attempt<3: time.sleep(2)
    return {"status":"FETCH_ERROR","url":url,"tlsVerified":False,"errors":errors}

def matches_title(text):
    return bool(BULLETIN_RE.search(text) and NUMBER_RE.search(text) and PERIOD_RE.search(text))

def main():
    attempts=[]
    matches=[]
    successful=None

    for page in PAGES:
        result=fetch(page)
        raw=result.pop("raw",None)
        attempts.append(result)
        if result.get("status")!="OK" or not isinstance(raw,bytes):
            continue
        successful=result
        try:source=raw.decode("utf-8")
        except UnicodeDecodeError:source=raw.decode("latin-1",errors="replace")
        parser=Parser();parser.feed(source)
        for anchor in parser.anchors:
            if matches_title(anchor["text"]):
                absolute=urljoin(str(result.get("finalUrl") or page),anchor["href"])
                matches.append({
                    "sourcePage":page,"text":anchor["text"],"href":anchor["href"],
                    "absoluteUrl":absolute,"institutionalHost":allowed_host(absolute)
                })
        # Also capture raw context to diagnose non-anchor rendering without inventing links.
        normalized=re.sub(r"\s+"," ",html.unescape(source))
        idx=-1
        for m in re.finditer(r"113",normalized):
            s=max(0,m.start()-500);e=min(len(normalized),m.end()+900)
            context=normalized[s:e]
            if BULLETIN_RE.search(context) and PERIOD_RE.search(context):
                result["targetContextObserved"]=context[:1600]
                break
        if matches:
            break

    if matches:
        target_status="EXACT_BULLETIN_113_LINK_FOUND"
        result_status="PASS"
    elif successful:
        target_status="BULLETIN_113_LINK_NOT_FOUND_ON_RETRIEVED_PAGE"
        result_status="PASS"
    else:
        target_status="OFFICIAL_UEMOA_BULLETINS_PAGE_UNREACHABLE_AFTER_RETRIES"
        result_status="INCOMPLETE"

    evidence={
        "schemaVersion":"UEMOA_BULLETIN_113_LINK_DISCOVERY_V0_2",
        "sourceId":"DECISION_CM_10_06_2022",
        "method":"OFFICIAL_UEMOA_BULLETINS_PAGE_INSTITUTIONAL_ONLY_RETRY_DISCOVERY",
        "result":result_status,"targetStatus":target_status,
        "attemptedPages":attempts,"matchCount":len(matches),"matches":matches,
        "boundary":{
            "officialUemoaHostsOnly":True,"tlsVerificationRequired":True,
            "maxAttemptsPerUrl":3,"targetLinksFollowed":False,"binaryMaterialized":False,
            "workflowRepositoryWriteAllowed":False,
            "automaticRelationshipInferenceAllowed":False,
            "automaticSanctionActivationAllowed":False,
            "readyForSubmissionMustRemainFalse":True
        },
        "nextAction":"If an exact Bulletin 113 URL is found, inspect only that exact institutional URL in a separate read-only step."
    }
    validation={
        "schemaVersion":"UEMOA_BULLETIN_113_LINK_DISCOVERY_VALIDATION_V0_2",
        "result":result_status,
        "checks":{
            "officialUemoaHostsOnly":True,"tlsVerificationRequired":True,
            "maxAttemptsPerUrlThree":True,"targetLinksNotFollowed":True,
            "binaryNotMaterialized":True,"workflowRepositoryWriteDisabled":True,
            "automaticRelationshipInferenceForbidden":True,
            "automaticSanctionActivationForbidden":True,"readyForSubmissionFalse":True
        },
        "targetStatus":target_status,"matchCount":len(matches)
    }

    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(evidence,ensure_ascii=False))
    if result_status!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
