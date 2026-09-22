#!/usr/bin/env python3
"""Extract Drupal Views configuration from the authoritative UEMOA download portal.

Discovery-only: fetch one known portal page, extract static view/AJAX configuration,
do not invoke AJAX, do not paginate, do not download documents.
"""

from __future__ import annotations
import hashlib, json, re
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"regulatory/review-evidence/SANCTIONS_2016_2022/UEMOA_DOWNLOAD_VIEW_CONFIG_2026-09-22.json"
VALIDATION=ROOT/"regulatory/validation/UEMOA_DOWNLOAD_VIEW_CONFIG_VALIDATION_V0_1.json"
URL="https://e-docucenter.uemoa.int/fr/telecharger-documents"
UA="Mozilla/5.0 RegulatoryCorpusBot/1.0"

class AttrParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.matches=[]
        self.inline_scripts=[]
        self._in_script=False
        self._script_src=None
        self._parts=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag.lower()=="script":
            self._in_script=True; self._script_src=d.get("src"); self._parts=[]
        interesting={}
        for k,v in d.items():
            sv="" if v is None else str(v)
            if "view" in k.lower() or "view" in sv.lower() or "ajax" in sv.lower():
                interesting[k]=v
        if interesting:
            self.matches.append({"tag":tag,"attributes":interesting})
    def handle_data(self,data):
        if self._in_script and self._script_src is None and data:self._parts.append(data)
    def handle_endtag(self,tag):
        if tag.lower()=="script" and self._in_script:
            if self._script_src is None:
                txt="".join(self._parts)
                if "view" in txt.lower() or "ajax" in txt.lower() or "drupalSettings" in txt:
                    self.inline_scripts.append(txt[:20000])
            self._in_script=False;self._script_src=None;self._parts=[]

def fetch():
    req=Request(URL,headers={"User-Agent":UA,"Accept":"text/html,*/*"})
    try:
        with urlopen(req,timeout=25) as r:
            raw=r.read(5_000_000)
            return {"status":"OK","finalUrl":r.geturl(),"contentType":r.headers.get("Content-Type"),
                    "byteSize":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"raw":raw,"tlsVerified":True}
    except (HTTPError,URLError,TimeoutError) as exc:
        return {"status":"FETCH_ERROR","error":str(exc),"tlsVerified":False}

def capture(source,pattern):
    out=[]
    for m in re.finditer(pattern,source,re.I):
        out.append(m.group(1) if m.groups() else m.group(0))
    return sorted(set(out))

def snippets(source,needle,window=700):
    out=[]
    low=source.lower();n=needle.lower();start=0
    while True:
        i=low.find(n,start)
        if i<0:break
        out.append(source[max(0,i-window):min(len(source),i+len(needle)+window)])
        start=i+len(n)
        if len(out)>=20:break
    return out

def main():
    result=fetch();raw=result.pop("raw",None)
    if result.get("status")!="OK" or not isinstance(raw,bytes):
        evidence={"schemaVersion":"UEMOA_DOWNLOAD_VIEW_CONFIG_V0_1","result":"INCOMPLETE","fetch":result}
        OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(evidence,indent=2)+"\n")
        raise SystemExit(2)
    try:source=raw.decode("utf-8")
    except UnicodeDecodeError:source=raw.decode("latin-1",errors="replace")
    p=AttrParser();p.feed(source)
    keys={
      "viewName":capture(source,r'["\']view_name["\']\s*[:=]\s*["\']([^"\']+)'),
      "viewDisplayId":capture(source,r'["\']view_display_id["\']\s*[:=]\s*["\']([^"\']+)'),
      "viewArgs":capture(source,r'["\']view_args["\']\s*[:=]\s*["\']([^"\']*)'),
      "viewPath":capture(source,r'["\']view_path["\']\s*[:=]\s*["\']([^"\']+)'),
      "viewDomId":capture(source,r'["\']view_dom_id["\']\s*[:=]\s*["\']([^"\']+)'),
      "pagerElement":capture(source,r'["\']pager_element["\']\s*[:=]\s*["\']?([^,"\'}\s]+)'),
      "ajaxUrls":capture(source,r'["\']([^"\']*(?:ajax_view|views/ajax|/ajax)[^"\']*)["\']'),
      "viewClassTokens":capture(source,r'class=["\'][^"\']*\b(view-[A-Za-z0-9_-]+)\b[^"\']*["\']'),
    }
    meaningful=any(keys[k] for k in ("viewName","viewDisplayId","viewDomId","ajaxUrls","viewClassTokens"))
    evidence={
      "schemaVersion":"UEMOA_DOWNLOAD_VIEW_CONFIG_V0_1",
      "sourceId":"DECISION_CM_10_06_2022","portalUrl":URL,
      "method":"AUTHORITATIVE_PORTAL_STATIC_DRUPAL_VIEW_CONFIG_EXTRACTION",
      "result":"PASS","fetch":result,
      "config":keys,
      "attributeMatches":p.matches[:200],
      "inlineViewScriptCount":len(p.inline_scripts),
      "ajaxViewSnippets":snippets(source,"ajax_view"),
      "drupalSettingsSnippets":snippets(source,"drupalSettings"),
      "viewsSnippets":snippets(source,"views"),
      "configurationSignalPresent":meaningful,
      "boundary":{
        "singleKnownPortalPageOnly":True,"verifiedTlsOnly":True,"ajaxInvoked":False,
        "paginationPerformed":False,"linkedDocumentsFetched":False,"binaryMaterialized":False,
        "automaticRelationshipInferenceAllowed":False,"automaticSanctionActivationAllowed":False,
        "readyForSubmissionMustRemainFalse":True
      },
      "nextAction":"Use only configuration explicitly extracted here to design a later bounded AJAX/view query; do not guess parameters."
    }
    validation={
      "schemaVersion":"UEMOA_DOWNLOAD_VIEW_CONFIG_VALIDATION_V0_1","result":"PASS",
      "checks":{
        "singleKnownPortalPageOnly":True,"verifiedTlsOnly":True,"ajaxNotInvoked":True,
        "paginationNotPerformed":True,"linkedDocumentsNotFetched":True,"binaryNotMaterialized":True,
        "automaticRelationshipInferenceForbidden":True,"automaticSanctionActivationForbidden":True,
        "readyForSubmissionFalse":True
      },
      "configurationSignalPresent":meaningful
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"result":"PASS","configurationSignalPresent":meaningful,"config":keys},ensure_ascii=False))

if __name__=="__main__":main()
