#!/usr/bin/env python3
import hashlib, html, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT_DIR=ROOT/'regulatory/sources/amf-umoa-2022-report'
REGISTRY=ROOT/'regulatory/registries/AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_V0_1.json'
VALIDATION=ROOT/'regulatory/validation/AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_VALIDATION_V0_1.json'
INDEX_URLS=['https://www.amf-umoa.org/publication/rapport','https://www.crepmf.org/publication/rapport']
ALLOWED={'amf-umoa.org','www.amf-umoa.org','crepmf.org','www.crepmf.org'}
UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'

def fetch(url, timeout=45):
    with urlopen(Request(url,headers={'User-Agent':UA,'Accept':'text/html,application/pdf,*/*'}),timeout=timeout) as r:return r.read()
def allowed(url): return urlparse(url).hostname in ALLOWED
def hrefs(raw,base):
    out=[]
    for m in re.finditer(r'href\s*=\s*["\']([^"\']+)["\']',raw,re.I):
        u=urljoin(base,html.unescape(m.group(1)).strip())
        if allowed(u): out.append((m.start(),u))
    return out
def render_dom(url):
    chrome=shutil.which('google-chrome') or shutil.which('google-chrome-stable') or shutil.which('chromium')
    if not chrome:return None
    try:
        p=subprocess.run([chrome,'--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--virtual-time-budget=10000','--dump-dom',url],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=30,check=True)
        return p.stdout
    except Exception:return None

