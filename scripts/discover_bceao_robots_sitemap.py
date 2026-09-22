#!/usr/bin/env python3
"""Discover BCEAO robots-declared sitemap surfaces.

Read-only:
- fetch https://www.bceao.int/robots.txt;
- inspect only sitemap URLs explicitly declared there (max 5);
- if a sitemap index is returned, list child sitemap URLs but do not fetch them;
- do not fetch linked documents or PDFs;
- write local evidence for workflow logs/artifact only.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/BCEAO_ROBOTS_SITEMAP_DISCOVERY_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/BCEAO_ROBOTS_SITEMAP_DISCOVERY_VALIDATION_V0_1.json"
ROBOTS="https://www.bceao.int/robots.txt"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"
TARGET_HINT=re.compile(r"(cm[-_/ ]?10[-_/ ]?06[-_/ ]?2022|sanction|decision|d[ée]cision|2022)",re.I)

def allowed_host(url):
    host=(urlparse(url).hostname or "").lower()
    return host=="bceao.int" or host.endswith(".bceao.int")

def fetch(url,max_bytes=10_000_000):
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/plain,application/xml,text/xml,*/*"})
    try:
        with urlopen(req,timeout=25) as response:
            raw=response.read(max_bytes+1)
            if len(raw)>max_bytes:
                return {"status":"TOO_LARGE","url":url,"byteSizeAtLeast":len(raw)}
            return {
                "status":"OK","url":url,"finalUrl":response.geturl(),
                "contentType":response.headers.get("Content-Type"),
                "contentEncoding":response.headers.get("Content-Encoding"),
                "byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),
                "tlsVerified":True,"raw":raw,
            }
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","url":url,"error":str(exc),"tlsVerified":False}

def decode(raw,url,encoding):
    if url.lower().endswith(".gz") or (encoding or "").lower()=="gzip":
        try:return gzip.decompress(raw)
        except OSError:return raw
    return raw

def parse_xml(raw):
    try:root=ET.fromstring(raw)
    except ET.ParseError:return {"xml":False,"rootTag":None,"locs":[]}
    tag=root.tag.split("}")[-1].lower()
    locs=[e.text.strip() for e in root.iter() if e.tag.split("}")[-1].lower()=="loc" and e.text]
    return {"xml":True,"rootTag":tag,"locs":locs}

def main():
    robots=fetch(ROBOTS,2_000_000)
    declared=[]
    robots_text=None
    if robots.get("status")=="OK":
        robots_text=robots["raw"].decode("utf-8",errors="replace")
        for line in robots_text.splitlines():
            if line.lower().startswith("sitemap:"):
                url=line.split(":",1)[1].strip()
                if url and url not in declared:declared.append(url)
    declared=declared[:5]

    inspected=[];children=[];candidates=[]
    for url in declared:
        if not allowed_host(url):
            inspected.append({"url":url,"status":"SKIPPED_NON_BCEAO_HOST"});continue
        result=fetch(url);raw=result.pop("raw",None);item={**result}
        if result.get("status")=="OK" and isinstance(raw,bytes):
            parsed=parse_xml(decode(raw,url,result.get("contentEncoding")))
            item["xml"]=parsed["xml"];item["rootTag"]=parsed["rootTag"];item["locCount"]=len(parsed["locs"])
            item["candidateUrls"]=[u for u in parsed["locs"] if TARGET_HINT.search(u)][:200]
            if parsed["rootTag"]=="sitemapindex":
                children.extend(u for u in parsed["locs"] if allowed_host(u))
            else:
                candidates.extend(u for u in parsed["locs"] if allowed_host(u) and TARGET_HINT.search(u))
        inspected.append(item)

    children=sorted(set(children));candidates=sorted(set(candidates))
    if candidates:status="TARGET_HINT_URLS_FOUND_IN_DECLARED_SITEMAP"
    elif children:status="SITEMAP_INDEX_FOUND_CHILDREN_NOT_FETCHED"
    elif declared:status="DECLARED_SITEMAP_INSPECTED_NO_TARGET_HINT"
    else:status="NO_SITEMAP_DECLARED_IN_ROBOTS"

    evidence={
        "schemaVersion":"BCEAO_ROBOTS_SITEMAP_DISCOVERY_V0_1",
        "sourceId":"DECISION_CM_10_06_2022","method":"BCEAO_ROBOTS_DECLARED_SITEMAP_DISCOVERY",
        "result":"PASS" if robots.get("status")=="OK" else "INCOMPLETE",
        "robots":{k:v for k,v in robots.items() if k!="raw"},
        "robotsText":robots_text,
        "declaredSitemaps":declared,"inspectedSitemaps":inspected,
        "childSitemaps":children,"candidateUrls":candidates,"targetStatus":status,
        "boundary":{
            "robotsOnlyEntryPoint":True,"declaredSitemapsOnly":True,"maxDeclaredSitemapsFive":True,
            "childSitemapsFetched":False,"linkedDocumentsFetched":False,"binaryMaterialized":False,
            "workflowRepositoryWriteAllowed":False,"automaticRelationshipInferenceAllowed":False,
            "automaticSanctionActivationAllowed":False,"readyForSubmissionMustRemainFalse":True
        },
        "nextAction":"If robots declares a sitemap index, inspect only its declared children in a later bounded read-only step."
    }
    validation={
        "schemaVersion":"BCEAO_ROBOTS_SITEMAP_DISCOVERY_VALIDATION_V0_1",
        "result":evidence["result"],
        "checks":{
            "robotsOnlyEntryPoint":True,"declaredSitemapsOnly":True,"maxDeclaredSitemapsFive":len(declared)<=5,
            "childSitemapsNotFetched":True,"linkedDocumentsNotFetched":True,"binaryNotMaterialized":True,
            "workflowRepositoryWriteDisabled":True,"automaticRelationshipInferenceForbidden":True,
            "automaticSanctionActivationForbidden":True,"readyForSubmissionFalse":True
        },
        "targetStatus":status,"declaredSitemapCount":len(declared),
        "childSitemapCount":len(children),"candidateUrlCount":len(candidates)
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":evidence["result"],"targetStatus":status,"declared":len(declared),"children":len(children),"candidates":len(candidates)},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
