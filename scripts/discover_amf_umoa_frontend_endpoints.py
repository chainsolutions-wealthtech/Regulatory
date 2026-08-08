#!/usr/bin/env python3
import json,re,html
from pathlib import Path
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'regulatory/diagnostics/AMF_UMOA_FRONTEND_ENDPOINT_DISCOVERY_2026-08-08.json'
START=['https://www.amf-umoa.org/actuality-details?actualiteId=1000138','https://www.amf-umoa.org/publication/rapport']
UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'
ALLOWED={'www.amf-umoa.org','amf-umoa.org'}
def fetch(u):
    with urlopen(Request(u,headers={'User-Agent':UA}),timeout=25) as r:return r.read()
def scripts(raw,base):
    out=[]
    for m in re.finditer(r'<script[^>]+src=["\']([^"\']+)["\']',raw,re.I):
        u=urljoin(base,html.unescape(m.group(1)))
        if urlparse(u).hostname in ALLOWED:out.append(u)
    return list(dict.fromkeys(out))
def snippets(s):
    hits=[];lower=s.lower()
    for key in ['actualiteid','actuality-details','actualite','publication/rapport','api/','environment','baseurl']:
        pos=0
        while True:
            i=lower.find(key,pos)
            if i<0:break
            hits.append(s[max(0,i-300):min(len(s),i+650)])
            pos=i+len(key)
            if len(hits)>=300:return hits
    return hits
def main():
    pages=[];js=[];allhits=[]
    for u in START:
        try:
            b=fetch(u);raw=b.decode('utf-8',errors='ignore');pages.append({'url':u,'bytes':len(b),'scripts':scripts(raw,u)})
        except Exception as e:pages.append({'url':u,'error':str(e)});continue
    seen=set()
    for p in pages:
        for u in p.get('scripts',[]):
            if u in seen:continue
            seen.add(u)
            try:
                b=fetch(u);txt=b.decode('utf-8',errors='ignore');hits=snippets(txt);js.append({'url':u,'bytes':len(b),'hitCount':len(hits)});allhits.extend([{'script':u,'snippet':x} for x in hits])
            except Exception as e:js.append({'url':u,'error':str(e)})
    candidates=set()
    for h in allhits:
        s=h['snippet']
        for m in re.findall(r'https?://[^"\'<>\s]+',s):candidates.add(m.rstrip('),;'))
        for m in re.findall(r'["\'](/[^"\']*(?:actual|api|publication)[^"\']*)["\']',s,re.I):candidates.add(m)
    data={'schemaVersion':'AMF_UMOA_FRONTEND_ENDPOINT_DISCOVERY_V0_3','sourcePages':pages,'javascriptBundles':js,'candidateEndpoints':sorted(candidates),'relevantSnippets':allhits[:300],'boundary':{'diagnosticOnly':True,'endpointCandidateIsRegulatoryEvidence':False,'tlsVerificationDisabled':False}}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'bundles':len(js),'hits':len(allhits),'candidateEndpoints':len(candidates)},ensure_ascii=False))
if __name__=='__main__':main()
