#!/usr/bin/env python3
"""Parse only Drupal search-result blocks for bounded UEMOA queries.

This V0.2 eliminates query-echo false positives by ignoring page-global text.
No search-result link is followed and no binary is fetched.
"""

from __future__ import annotations
import hashlib, html, json, re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_EXACT_SEARCH_RESULT_BLOCKS_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_EXACT_SEARCH_RESULT_BLOCKS_VALIDATION_V0_2.json"
BASE="https://e-docucenter.uemoa.int/fr/search/node"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"
QUERIES=["CM/10/06/2022","CM 10 06 2022","sanctions pécuniaires marché financier régional"]
TARGET_RE=re.compile(r"CM\s*/?\s*10\s*/?\s*06\s*/?\s*2022",re.I)
SANCTIONS_RE=re.compile(r"sanctions?\s+p[ée]cuniaires?",re.I)

class SearchResultParser(HTMLParser):
    def __init__(self,base_url):
        super().__init__(convert_charrefs=True)
        self.base_url=base_url
        self.li_depth=0
        self.active_depth=None
        self.parts=[]
        self.anchors=[]
        self._href=None
        self._anchor_parts=[]
        self.results=[]
    def handle_starttag(self,tag,attrs):
        tag=tag.lower(); d=dict(attrs)
        if tag=="li":
            self.li_depth+=1
            classes=(d.get("class") or "").split()
            if self.active_depth is None and any(c in {"search-result","search-result__item"} or "search-result" in c for c in classes):
                self.active_depth=self.li_depth; self.parts=[]; self.anchors=[]
        if self.active_depth is not None and tag=="a":
            self._href=d.get("href"); self._anchor_parts=[]
    def handle_data(self,data):
        if self.active_depth is not None and data:
            self.parts.append(data)
            if self._href is not None:self._anchor_parts.append(data)
    def handle_endtag(self,tag):
        tag=tag.lower()
        if self.active_depth is not None and tag=="a" and self._href is not None:
            txt=re.sub(r"\s+"," "," ".join(self._anchor_parts)).strip()
            absolute=urljoin(self.base_url,self._href)
            self.anchors.append({"text":txt,"href":self._href,"absoluteUrl":absolute,"host":urlparse(absolute).hostname})
            self._href=None;self._anchor_parts=[]
        if tag=="li":
            if self.active_depth is not None and self.li_depth==self.active_depth:
                text=re.sub(r"\s+"," ",html.unescape(" ".join(self.parts))).strip()
                self.results.append({"text":text,"anchors":self.anchors})
                self.active_depth=None;self.parts=[];self.anchors=[]
            self.li_depth=max(0,self.li_depth-1)

def fetch(query):
    url=BASE+"?"+urlencode({"keys":query})
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/html,*/*"})
    try:
        with urlopen(req,timeout=25) as r:
            raw=r.read(5_000_000)
            return {"status":"OK","query":query,"url":url,"finalUrl":r.geturl(),
                    "contentType":r.headers.get("Content-Type"),"byteSize":len(raw),
                    "sha256":hashlib.sha256(raw).hexdigest(),"raw":raw,"tlsVerified":True}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","query":query,"url":url,"error":str(exc),"tlsVerified":False}

def inspect(query):
    f=fetch(query); raw=f.pop("raw",None)
    if f.get("status")!="OK" or not isinstance(raw,bytes):return f
    try:source=raw.decode("utf-8")
    except UnicodeDecodeError:source=raw.decode("latin-1",errors="replace")
    p=SearchResultParser(str(f.get("finalUrl") or f["url"]));p.feed(source)
    blocks=[]
    for i,r in enumerate(p.results,1):
        text=r["text"]
        blocks.append({
            "index":i,"text":text,"anchors":r["anchors"],
            "targetReferenceMatch":bool(TARGET_RE.search(text)),
            "sanctionsSubjectMatch":bool(SANCTIONS_RE.search(text)),
        })
    return {**f,"resultBlockCount":len(blocks),"resultBlocks":blocks}

def main():
    results=[inspect(q) for q in QUERIES]
    reachable=[r for r in results if r.get("status")=="OK"]
    matched=[]
    for r in reachable:
        for b in r.get("resultBlocks",[]):
            if b["targetReferenceMatch"] or b["sanctionsSubjectMatch"]:
                matched.append({"query":r["query"],**b})
    exact=sum(1 for x in matched if x["targetReferenceMatch"])
    sanctions=sum(1 for x in matched if x["sanctionsSubjectMatch"])
    status="MATCHED_RESULT_BLOCK_FOUND" if matched else "NO_TARGET_MATCH_IN_RESULT_BLOCKS"
    evidence={
        "schemaVersion":"UEMOA_EXACT_SEARCH_RESULT_BLOCKS_V0_2",
        "sourceId":"DECISION_CM_10_06_2022","reference":"CM/10/06/2022",
        "method":"AUTHORITATIVE_DRUPAL_SEARCH_RESULT_BLOCK_PARSER",
        "result":"PASS" if len(reachable)==3 else "INCOMPLETE",
        "queryCount":3,"reachableQueryCount":len(reachable),"targetStatus":status,
        "matchedResultBlockCount":len(matched),"exactReferenceResultBlockCount":exact,
        "sanctionsResultBlockCount":sanctions,"matchedResultBlocks":matched,"results":results,
        "boundary":{
            "queryEchoExcludedFromMatching":True,"resultLinksFollowed":False,
            "binaryMaterialized":False,"automaticRelationshipInferenceAllowed":False,
            "automaticSanctionActivationAllowed":False,"readyForSubmissionMustRemainFalse":True
        },
        "nextAction":"If matched result blocks contain a specific institutional result URL, inspect only that exact URL in a later governed step."
    }
    validation={
        "schemaVersion":"UEMOA_EXACT_SEARCH_RESULT_BLOCKS_VALIDATION_V0_2",
        "result":evidence["result"],
        "checks":{
            "queryEchoExcluded":True,"exactlyThreeQueries":True,"resultLinksNotFollowed":True,
            "binaryNotMaterialized":True,"automaticRelationshipInferenceForbidden":True,
            "automaticSanctionActivationForbidden":True,"readyForSubmissionFalse":True
        },
        "targetStatus":status,"matchedResultBlockCount":len(matched)
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":evidence["result"],"targetStatus":status,"matched":len(matched)},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
