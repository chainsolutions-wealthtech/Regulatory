#!/usr/bin/env python3
import json, hashlib, re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
ROOT=Path(__file__).resolve().parents[1]
SEED=ROOT/'regulatory/registries/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1.json'
OUT=ROOT/'regulatory/registries/AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_V0_1.json'
VAL=ROOT/'regulatory/validation/AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_VALIDATION_V0_1.json'
API='https://www.amf-umoa.org/service/api/elastic/actualite'; UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'
def fetch(aid):
 u=API+'?'+urlencode({'id':aid,'langue':'fr'})
 with urlopen(Request(u,headers={'User-Agent':UA,'Accept':'application/json'}),timeout=30) as r:b=r.read()
 d=json.loads(b.decode())
 if not isinstance(d,list) or len(d)!=1 or not isinstance(d[0],dict):raise RuntimeError(f'bad payload {aid}')
 return u,b,d[0]
def compact_value(v):
 if isinstance(v,str):return re.sub(r'\s+',' ',v).strip()
 if isinstance(v,(int,float,bool)) or v is None:return v
 if isinstance(v,list):
  vals=[]
  for x in v:
   if isinstance(x,(str,int,float,bool)) or x is None:vals.append(compact_value(x))
   elif isinstance(x,dict):vals.append({k:compact_value(y) for k,y in x.items() if k!='doc' and isinstance(y,(str,int,float,bool,type(None)))})
  return vals
 return None
def main():
 seed=json.loads(SEED.read_text())
 if seed['status']!='COMPLETE_01_TO_16':raise RuntimeError('seed incomplete')
 entries=[]; failures=[]
 for e in seed['entries']:
  n=e['number'];aid=e['actualiteId']
  try:
   u,b,o=fetch(aid); title=str(o.get('titre') or '')
   m=re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,2})\s*[-/]\s*2022',title,re.I)
   if not m or int(m.group(1))!=n:raise RuntimeError(f'title mismatch: {title}')
   fields={}
   for k,v in o.items():
    if k=='doc':continue
    cv=compact_value(v)
    if cv not in (None,'',[],{}):fields[k]=cv
   entries.append({'number':n,'reference':f'Circulaire n°{n:02d}/AMF-UMOA/2022','actualiteId':aid,'apiUrl':u,'apiRawSha256':hashlib.sha256(b).hexdigest(),'fields':fields})
  except Exception as ex:failures.append({'number':n,'actualiteId':aid,'error':str(ex)})
 out={'schemaVersion':'AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_V0_1','authority':'AMF-UMOA','sourceApi':API,'status':'COMPLETE_16_METADATA_OBJECTS' if len(entries)==16 and not failures else 'INCOMPLETE','entryCount':len(entries),'failures':failures,'entries':entries,'boundary':{'metadataIsNormativeContent':False,'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True}}
 val={'schemaVersion':'AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_VALIDATION_V0_1','result':'PASS' if out['status']=='COMPLETE_16_METADATA_OBJECTS' else 'FAIL','checks':{'exactly16':len(entries)==16,'numbers01To16':[x['number'] for x in entries]==list(range(1,17)),'noDocBase64Stored':all('doc' not in x['fields'] for x in entries),'automaticResolutionForbidden':True},'failures':failures}
 OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':out['status'],'count':len(entries),'failures':failures},ensure_ascii=False))
 if val['result']!='PASS':raise SystemExit(2)
if __name__=='__main__':main()
