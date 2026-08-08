#!/usr/bin/env python3
import base64, hashlib, json, re, subprocess
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'regulatory/sources/amf-umoa-priority-api-documents'
REG=ROOT/'regulatory/registries/AMF_UMOA_PRIORITY_API_DOCUMENTS_V0_1.json'
VAL=ROOT/'regulatory/validation/AMF_UMOA_PRIORITY_API_DOCUMENTS_VALIDATION_V0_1.json'
API='https://www.amf-umoa.org/service/api/elastic/actualite';UA='Mozilla/5.0 RegulatoryCorpusBot/1.0'
TARGETS=[
 {'key':'INSTRUCTION_61_CREPMF_2020','id':1000106,'category':'Instruction','pattern':r'Instruction\s+N[°º]?\s*61\s*/\s*2020'},
 {'key':'INSTRUCTION_64_CREPMF_2020','id':1000110,'category':'Instruction','pattern':r'Instruction\s+N[°º]?\s*64\s*/\s*2020'},
 {'key':'DECISION_SANCTIONS_2016','id':1000179,'category':'Decision','pattern':r'CM\s*/\s*SJ\s*/\s*[O0]01\s*/\s*03\s*/\s*2016'},
]
def fetch(i):
 u=API+'?'+urlencode({'id':i,'langue':'fr'})
 with urlopen(Request(u,headers={'User-Agent':UA,'Accept':'application/json'}),timeout=40) as r:b=r.read()
 d=json.loads(b.decode())
 if not isinstance(d,list) or len(d)!=1 or not isinstance(d[0],dict):raise RuntimeError(f'bad detail payload {i}')
 return u,b,d[0]
def pdfinfo(p):
 q=subprocess.run(['pdfinfo',str(p)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,check=True);m=re.search(r'^Pages:\s+(\d+)\s*$',q.stdout,re.M);return int(m.group(1)) if m else None
def extract(p,t):
 subprocess.run(['pdftotext','-layout',str(p),str(t)],check=True);s=t.read_text(errors='ignore') if t.exists() else ''
 return s,'PDFTOTEXT'
def ocr(p,t):
 work=p.parent/(p.stem+'_ocr');work.mkdir(exist_ok=True);subprocess.run(['pdftoppm','-jpeg','-r','180',str(p),str(work/'page')],check=True)
 chunks=[]
 for img in sorted(work.glob('page-*.jpg')):
  out=img.with_suffix('');subprocess.run(['tesseract',str(img),str(out),'-l','fra','--psm','6'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True);tx=out.with_suffix('.txt');chunks.append(tx.read_text(errors='ignore') if tx.exists() else '')
 s='\n\n'.join(chunks);t.write_text(s)
 for x in work.iterdir():x.unlink()
 work.rmdir();return s,'OCR_TESSERACT_FRA_FALLBACK'
def main():
 OUT.mkdir(parents=True,exist_ok=True);rows=[];fails=[]
 for x in TARGETS:
  try:
   u,raw,o=fetch(x['id']);title=str(o.get('titre') or '');body=' '.join(str(o.get(k) or '') for k in ['titre','resume','texte'])
   if str(o.get('categorie'))!=x['category']:raise RuntimeError(f'category mismatch {o.get("categorie")}')
   if not re.search(x['pattern'],body,re.I):raise RuntimeError(f'reference mismatch: {body[:300]}')
   doc=o.get('doc')
   if not isinstance(doc,str) or len(doc)<20:raise RuntimeError('detail API has no Base64 doc')
   pdf=base64.b64decode(doc,validate=True)
   if not pdf.startswith(b'%PDF'):raise RuntimeError('decoded doc is not PDF')
   p=OUT/(x['key']+'.pdf');t=OUT/(x['key']+'.txt');m=OUT/(x['key']+'.metadata.json');p.write_bytes(pdf);sha=hashlib.sha256(pdf).hexdigest();pages=pdfinfo(p)
   text,method=extract(p,t)
   if len(re.sub(r'\s+','',text))<150:text,method=ocr(p,t)
   useful=len(re.sub(r'\s+','',text))
   if useful<150:raise RuntimeError(f'insufficient text after extraction {useful}')
   meta={'sourceId':x['key'],'actualiteId':x['id'],'apiUrl':u,'apiRawSha256':hashlib.sha256(raw).hexdigest(),'titreFromApi':title,'resumeFromApi':o.get('resume'),'texteFromApi':o.get('texte'),'datePortalMetadata':o.get('date'),'validePortalMetadata':o.get('valide'),'abrogePortalMetadata':o.get('abroge'),'documentUrlFromApi':o.get('documentUrl'),'sha256':sha,'byteSize':len(pdf),'pageCount':pages,'textExtractionMethod':method,'usefulTextChars':useful,'repositoryPdf':str(p.relative_to(ROOT)),'repositoryText':str(t.relative_to(ROOT)),'legalBoundary':{'portalDateIsAdoptionDate':False,'portalAbrogeIsSoleLegalStatusProof':False,'binaryMaterializationIsRuleActivation':False,'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True}}
   m.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');rows.append(meta)
  except Exception as e:fails.append({'sourceId':x['key'],'actualiteId':x['id'],'error':str(e)})
 reg={'schemaVersion':'AMF_UMOA_PRIORITY_API_DOCUMENTS_V0_1','authority':'AMF-UMOA','sourceApi':API,'status':'COMPLETE_3_OF_3' if len(rows)==3 and not fails else 'INCOMPLETE','documents':rows,'failures':fails,'boundary':{'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True,'readyForSubmissionMustRemainFalse':True}}
 val={'schemaVersion':'AMF_UMOA_PRIORITY_API_DOCUMENTS_VALIDATION_V0_1','result':'PASS' if reg['status']=='COMPLETE_3_OF_3' else 'FAIL','checks':{'exactly3':len(rows)==3,'noFailures':not fails,'allPdfMagicAndReferenceValidated':len(rows)==3 and not fails,'automaticResolutionForbidden':True},'failures':fails}
 REG.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True);REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':reg['status'],'documents':[(r['sourceId'],r['sha256'],r['pageCount'],r['textExtractionMethod']) for r in rows],'failures':fails},ensure_ascii=False))
 if val['result']!='PASS':raise SystemExit(2)
if __name__=='__main__':main()