def pdf_text(data):
    if not data.startswith(b'%PDF'): return ''
    with tempfile.NamedTemporaryFile(suffix='.pdf') as f:
        f.write(data);f.flush()
        p=subprocess.run(['pdftotext','-layout',f.name,'-'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,timeout=25)
        return p.stdout or ''
def is_report_2022(data):
    t=pdf_text(data).upper()
    return ('RAPPORT' in t and 'ANNUEL' in t and '2022' in t and ('AMF-UMOA' in t or 'AMF UMOA' in t or 'CREPMF' in t))

def candidate_links(raw,base):
    links=hrefs(raw,base); positions=[m.start() for m in re.finditer(r'RAPPORT\s+ANNUEL\s+2022',raw,re.I)]
    scored=[]
    for lp,u in links:
        score=0
        if '.pdf' in u.lower():score+=30
        if '2022' in u.lower():score+=20
        if 'rapport' in u.lower():score+=15
        if 'actuality-details' in u.lower():score+=10
        if positions:
            d=min(abs(lp-p) for p in positions)
            if d<15000:score+=max(1,80-d//200)
        if score:scored.append((score,u))
    best={}
    for score,u in scored:best[u]=max(score,best.get(u,0))
    return [u for u,_ in sorted(best.items(),key=lambda x:x[1],reverse=True)]

def inspect_candidate(url,attempts):
    try:data=fetch(url)
    except Exception as e:
        attempts.append({'url':url,'status':'FETCH_FAILED','error':str(e)});return None
    if data.startswith(b'%PDF'):
        ok=is_report_2022(data);attempts.append({'url':url,'status':'PDF_IDENTITY_PASS' if ok else 'PDF_IDENTITY_REJECTED','bytes':len(data)})
        return (url,data) if ok else None
    raw=data.decode('utf-8',errors='ignore'); variants=[raw]
    rendered=render_dom(url)
    if rendered:variants.append(rendered)
    seen=set()
    for v in variants:
        for _,u in hrefs(v,url):
            if u in seen or '.pdf' not in u.lower():continue
            seen.add(u)
            try:pb=fetch(u)
            except Exception as e:
                attempts.append({'url':u,'status':'NESTED_PDF_FETCH_FAILED','error':str(e)});continue
            ok=is_report_2022(pb);attempts.append({'url':u,'status':'PDF_IDENTITY_PASS' if ok else 'PDF_IDENTITY_REJECTED','bytes':len(pb)})
            if ok:return u,pb
    return None

def discover():
    attempts=[]
    for idx in INDEX_URLS:
        variants=[]
        try:
            b=fetch(idx);variants.append(b.decode('utf-8',errors='ignore'));attempts.append({'url':idx,'mode':'HTTP','status':'FETCHED','bytes':len(b)})
        except Exception as e:attempts.append({'url':idx,'mode':'HTTP','status':'FAILED','error':str(e)})
        r=render_dom(idx)
        if r:variants.append(r);attempts.append({'url':idx,'mode':'CHROME','status':'RENDERED','chars':len(r)})
        else:attempts.append({'url':idx,'mode':'CHROME','status':'FAILED'})
        candidates=[]
        for raw in variants:candidates.extend(candidate_links(raw,idx))
        for c in dict.fromkeys(candidates):
            hit=inspect_candidate(c,attempts)
            if hit:return hit[0],hit[1],idx,attempts
    raise RuntimeError('Official AMF-UMOA 2022 annual report PDF not identified after content verification')

def norm(s):return re.sub(r'\s+',' ',s.replace('\u00a0',' ')).strip(' ;.\n\t')
def extract_circulars(text):
    flat=norm(text)
    refpat=re.compile(r'Circulaire\s+n[°ºo]?\s*0?(\d{1,2})\s*/\s*(?:AMF[-\s]?UMOA|CREPMF)\s*/\s*2022',re.I)
    hits=list(refpat.finditer(flat));found={}
    for i,m in enumerate(hits):
        n=int(m.group(1))
        if not 1<=n<=16:continue
        end=hits[i+1].start() if i+1<len(hits) else min(len(flat),m.end()+1200)
        title=norm(flat[m.end():end])[:900]
        found[n]=title
    return found

def main():
    OUT_DIR.mkdir(parents=True,exist_ok=True);REGISTRY.parent.mkdir(parents=True,exist_ok=True);VALIDATION.parent.mkdir(parents=True,exist_ok=True)
    url,pdf,discovery,attempts=discover(); text=pdf_text(pdf); sha=hashlib.sha256(pdf).hexdigest()
    pdfp=OUT_DIR/'RAPPORT_ANNUEL_2022_AMF_UMOA.pdf';txtp=OUT_DIR/'RAPPORT_ANNUEL_2022_AMF_UMOA.txt';metap=OUT_DIR/'RAPPORT_ANNUEL_2022_AMF_UMOA.metadata.json'
    pdfp.write_bytes(pdf);txtp.write_text(text,encoding='utf-8')
    circs=extract_circulars(text);missing=[n for n in range(1,17) if n not in circs]
    entries=[{'number':n,'reference':f'Circulaire n°{n:02d}/AMF-UMOA/2022','titleContextFromOfficialAnnualReport':circs.get(n),'source':'RAPPORT_ANNUEL_2022_AMF_UMOA','individualBinaryStatus':'TO_MATERIALIZE_AND_COMPARE','automaticDependencyResolutionAllowed':False} for n in range(1,17)]
    reg={'schemaVersion':'AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_V0_1','authority':'AMF-UMOA','sourceDocument':'Rapport annuel 2022 AMF-UMOA','officialSourceUrl':url,'officialDiscoveryPage':discovery,'sourceSha256':sha,'sourceByteSize':len(pdf),'status':'OFFICIAL_ANNUAL_REPORT_REGISTRY_ONLY_INDIVIDUAL_BINARIES_PENDING','expectedCircularCount':16,'detectedCircularCount':len(circs),'missingCircularNumbers':missing,'entries':entries,'boundary':{'annualReportListingIsIndividualNormativeBinary':False,'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True,'readyForSubmissionMustRemainFalse':True}}
    val={'schemaVersion':'AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_VALIDATION_V0_1','result':'PASS' if not missing else 'FAIL','checks':{'pdfMagic':pdf.startswith(b'%PDF'),'officialHost':allowed(url),'annualReportIdentity':is_report_2022(pdf),'expected16Detected':len(circs)==16,'allNumbers01To16':not missing,'individualBinariesRemainPending':True,'automaticResolutionForbidden':True},'missingCircularNumbers':missing}
    REGISTRY.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n');VALIDATION.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n');metap.write_text(json.dumps({'officialSourceUrl':url,'officialDiscoveryPage':discovery,'sha256':sha,'byteSize':len(pdf),'discoveryAttempts':attempts},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pdfUrl':url,'sha256':sha,'detected':sorted(circs),'missing':missing},ensure_ascii=False))
    if missing:sys.exit(2)
if __name__=='__main__':main()
