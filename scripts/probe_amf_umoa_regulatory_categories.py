#!/usr/bin/env python3
import json,re,hashlib
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'regulatory/registries/AMF_UMOA_REGULATORY_CATEGORY_API_REGISTRY_V0_1.json'
VAL=ROOT/'regulatory/validation/AMF_UMOA_REGULATORY_CATEGORY_API_VALIDATION_V0_1.json'
API='https://www.amf-umoa.org/service/api/elastic/actualite'
UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'

def request(params):
    p=dict(params);p.setdefault('langue','fr');url=API+'?'+urlencode(p)
    req=Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
    with urlopen(req,timeout=45) as r:
        raw=r.read();headers=dict(r.headers.items())
    data=json.loads(raw.decode('utf-8'))
    if not isinstance(data,list):raise RuntimeError(f'Expected list for {url}, got {type(data)}')
    return url,raw,headers,data

def compact(o):
    keep={}
    for k,v in o.items():
        if k=='doc':
            keep['docPresent']=isinstance(v,str) and len(v)>20
            if keep['docPresent']:keep['docPrefix']=v[:12]
            continue
        if isinstance(v,(str,int,float,bool)) or v is None:
            keep[k]=v
        elif isinstance(v,list) and all(isinstance(x,(str,int,float,bool,type(None))) for x in v):
            keep[k]=v
    return keep

def fetch_category(category,abroge=None):
    params={'size':500,'page':0,'categorie':category}
    if abroge is not None:params['abroge']='true' if abroge else 'false'
    url,raw,headers,data=request(params)
    return {'requestUrl':url,'rawSha256':hashlib.sha256(raw).hexdigest(),'responseHeaders':{k:v for k,v in headers.items() if k.lower() in ['x-total-count','content-range','content-type']},'count':len(data),'items':[compact(x) for x in data]}

def norm(s):return re.sub(r'\s+',' ',str(s or '')).strip()
def item_text(x):return ' '.join(norm(x.get(k)) for k in ['titre','resume','texte','categorie','tags'])
def matches(items,patterns):
    out=[]
    for x in items:
        txt=item_text(x)
        if any(re.search(p,txt,re.I) for p in patterns):out.append(x)
    return out

def main():
    circ=fetch_category('Circulaire')
    witness010=any(re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*10\s*[-/]\s*2022',item_text(x),re.I) for x in circ['items'])
    witness013=any(re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*13\s*[-/]\s*2022',item_text(x),re.I) for x in circ['items'])
    if not (witness010 and witness013):
        VAL.parent.mkdir(parents=True,exist_ok=True)
        VAL.write_text(json.dumps({'schemaVersion':'AMF_UMOA_REGULATORY_CATEGORY_API_VALIDATION_V0_1','result':'FAIL','reason':'CIRCULAR_CATEGORY_WITNESS_FAILED','circulaireCount':circ['count'],'witness010':witness010,'witness013':witness013},ensure_ascii=False,indent=2)+'\n')
        raise SystemExit(2)
    inst=fetch_category('Instruction')
    inst_ab=fetch_category('Instruction',True)
    dec=fetch_category('Decision')
    dec_ab=fetch_category('Decision',True)
    findings={
      'instruction61_2020':matches(inst['items']+inst_ab['items'],[r'61\s*/\s*(?:CREPMF\s*/\s*)?2020',r'INSTRUCTION.{0,30}61.{0,30}2020']),
      'instruction64_2020':matches(inst['items']+inst_ab['items'],[r'64\s*/\s*(?:CREPMF\s*/\s*)?2020',r'INSTRUCTION.{0,30}64.{0,30}2020']),
      'sanctions_2016':matches(dec['items']+dec_ab['items'],[r'SANCTION',r'PECUNIA',r'PÉCUNIA']).copy(),
      'decision_2022':matches(dec['items']+dec_ab['items'],[r'2022',r'CM\s*/\s*10\s*/\s*06\s*/\s*2022']),
    }
    # De-duplicate findings by id/titre while preserving all evidence objects.
    for key,vals in findings.items():
        uniq={}
        for x in vals:uniq[(x.get('id'),x.get('titre'))]=x
        findings[key]=list(uniq.values())
    out={'schemaVersion':'AMF_UMOA_REGULATORY_CATEGORY_API_REGISTRY_V0_1','authority':'AMF-UMOA','sourceApi':API,'method':'OFFICIAL_FRONTEND_LIST_API_WITNESS_VALIDATED','witness':{'circulaire010Present':witness010,'circulaire013Present':witness013,'circulaireListCount':circ['count']},'categories':{'Instruction':inst,'Instruction_abroge_true':inst_ab,'Decision':dec,'Decision_abroge_true':dec_ab},'targetFindings':findings,'boundary':{'listMetadataIsLegalStatusProof':False,'abrogeFieldIsPortalMetadata':True,'docPresenceIsBinaryIdentityProof':False,'automaticRuleActivationAllowed':False,'automaticDependencyResolutionAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True,'readyForSubmissionMustRemainFalse':True}}
    val={'schemaVersion':'AMF_UMOA_REGULATORY_CATEGORY_API_VALIDATION_V0_1','result':'PASS','checks':{'circularWitness010':witness010,'circularWitness013':witness013,'instructionListReturned':isinstance(inst['items'],list),'decisionListReturned':isinstance(dec['items'],list),'automaticResolutionForbidden':True},'counts':{'Circulaire':circ['count'],'Instruction':inst['count'],'Instruction_abroge_true':inst_ab['count'],'Decision':dec['count'],'Decision_abroge_true':dec_ab['count']},'findingCounts':{k:len(v) for k,v in findings.items()}}
    OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'counts':val['counts'],'findings':val['findingCounts']},ensure_ascii=False))
if __name__=='__main__':main()
