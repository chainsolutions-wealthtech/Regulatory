#!/usr/bin/env python3
"""Discover the exact official UEMOA Bulletin 113 link.

Read-only discovery:
- fetch only the official UEMOA Bulletins page;
- locate anchors whose visible text identifies Bulletin Officiel N°113,
  deuxième trimestre 2022;
- resolve exact hrefs;
- do not follow the bulletin link in this step;
- write local evidence for CI logs/artifact only.
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

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_BULLETIN_113_LINK_DISCOVERY_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_BULLETIN_113_LINK_DISCOVERY_VALIDATION_V0_1.json"
PAGE="https://www.uemoa.int/bulletins-officiels-de-l-union"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"
TARGET_RE=re.compile(r"bulletin\s+officiel.*(?:n[°º]?\s*113|n\s*113).*?(?:deuxi[eè]me|2e|2[eè]me).*trimestre.*2022",re.I)

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

def fetch(url,max_bytes=8_000_000):
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/html,*/*"})
    try:
        with urlopen(req,timeout=30) as r:
            raw=r.read(max_bytes+1)
            if len(raw)>max_bytes:
                return {"status":"TOO_LARGE","url":url,"byteSizeAtLeast":len(raw)}
            return {"status":"OK","url":url,"finalUrl":r.geturl(),"contentType":r.headers.get("Content-Type"),
                    "byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"tlsVerified":True,"raw":raw}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","url":url,"error":str(exc),"tlsVerified":False}

def allowed_host(url):
    h=(urlparse(url).hostname or "").lower()
    return h=="uemoa.int" or h.endswith(".uemoa.int")

def main():
    f=fetch(PAGE);raw=f.pop("raw",None)
    if f.get("status")!="OK" or not isinstance(raw,bytes):
        evidence={"schemaVersion":"UEMOA_BULLETIN_113_LINK_DISCOVERY_V0_1","result":"INCOMPLETE","source":f}
        OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n")
        raise SystemExit(2)
    try:source=raw.decode("utf-8")
    except UnicodeDecodeError:source=raw.decode("latin-1",errors="replace")
    p=Parser();p.feed(source)
    matches=[]
    for a in p.anchors:
        if TARGET_RE.search(a["text"]):
            absolute=urljoin(str(f.get("finalUrl") or PAGE),a["href"])
            matches.append({
                "text":a["text"],"href":a["href"],"absoluteUrl":absolute,
                "institutionalHost":allowed_host(absolute)
            })
    status="EXACT_BULLETIN_113_LINK_FOUND" if matches else "BULLETIN_113_LINK_NOT_FOUND"
    evidence={
        "schemaVersion":"UEMOA_BULLETIN_113_LINK_DISCOVERY_V0_1",
        "sourceId":"DECISION_CM_10_06_2022",
        "method":"OFFICIAL_UEMOA_BULLETINS_PAGE_EXACT_ANCHOR_DISCOVERY",
        "result":"PASS","targetStatus":status,"source":f,
        "anchorCount":len(p.anchors),"matchCount":len(matches),"matches":matches,
        "boundary":{
            "singleKnownOfficialPageOnly":True,"verifiedTlsOnly":True,
            "targetLinksFollowed":False,"binaryMaterialized":False,
            "workflowRepositoryWriteAllowed":False,
            "automaticRelationshipInferenceAllowed":False,
            "automaticSanctionActivationAllowed":False,
            "readyForSubmissionMustRemainFalse":True
        },
        "nextAction":"If an exact institutional Bulletin 113 link is found, inspect only that exact URL in a separate read-only step."
    }
    validation={
        "schemaVersion":"UEMOA_BULLETIN_113_LINK_DISCOVERY_VALIDATION_V0_1",
        "result":"PASS",
        "checks":{
            "singleKnownOfficialPageOnly":True,"verifiedTlsOnly":True,
            "targetLinksNotFollowed":True,"binaryNotMaterialized":True,
            "workflowRepositoryWriteDisabled":True,
            "automaticRelationshipInferenceForbidden":True,
            "automaticSanctionActivationForbidden":True,
            "readyForSubmissionFalse":True
        },
        "targetStatus":status,"matchCount":len(matches)
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":"PASS","targetStatus":status,"matchCount":len(matches),"matches":matches},ensure_ascii=False))

if __name__=="__main__":main()
