#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'regulatory/registries/INST066_EXTERNAL_DEPENDENCY_RESEARCH_QUEUE_V0_1.json'
OUT=ROOT/'regulatory/registries/INST066_CIRCULAR_DEPENDENCY_REVIEW_DIGEST_V0_1.json'

def main():
    q=json.loads(SRC.read_text(encoding='utf-8'))
    rows=[]
    for art in q['articles']:
        for dep in art['dependencies']:
            if dep['dependencyKind']!='COUNCIL_CIRCULAR':
                continue
            rows.append({
                'articleNumber':art['articleNumber'],
                'articleTitle':art['articleTitle'],
                'dependencyId':dep['dependencyId'],
                'referenceStatus':dep['referenceStatus'],
                'sourceWording':dep.get('sourceWording'),
                'sourceContext':dep.get('sourceContext',''),
            })
    if len(rows)!=34:
        raise RuntimeError(f'Expected 34 circular dependencies, got {len(rows)}')
    out={
        'schemaVersion':'INST066_CIRCULAR_DEPENDENCY_REVIEW_DIGEST_V0_1',
        'sourceId':'INSTRUCTION_66_CREPMF_2021',
        'rowCount':len(rows),
        'rows':rows,
        'boundary':{
            'digestIsResolution':False,
            'automaticDependencyResolutionAllowed':False,
            'automaticRequirementActivationAllowed':False,
            'humanLegalReviewRequired':True,
            'humanComplianceReviewRequired':True,
        }
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'rowCount':len(rows)},ensure_ascii=False))
if __name__=='__main__':main()
