#!/usr/bin/env python3
"""Validate BCEAO native search semantics with positive/negative witnesses.

Queries:
1) known positive witness already publicly present on BCEAO,
2) impossible negative sentinel,
3) target CM/10/06/2022.

Read-only: no result link is followed and no binary is downloaded.
"""

from __future__ import annotations
import hashlib, html, json, re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/BCEAO_SEARCH_SEMANTICS_VALIDATION_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/BCEAO_SEARCH_SEMANTICS_VALIDATION_V0_1.json"
BASE="https://www.bceao.int/fr/search-bceao"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"

POSITIVE="Décision n°021 du 21/12/2023/CM/UMOA"
NEGATIVE="ZZZ_REGULATORY_SENTINEL_NO_MATCH_987654321"
TARGET="CM/10/06/2022"
WITNESS_RE=re.compile(r"d[ée]cision\s*n[°º]?\s*0?21.*21\s*/\s*12\s*/\s*2023\s*/\s*CM\s*/\s*UMOA",re.I)
TARGET_RE=re.compile(r"CM\s*/?\s*10\s*/?\s*06\s*/?\s*2022",re.I)

class Parser(HTMLParser):
    def __init__(self,base):
        super().__init__(convert_charrefs=True);self.base=base;self.depth=0;self.active=None;self.parts=[];self.anchors=[];self.href=None;self.ap=[];self.blocks=[]
    def handle_starttag(self,tag,attrs):
        self.depth+=1;d=dict(attrs);classes=(d.get("class") or "").split()
        if self.active is None and any(c=="views-row" or c.startswith("views-row-") for c in classes):
            self.active=self.depth;self.parts=[];self.anchors=[]
        if self.active is not None and tag.lower()=="a":
            self.href=d.get("href");self.ap=[]
    def handle_data(self,data):
        if self.active is not None and data:
            self.parts.append(data)
            if self.href is not None:self.ap.append(data)
    def handle_endtag(self,tag):
        if self.active is not None and tag.lower()=="a" and self.href is not None:
            self.anchors.append({"text":re.sub(r"\s+"," "," ".join(self.ap)).strip(),"href":self.href,"absoluteUrl":urljoin(self.base,self.href)})
            self.href=None;self.ap=[]
        if self.active is not None and self.depth==self.active:
            text=re.sub(r"\s+"," ",html.unescape(" ".join(self.parts))).strip()
            self.blocks.append({"text":text,"anchors":self.anchors})
            self.active=None;self.parts=[];self.anchors=[]
        self.depth=max(0,self.depth-1)

def query(q):
    url=BASE+"?"+urlencode({"search_api_fulltext":q})
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/html,*/*"})
    try:
        with urlopen(req,timeout=25) as r:
            raw=r.read(6_000_000)
            meta={"status":"OK","query":q,"url":url,"finalUrl":r.geturl(),"byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"tlsVerified":True}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","query":q,"url":url,"error":str(exc),"tlsVerified":False}
    try:s=raw.decode("utf-8")
    except UnicodeDecodeError:s=raw.decode("latin-1",errors="replace")
    p=Parser(meta["finalUrl"]);p.feed(s)
    blocks=[]
    for i,b in enumerate(p.blocks,1):
        txt=b["text"]
        blocks.append({"index":i,"text":txt,"anchors":b["anchors"],"positiveWitnessMatch":bool(WITNESS_RE.search(txt)),"targetMatch":bool(TARGET_RE.search(txt))})
    return {**meta,"resultBlockCount":len(blocks),"positiveWitnessBlockCount":sum(1 for b in blocks if b["positiveWitnessMatch"]),"targetBlockCount":sum(1 for b in blocks if b["targetMatch"]),"blocks":blocks[:100]}

def main():
    pos=query(POSITIVE);neg=query(NEGATIVE);target=query(TARGET)
    reachable=all(x.get("status")=="OK" for x in (pos,neg,target))
    positive_found=int(pos.get("positiveWitnessBlockCount") or 0)>0
    negative_zero=int(neg.get("resultBlockCount") or 0)==0
    target_found=int(target.get("targetBlockCount") or 0)>0

    if positive_found and negative_zero:
        semantics="VALIDATED_FILTERING"
    elif positive_found and not negative_zero:
        semantics="POSITIVE_WORKS_NEGATIVE_RETURNS_RESULTS"
    elif not positive_found and negative_zero:
        semantics="POSITIVE_WITNESS_NOT_RECOVERED"
    else:
        semantics="SEARCH_FILTER_SEMANTICS_NOT_VALIDATED"

    target_interpretation=(
        "TARGET_RESULT_FOUND"
        if target_found
        else "TARGET_NOT_FOUND_BUT_NEGATIVE_EVIDENCE_USABLE" if semantics=="VALIDATED_FILTERING"
        else "TARGET_NOT_FOUND_BUT_SEARCH_NEGATIVE_EVIDENCE_UNRELIABLE"
    )
    evidence={
      "schemaVersion":"BCEAO_SEARCH_SEMANTICS_VALIDATION_V0_1",
      "sourceId":"DECISION_CM_10_06_2022",
      "method":"BCEAO_NATIVE_SEARCH_POSITIVE_NEGATIVE_WITNESS_TEST",
      "result":"PASS" if reachable else "INCOMPLETE",
      "positiveWitness":POSITIVE,"negativeSentinel":NEGATIVE,"targetQuery":TARGET,
      "positive":pos,"negative":neg,"target":target,
      "positiveWitnessRecovered":positive_found,
      "negativeSentinelReturnedZeroBlocks":negative_zero,
      "searchSemantics":semantics,
      "targetInterpretation":target_interpretation,
      "boundary":{
        "exactlyThreeQueries":True,"resultLinksFollowed":False,"binaryMaterialized":False,
        "workflowRepositoryWriteAllowed":False,"automaticRelationshipInferenceAllowed":False,
        "automaticSanctionActivationAllowed":False,"readyForSubmissionMustRemainFalse":True
      },
      "nextAction":"Use BCEAO target absence as negative evidence only if searchSemantics is VALIDATED_FILTERING."
    }
    validation={
      "schemaVersion":"BCEAO_SEARCH_SEMANTICS_VALIDATION_CHECK_V0_1",
      "result":evidence["result"],
      "checks":{
        "exactlyThreeQueries":True,"positiveWitnessTested":True,"negativeSentinelTested":True,
        "resultLinksNotFollowed":True,"binaryNotMaterialized":True,"workflowRepositoryWriteDisabled":True,
        "automaticRelationshipInferenceForbidden":True,"automaticSanctionActivationForbidden":True,"readyForSubmissionFalse":True
      },
      "searchSemantics":semantics,"targetInterpretation":target_interpretation
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":evidence["result"],"positiveWitnessRecovered":positive_found,"negativeZero":negative_zero,"searchSemantics":semantics,"targetInterpretation":target_interpretation},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
