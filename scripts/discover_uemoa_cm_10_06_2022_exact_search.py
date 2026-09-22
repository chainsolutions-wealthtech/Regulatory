#!/usr/bin/env python3
"""Run a bounded search against the authoritative UEMOA E-DOCUCENTER search form.

Only three exact research queries are submitted to /fr/search/node?keys=...
No result links are followed and no binary is downloaded in this step.
"""

from __future__ import annotations
import hashlib, html, json, re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_EXACT_SEARCH_DISCOVERY_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_EXACT_SEARCH_DISCOVERY_VALIDATION_V0_1.json"
BASE="https://e-docucenter.uemoa.int/fr/search/node"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"

QUERIES=[
    "CM/10/06/2022",
    "CM 10 06 2022",
    "sanctions pécuniaires marché financier régional",
]
TARGET_RE=re.compile(r"CM\s*/?\s*10\s*/?\s*06\s*/?\s*2022",re.I)
SANCTIONS_RE=re.compile(r"sanctions?\s+p[ée]cuniaires?",re.I)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text=[]
        self.anchors=[]
        self._href=None
        self._parts=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=="a":
            self._href=dict(attrs).get("href")
            self._parts=[]
    def handle_data(self,data):
        if data:
            self.text.append(data)
            if self._href is not None:self._parts.append(data)
    def handle_endtag(self,tag):
        if tag.lower()=="a" and self._href is not None:
            self.anchors.append({"href":self._href,"text":re.sub(r"\s+"," "," ".join(self._parts)).strip()})
            self._href=None;self._parts=[]

def fetch(url):
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/html,*/*"})
    try:
        with urlopen(req,timeout=25) as r:
            raw=r.read(5_000_000)
            return {"status":"OK","url":url,"finalUrl":r.geturl(),"contentType":r.headers.get("Content-Type"),
                    "byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"raw":raw,"tlsVerified":True}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","url":url,"error":str(exc),"tlsVerified":False}

def inspect(query):
    url=BASE+"?"+urlencode({"keys":query})
    result=fetch(url)
    base={k:v for k,v in result.items() if k!="raw"}
    raw=result.get("raw")
    if result.get("status")!="OK" or not isinstance(raw,bytes):
        return {"query":query,**base}
    try:source=raw.decode("utf-8")
    except UnicodeDecodeError:source=raw.decode("latin-1",errors="replace")
    p=Parser();p.feed(source)
    text=re.sub(r"\s+"," ",html.unescape(" ".join(p.text))).strip()
    anchors=[]
    for a in p.anchors:
        absolute=urljoin(str(result.get("finalUrl") or url),a["href"])
        combined=f'{a["text"]} {a["href"]}'
        if TARGET_RE.search(combined) or SANCTIONS_RE.search(combined) or "/fr/" in a["href"]:
            anchors.append({
                "text":a["text"],"href":a["href"],"absoluteUrl":absolute,
                "host":urlparse(absolute).hostname,
                "targetReferenceHint":bool(TARGET_RE.search(combined)),
                "sanctionsHint":bool(SANCTIONS_RE.search(combined)),
            })
    return {
        "query":query,**base,
        "targetReferencePresent":bool(TARGET_RE.search(text)),
        "sanctionsSubjectPresent":bool(SANCTIONS_RE.search(text)),
        "anchorCount":len(p.anchors),
        "candidateAnchors":anchors[:200],
    }

def main():
    results=[inspect(q) for q in QUERIES]
    reachable=[x for x in results if x.get("status")=="OK"]
    candidates=[]
    for r in reachable:
        for a in r.get("candidateAnchors",[]):
            if a.get("targetReferenceHint") or a.get("sanctionsHint"):
                candidates.append({"query":r["query"],**a})
    exact=sum(1 for r in reachable if r.get("targetReferencePresent") is True)
    subj=sum(1 for r in reachable if r.get("sanctionsSubjectPresent") is True)
    if candidates:
        target_status="INSTITUTIONAL_SEARCH_CANDIDATE_FOUND"
    elif exact:
        target_status="REFERENCE_PRESENT_IN_SEARCH_RESULTS_NO_MATCHED_ANCHOR"
    elif subj:
        target_status="SANCTIONS_TEXT_PRESENT_NO_TARGET_CANDIDATE"
    else:
        target_status="NO_TARGET_RESULT_FROM_BOUNDED_INSTITUTIONAL_SEARCH"

    evidence={
        "schemaVersion":"UEMOA_EXACT_SEARCH_DISCOVERY_V0_1",
        "sourceId":"DECISION_CM_10_06_2022",
        "reference":"CM/10/06/2022",
        "method":"AUTHORITATIVE_DRUPAL_SEARCH_GET_BOUNDED_QUERIES",
        "result":"PASS" if len(reachable)==len(QUERIES) else "INCOMPLETE",
        "queries":QUERIES,
        "queryCount":len(QUERIES),
        "reachableQueryCount":len(reachable),
        "targetStatus":target_status,
        "exactReferencePageCount":exact,
        "sanctionsSubjectPageCount":subj,
        "candidateCount":len(candidates),
        "candidates":candidates,
        "results":results,
        "boundary":{
            "authoritativeSearchOnly":True,
            "queryCountBounded":True,
            "resultLinksFollowed":False,
            "binaryMaterialized":False,
            "automaticRelationshipInferenceAllowed":False,
            "automaticSanctionActivationAllowed":False,
            "readyForSubmissionMustRemainFalse":True,
        },
        "nextAction":"If exact result candidates appear, inspect only those exact institutional result URLs in a separate governed step."
    }
    validation={
        "schemaVersion":"UEMOA_EXACT_SEARCH_DISCOVERY_VALIDATION_V0_1",
        "result":evidence["result"],
        "checks":{
            "authoritativeSearchOnly":True,
            "queryCountExactlyThree":len(QUERIES)==3,
            "resultLinksNotFollowed":True,
            "binaryNotMaterialized":True,
            "automaticRelationshipInferenceForbidden":True,
            "automaticSanctionActivationForbidden":True,
            "readyForSubmissionFalse":True,
        },
        "targetStatus":target_status,
        "candidateCount":len(candidates),
        "reachableQueryCount":len(reachable),
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":evidence["result"],"targetStatus":target_status,"candidates":len(candidates)},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
