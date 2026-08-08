#!/usr/bin/env python3
import concurrent.futures, hashlib, html, json, re, shutil, subprocess
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'regulatory/registries/AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_V0_1.json'
VAL=ROOT/'regulatory/validation/AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_VALIDATION_V0_1.json'
BIN=ROOT/'regulatory/sources/amf-umoa-2022-circulars'
BASE='https://www.crepmf.org'
IDS=range(1000129,1000145)
UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'
ALLOWED={'crepmf.org','www.crepmf.org','amf-umoa.org','www.amf-umoa.org'}

def fetch(url,timeout=18):
    with urlopen(Request(url,headers={'User-Agent':UA,'Accept':'text/html,application/pdf,*/*'}),timeout=timeout) as r:return r.read()
def render(url):
    c=shutil.which('google-chrome') or shutil.which('google-chrome-stable') or shutil.which('chromium')
    if not c:return None
    try:
        p=subprocess.run([c,'--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--virtual-time-budget=8000','--dump-dom',url],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=18,check=True)
        return p.stdout
    except Exception:return None
def strip(raw):
    raw=re.sub(r'(?is)<script.*?</script>|<style.*?</style>',' ',raw);raw=re.sub(r'(?s)<[^>]+>',' ',raw)
    return re.sub(r'\s+',' ',html.unescape(raw)).strip()
def links(raw,base):
    out=[]
    for m in re.finditer(r'href\s*=\s*["\']([^"\']+)["\']',raw,re.I):
        u=urljoin(base,html.unescape(m.group(1)))
        if urlparse(u).hostname in ALLOWED:out.append(u)
    return list(dict.fromkeys(out))
def parse(raw,url,mode,page_hash=None):
    text=strip(raw);m=re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,2})\s*[-/]\s*2022',text,re.I)
    if not m:return None
    n=int(m.group(1))
    if not 1<=n<=16:return None
    tail=text[m.end():m.end()+1600]
    tail=re.split(r'\b(?:\d{1,2}\s+(?:janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+2023|Catégories|Contacts)\b',tail,1,flags=re.I)[0]
    title=re.sub(r'\s+',' ',tail).strip(' -–—:;.')
    pdfc=[];binary=None
    for u in links(raw,url):
        if '.pdf' not in u.lower():continue
        pdfc.append(u)
        try:pb=fetch(u,25)
        except Exception:continue
        if pb.startswith(b'%PDF'):
            BIN.mkdir(parents=True,exist_ok=True);p=BIN/f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022.pdf';p.write_bytes(pb)
            binary={'url':u,'sha256':hashlib.sha256(pb).hexdigest(),'byteSize':len(pb),'repositoryCopy':str(p.relative_to(ROOT))};break
    return {'url':url,'status':'OFFICIAL_PAGE_IDENTIFIED','renderMode':mode,'number':n,'reference':f'Circulaire n°{n:02d}/AMF-UMOA/2022','titleFromOfficialPage':title,'pageSha256':page_hash or hashlib.sha256(raw.encode()).hexdigest(),'pdfCandidates':pdfc,'materializedBinary':binary}
def scan(i):
    url=f'{BASE}/actuality-details?actualiteId={i}';http_raw='';http_hash=None
    try:
        b=fetch(url);http_raw=b.decode('utf-8',errors='ignore');http_hash=hashlib.sha256(b).hexdigest();r=parse(http_raw,url,'HTTP',http_hash)
        if r:return r
    except Exception:pass
    dom=render(url)
    if dom:
        r=parse(dom,url,'HEADLESS_CHROME',hashlib.sha256(dom.encode()).hexdigest())
        if r:return r
    return {'url':url,'status':'NO_VALIDATED_2022_CIRCULAR','httpSha256':http_hash,'chromeRendered':bool(dom)}
def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=list(ex.map(scan,IDS))
    entries=sorted([r for r in results if r.get('status')=='OFFICIAL_PAGE_IDENTIFIED'],key=lambda x:x['number'])
    by={}
    for r in entries:
        if r['number'] not in by:by[r['number']]=r
    entries=[by[n] for n in sorted(by)];nums=[x['number'] for x in entries];missing=[n for n in range(1,17) if n not in nums]
    reg={'schemaVersion':'AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_V0_1','authority':'AMF-UMOA','method':'BOUNDED_RENDERED_OFFICIAL_ACTUALITY_PAGE_SCAN_CONTENT_VALIDATED','scanIdRange':[min(IDS),max(IDS)],'status':'COMPLETE_01_TO_16' if not missing else 'PARTIAL_OFFICIAL_PAGE_DISCOVERY','discoveredCount':len(entries),'missingNumbers':missing,'entries':entries,'diagnostics':[r for r in results if r.get('status')!='OFFICIAL_PAGE_IDENTIFIED'],'boundary':{'pageIdImpliesRegulatoryNumber':False,'contentRegexRequired':True,'officialPageIsIndividualBinary':False,'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True}}
    val={'schemaVersion':'AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_VALIDATION_V0_1','result':'PASS' if 10 in nums and 13 in nums else 'FAIL','checks':{'knownCircular010Recovered':10 in nums,'knownCircular013Recovered':13 in nums,'allEntriesContentValidated':all(x['status']=='OFFICIAL_PAGE_IDENTIFIED' for x in entries),'coverageComplete01To16':not missing,'automaticResolutionForbidden':True},'discoveredCount':len(entries),'missingNumbers':missing}
    OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'discovered':nums,'missing':missing,'materialized':[x['number'] for x in entries if x.get('materializedBinary')]},ensure_ascii=False))
    if val['result']!='PASS':raise SystemExit(2)
if __name__=='__main__':main()
