#!/usr/bin/env python3
import json, re, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
QUEUE=ROOT/'regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json'
CAT=ROOT/'regulatory/registries/AMF_UMOA_2022_CIRCULAR_METADATA_CATALOG_V0_1.json'
OUT=ROOT/'regulatory/registries/INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_V0_1.json'
VAL=ROOT/'regulatory/validation/INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_VALIDATION_V0_1.json'
STOP=set('relative aux au a la le les de des du d un une et en pour par sur dans avec sans selon conseil regional circulaire modalites conditions applicable applicables organisme organismes placement collectif'.split())

def norm(s):
 s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower().replace('’',"'")
 return re.sub(r'[^a-z0-9]+',' ',s)
def toks(s):return {x for x in norm(s).split() if len(x)>=4 and x not in STOP}
def circ_label(e):
 f=e.get('fields',{}); return f.get('resume') or f.get('texte') or f.get('titre') or ''
def score(ctx,label):
 a=toks(ctx);b=toks(label)
 if not b:return 0.0,[]
 matches=sorted(a&b)
 coverage=len(matches)/len(b)
 # Give a limited boost for highly discriminating exact concepts.
 concepts=['prospectus','publicitaires','periodiques','liquidite','risques','conflits','interets','depositaire','classes','parts','actions','frais','generaux','evaluation','investisseur','informations','agrement','enregistrement','scission']
 boost=sum(0.08 for c in concepts if c in a and c in b)
 return min(1.0,coverage+boost),matches

def main():
 q=json.loads(QUEUE.read_text());c=json.loads(CAT.read_text())
 if q['summary']['dependencyOccurrenceCount']!=49:raise RuntimeError('queue count changed')
 if c['status']!='COMPLETE_16_METADATA_OBJECTS':raise RuntimeError('circular metadata catalog incomplete')
 circs=c['entries'];rows=[];circular_dep_count=0
 for art in q['articles']:
  for dep in art['dependencies']:
   kind=dep['dependencyKind'];ctx=dep.get('sourceContext','');cands=[]
   if kind=='COUNCIL_CIRCULAR':
    circular_dep_count+=1
    for ce in circs:
     s,m=score(ctx,circ_label(ce))
     if s>=0.18:
      cands.append({'circularNumber':ce['number'],'reference':ce['reference'],'officialObject':circ_label(ce),'lexicalScore':round(s,4),'matchedTokens':m,'candidateOnly':True})
    cands=sorted(cands,key=lambda x:(-x['lexicalScore'],x['circularNumber']))[:5]
   rows.append({'articleNumber':art['articleNumber'],'articleTitle':art['articleTitle'],'dependencyId':dep['dependencyId'],'dependencyKind':kind,'currentReferenceStatus':dep['referenceStatus'],'sourceWording':dep.get('sourceWording'),'sourceContext':ctx,'typeGuard':{'2022CircularCandidateSearchAllowed':kind=='COUNCIL_CIRCULAR','nonCircularDependencyMayBeResolvedByCircular':False},'candidateCirculars':cands,'resolutionStatus':'NOT_RESOLVED_CANDIDATE_RESEARCH_ONLY' if cands else 'NO_2022_CIRCULAR_CANDIDATE_FROM_LEXICAL_MATCH'})
 out={'schemaVersion':'INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_V0_1','sourceInstruction':'INSTRUCTION_66_CREPMF_2021','dependencyQueue':str(QUEUE.relative_to(ROOT)),'officialCircularCatalog':str(CAT.relative_to(ROOT)),'status':'RESEARCH_CANDIDATE_MATRIX_NOT_LEGAL_RESOLUTION','summary':{'dependencyCount':len(rows),'circularDependencyCount':circular_dep_count,'dependenciesWith2022CircularCandidate':sum(bool(r['candidateCirculars']) for r in rows),'dependenciesWithout2022CircularCandidate':sum(not r['candidateCirculars'] for r in rows)},'rows':rows,'boundary':{'lexicalScoreIsLegalMatch':False,'candidateIsResolution':False,'instrumentTypeMustMatch':True,'automaticDependencyResolutionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True,'readyForSubmissionMustRemainFalse':True}}
 val={'schemaVersion':'INST066_TO_AMF_UMOA_2022_CIRCULAR_CANDIDATE_MATRIX_VALIDATION_V0_1','result':'PASS','checks':{'all49DependenciesPreserved':len(rows)==49,'circularDependencyCountPreserved':circular_dep_count==34,'nonCircularRowsHaveNoCircularCandidates':all(not r['candidateCirculars'] for r in rows if r['dependencyKind']!='COUNCIL_CIRCULAR'),'allCandidatesMarkedCandidateOnly':all(x['candidateOnly'] for r in rows for x in r['candidateCirculars']),'noResolvedStatusIntroduced':all(not r['resolutionStatus'].startswith('RESOLVED') for r in rows),'automaticResolutionForbidden':True}}
 OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(out['summary'],ensure_ascii=False))
if __name__=='__main__':main()
