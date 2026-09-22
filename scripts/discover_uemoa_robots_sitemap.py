#!/usr/bin/env python3
"""Discover UEMOA E-DOCUCENTER robots/sitemap surfaces.

Fetch robots.txt, then only sitemap URLs explicitly declared there (max 5).
If a sitemap index is returned, list child sitemap URLs but do not fetch them yet.
No linked document or PDF is downloaded.
"""

from __future__ import annotations
import gzip, hashlib, json, re
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_ROBOTS_SITEMAP_DISCOVERY_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_ROBOTS_SITEMAP_DISCOVERY_VALIDATION_V0_1.json"
ROBOTS="https://e-docucenter.uemoa.int/robots.txt"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"
TARGET_HINT=re.compile(r"(cm[-_/ ]?10[-_/ ]?06[-_/ ]?2022|sanction|decision|d[ée]cision|2022)",re.I)

def allowed_host(url):
    h=(urlparse(url).hostname or "").lower()
    return h in {"e-docucenter.uemoa.int","www.e-docucenter.uemoa.int"}

def fetch(url,max_bytes=8_000_000):
    req=Request(url,headers={"User-Agent":UA,"Accept":"text/plain,application/xml,text/xml,*/*"})
    try:
        with urlopen(req,timeout=25) as r:
            raw=r.read(max_bytes+1)
            if len(raw)>max_bytes:return {"status":"TOO_LARGE","url":url,"byteSizeAtLeast":len(raw)}
            return {"status":"OK","url":url,"finalUrl":r.geturl(),"contentType":r.headers.get("Content-Type"),
                    "contentEncoding":r.headers.get("Content-Encoding"),"byteSize":len(raw),
                    "sha256":hashlib.sha256(raw).hexdigest(),"raw":raw,"tlsVerified":True}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","url":url,"error":str(exc),"tlsVerified":False}

def decode_bytes(raw,url,content_encoding):
    if url.lower().endswith(".gz") or (content_encoding or "").lower()=="gzip":
        try:return gzip.decompress(raw)
        except OSError:return raw
    return raw

def parse_xml(raw):
    try:
        root=ET.fromstring(raw)
    except ET.ParseError:
        return {"xml":False,"rootTag":None,"locs":[]}
    tag=root.tag.split("}")[-1].lower()
    locs=[]
    for e in root.iter():
        if e.tag.split("}")[-1].lower()=="loc" and e.text:
            locs.append(e.text.strip())
    return {"xml":True,"rootTag":tag,"locs":locs}

def main():
    robots=fetch(ROBOTS,2_000_000)
    declared=[]
    if robots.get("status")=="OK":
        txt=robots["raw"].decode("utf-8",errors="replace")
        for line in txt.splitlines():
            if line.lower().startswith("sitemap:"):
                u=line.split(":",1)[1].strip()
                if u and u not in declared:declared.append(u)
    declared=declared[:5]

    inspected=[]
    child_sitemaps=[]
    candidate_urls=[]
    for u in declared:
        if not allowed_host(u):
            inspected.append({"url":u,"status":"SKIPPED_NON_UEMOA_HOST"});continue
        f=fetch(u);raw=f.pop("raw",None)
        item={**f}
        if f.get("status")=="OK" and isinstance(raw,bytes):
            decoded=decode_bytes(raw,u,f.get("contentEncoding"))
            px=parse_xml(decoded)
            item["xml"]=px["xml"];item["rootTag"]=px["rootTag"];item["locCount"]=len(px["locs"])
            if px["rootTag"]=="sitemapindex":
                child_sitemaps.extend(x for x in px["locs"] if allowed_host(x))
            else:
                candidate_urls.extend(x for x in px["locs"] if allowed_host(x) and TARGET_HINT.search(x))
            item["candidateUrls"]=[x for x in px["locs"] if TARGET_HINT.search(x)][:100]
        inspected.append(item)

    child_sitemaps=sorted(set(child_sitemaps))
    candidate_urls=sorted(set(candidate_urls))
    if candidate_urls:
        status="TARGET_HINT_URLS_FOUND_IN_DECLARED_SITEMAP"
    elif child_sitemaps:
        status="SITEMAP_INDEX_FOUND_CHILDREN_NOT_FETCHED"
    elif declared:
        status="DECLARED_SITEMAP_INSPECTED_NO_TARGET_HINT"
    else:
        status="NO_SITEMAP_DECLARED_IN_ROBOTS"

    evidence={
        "schemaVersion":"UEMOA_ROBOTS_SITEMAP_DISCOVERY_V0_1",
        "sourceId":"DECISION_CM_10_06_2022","method":"ROBOTS_DECLARED_SITEMAP_DISCOVERY",
        "result":"PASS" if robots.get("status")=="OK" else "INCOMPLETE",
        "robots":{k:v for k,v in robots.items() if k!="raw"},
        "declaredSitemaps":declared,
        "inspectedSitemaps":inspected,
        "childSitemaps":child_sitemaps,
        "candidateUrls":candidate_urls,
        "targetStatus":status,
        "boundary":{
            "robotsOnlyEntryPoint":True,"declaredSitemapsOnly":True,"maxDeclaredSitemapsFive":True,
            "childSitemapsFetched":False,"linkedDocumentsFetched":False,"binaryMaterialized":False,
            "automaticRelationshipInferenceAllowed":False,"automaticSanctionActivationAllowed":False,
            "readyForSubmissionMustRemainFalse":True
        },
        "nextAction":"If a sitemap index exposes child sitemaps, select and inspect them in a separate bounded step; do not bulk crawl."
    }
    validation={
        "schemaVersion":"UEMOA_ROBOTS_SITEMAP_DISCOVERY_VALIDATION_V0_1","result":evidence["result"],
        "checks":{
            "robotsOnlyEntryPoint":True,"declaredSitemapsOnly":True,"maxDeclaredSitemapsFive":len(declared)<=5,
            "childSitemapsNotFetched":True,"linkedDocumentsNotFetched":True,"binaryNotMaterialized":True,
            "automaticRelationshipInferenceForbidden":True,"automaticSanctionActivationForbidden":True,
            "readyForSubmissionFalse":True
        },"targetStatus":status,"declaredSitemapCount":len(declared),"childSitemapCount":len(child_sitemaps),
        "candidateUrlCount":len(candidate_urls)
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":evidence["result"],"targetStatus":status,"declared":len(declared),"children":len(child_sitemaps),"candidates":len(candidate_urls)},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
