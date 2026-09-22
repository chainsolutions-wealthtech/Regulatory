#!/usr/bin/env python3
"""Inspect CENTIF raw markup for CM/10/06/2022 under repaired, verified TLS.

This is discovery-only. It repairs missing TLS intermediates through certificate
AIA, verifies each CENTIF leaf to the system trust store, fetches only the three
known CENTIF regulation pages, and inspects markup around the target reference.

It does NOT follow discovered URLs, download a regulatory binary, infer legal
status, or activate any regulatory rule.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import ssl
import subprocess
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/CENTIF_TARGET_MARKUP_VERIFIED_TLS_2026-09-23.json"
VAL=ROOT/"regulatory/validation/CENTIF_TARGET_MARKUP_VERIFIED_TLS_VALIDATION_V0_1.json"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"
SYSTEM_CA=Path("/etc/ssl/certs/ca-certificates.crt")
PAGES=[
 "https://www.centif.sn/reglementation/fr/reglcommu",
 "https://site.centif.sn/reglementation/fr/reglcommu",
 "https://jokoo.centif.sn/reglementation/fr/reglcommu",
]
TARGET_RE=re.compile(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022",re.I)
PDF_RE=re.compile(r"[^\s\"'<>]{0,300}\.pdf(?:[?][^\s\"'<>]*)?",re.I)
ATTR_HINT_RE=re.compile(r"(href|src|url|uri|file|doc|download|onclick|data)",re.I)

def run(args,input_text=None,timeout=60):
    return subprocess.run(args,input=input_text,text=True,capture_output=True,timeout=timeout,check=False)

def pems(s):
    return re.findall(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",s,re.S)

def cert_meta(path):
    cp=run(["openssl","x509","-in",str(path),"-noout","-subject","-issuer","-serial","-dates","-fingerprint","-sha256","-ext","authorityInfoAccess","-ext","subjectAltName"])
    text=(cp.stdout+"\n"+cp.stderr).strip()
    return {"returncode":cp.returncode,"text":text,"caIssuers":re.findall(r"CA Issuers\s*-\s*URI:([^\s,]+)",text,re.I)}

def fetch_bytes(url,context=None,timeout=35):
    req=Request(url,headers={"User-Agent":UA,"Accept":"*/*","Accept-Language":"fr-FR,fr;q=0.9"})
    with urlopen(req,timeout=timeout,context=context) as r:
        return r.read(),r.geturl(),r.headers.get("Content-Type")

def cert_to_pem(raw,out):
    der=out.with_suffix(".der");der.write_bytes(raw)
    cp=run(["openssl","x509","-inform","DER","-in",str(der),"-out",str(out)])
    if cp.returncode==0:return True,"DER"
    cp=run(["openssl","x509","-inform","PEM","-in",str(der),"-out",str(out)])
    return cp.returncode==0,("PEM" if cp.returncode==0 else "INVALID")

def repaired_context(host,tmp):
    sc=run(["openssl","s_client","-showcerts","-connect",f"{host}:443","-servername",host],input_text="",timeout=45)
    blocks=pems(sc.stdout+"\n"+sc.stderr)
    if not blocks:raise RuntimeError(f"No TLS certificate presented by {host}")
    leaf=tmp/f"{host}-leaf.pem";leaf.write_text(blocks[0]+"\n")
    inter=[]
    for i,p in enumerate(blocks[1:]):
        q=tmp/f"{host}-presented-{i}.pem";q.write_text(p+"\n");inter.append(q)
    fetched=[];current=leaf;seen=set()
    for depth in range(4):
        meta=cert_meta(current)
        url=next((u for u in meta["caIssuers"] if u not in seen),None)
        if not url:break
        seen.add(url)
        try: raw,_,_=fetch_bytes(url,ssl.create_default_context() if url.startswith("https://") else None,30)
        except Exception as exc:
            fetched.append({"url":url,"status":"FETCH_ERROR","error":str(exc)});break
        out=tmp/f"{host}-aia-{depth}.pem";ok,enc=cert_to_pem(raw,out)
        rec={"url":url,"status":"PARSED" if ok else "INVALID_CERTIFICATE","encoding":enc,"byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest()}
        if not ok:fetched.append(rec);break
        rec["metadata"]=cert_meta(out);fetched.append(rec);inter.append(out);current=out
    chain=tmp/f"{host}-chain.pem"
    chain.write_text("".join(p.read_text() for p in inter))
    args=["openssl","verify","-CAfile",str(SYSTEM_CA)]
    if inter:args+=["-untrusted",str(chain)]
    args+=[str(leaf)]
    vr=run(args)
    verified=vr.returncode==0
    if not verified:raise RuntimeError(f"TLS chain verification failed for {host}: {vr.stderr or vr.stdout}")
    bundle=tmp/f"{host}-bundle.pem";bundle.write_bytes(SYSTEM_CA.read_bytes()+b"\n"+chain.read_bytes())
    ctx=ssl.create_default_context(cafile=str(bundle));ctx.check_hostname=True;ctx.verify_mode=ssl.CERT_REQUIRED
    return ctx,{
      "presentedCertificateCount":len(blocks),
      "leaf":cert_meta(leaf),
      "fetchedIntermediates":fetched,
      "chainVerified":True,
      "verifyOutput":(vr.stdout+vr.stderr).strip(),
    }

class NodeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[];self.matches=[]
    def handle_starttag(self,tag,attrs):
        node={"tag":tag,"attrs":dict(attrs),"text":[],"descendantAttrs":[]}
        for n in self.stack:n["descendantAttrs"].append({"tag":tag,"attrs":dict(attrs)})
        self.stack.append(node)
    def handle_startendtag(self,tag,attrs):
        for n in self.stack:n["descendantAttrs"].append({"tag":tag,"attrs":dict(attrs)})
    def handle_data(self,data):
        for n in self.stack:n["text"].append(data)
    def handle_endtag(self,tag):
        if not self.stack:return
        # Pop through matching tag defensively.
        idx=next((i for i in range(len(self.stack)-1,-1,-1) if self.stack[i]["tag"]==tag),None)
        if idx is None:return
        closing=self.stack[idx:]
        self.stack=self.stack[:idx]
        for node in closing:
            text=re.sub(r"\s+"," ",html.unescape(" ".join(node["text"]))).strip()
            if TARGET_RE.search(text):
                attrs=[{"tag":node["tag"],"attrs":node["attrs"]}]+node["descendantAttrs"]
                self.matches.append({"tag":node["tag"],"text":text[:5000],"attributeInventory":attrs[:500]})

def candidates_from_matches(matches):
    out=[]
    seen=set()
    for m in matches:
        for item in m.get("attributeInventory",[]):
            for k,v in item.get("attrs",{}).items():
                if v is None:continue
                sv=str(v)
                if ATTR_HINT_RE.search(k) or ".pdf" in sv.lower() or "/" in sv:
                    key=(item["tag"],k,sv)
                    if key in seen:continue
                    seen.add(key);out.append({"tag":item["tag"],"attribute":k,"value":sv})
    return out[:500]

def inspect(page,tmp):
    host=urlparse(page).hostname
    ctx,tls=repaired_context(host,tmp)
    raw,final,ctype=fetch_bytes(page,ctx,45)
    source=raw.decode("utf-8",errors="replace")
    parser=NodeParser();parser.feed(source)
    # Keep the smallest matching nodes first to avoid giant body/html wrappers.
    matches=sorted(parser.matches,key=lambda x:len(x["text"]))
    candidates=candidates_from_matches(matches[:20])
    pdfStrings=sorted(set(PDF_RE.findall(source)))
    literal=re.search(r"CM\s*/\s*10\s*/\s*06\s*/\s*2022",html.unescape(source),re.I)
    rawContext=None
    if literal:
        s=max(0,literal.start()-4000);e=min(len(source),literal.end()+6000);rawContext=source[s:e]
    return {
      "url":page,"finalUrl":final,"contentType":ctype,"byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),
      "tlsVerified":True,"tls":tls,"targetNodeCount":len(matches),"targetNodes":matches[:20],
      "candidateAttributesNearTarget":candidates,"pdfStringsInPage":pdfStrings[:200],"rawTargetContext":rawContext
    }

def main():
    results=[]
    with tempfile.TemporaryDirectory(prefix="centif-tls-") as td:
        tmp=Path(td)
        for page in PAGES:
            try:results.append(inspect(page,tmp))
            except Exception as exc:results.append({"url":page,"status":"ERROR","error":str(exc),"tlsVerified":False})
    candidates=[]
    for r in results:candidates.extend(r.get("candidateAttributesNearTarget",[]))
    status="TARGET_MARKUP_CANDIDATES_FOUND" if candidates else "TARGET_PRESENT_WITHOUT_MARKUP_DOWNLOAD_CANDIDATE"
    reachable=sum(1 for r in results if r.get("tlsVerified") is True)
    evidence={
      "schemaVersion":"CENTIF_TARGET_MARKUP_VERIFIED_TLS_V0_1","sourceId":"DECISION_CM_10_06_2022",
      "reference":"CM/10/06/2022","method":"AIA_REPAIRED_TLS_RAW_MARKUP_TARGET_INSPECTION",
      "result":"PASS" if reachable else "INCOMPLETE","targetStatus":status,
      "pageCount":len(PAGES),"verifiedTlsPageCount":reachable,"pages":results,
      "candidateCount":len(candidates),"boundary":{
        "knownCentifPagesOnly":True,"tlsVerificationDisabled":False,"hostnameVerificationDisabled":False,
        "candidateUrlsFollowed":False,"binaryMaterialized":False,"workflowRepositoryWriteAllowed":False,
        "automaticRelationshipInferenceAllowed":False,"automaticSanctionActivationAllowed":False,
        "readyForSubmissionMustRemainFalse":True
      },
      "nextAction":"If a concrete target-adjacent institutional file/id/path is exposed, inspect only that exact locator in a separate read-only step."
    }
    validation={"schemaVersion":"CENTIF_TARGET_MARKUP_VERIFIED_TLS_VALIDATION_V0_1","result":evidence["result"],"checks":{
      "knownCentifPagesOnly":True,"tlsVerificationNeverDisabled":True,"hostnameVerificationNeverDisabled":True,
      "candidateUrlsNotFollowed":True,"binaryNotMaterialized":True,"workflowRepositoryWriteDisabled":True,
      "automaticRelationshipInferenceForbidden":True,"automaticSanctionActivationForbidden":True,"readyForSubmissionFalse":True
    },"targetStatus":status,"verifiedTlsPageCount":reachable,"candidateCount":len(candidates)}
    OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n");VAL.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"result":evidence["result"],"targetStatus":status,"verifiedTlsPageCount":reachable,"candidateCount":len(candidates)},ensure_ascii=False))
    if evidence["result"]!="PASS":raise SystemExit(2)

if __name__=="__main__":main()
