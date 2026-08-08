#!/usr/bin/env python3
import json, re, unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DIGEST=ROOT/'regulatory/registries/INST066_CIRCULAR_DEPENDENCY_REVIEW_DIGEST_V0_1.json'
CAT=ROOT/'regulatory/registries/AMF_UMOA_2022_CIRCULAR_CATALOG_V0_1.json'
OUT=ROOT/'regulatory/registries/INST066_TO_AMF_UMOA_2022_CIRCULAR_CONTENT_SCOPE_MATRIX_V0_1.json'
VAL=ROOT/'regulatory/validation/INST066_TO_AMF_UMOA_2022_CIRCULAR_CONTENT_SCOPE_MATRIX_VALIDATION_V0_1.json'
TEXT_DIR=ROOT/'regulatory/sources/amf-umoa-2022-circulars'

def norm(s):
    s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+',' ',s).strip()

# Curated only after own-binary review. No entry here means no confirmed match yet.
MAP={
 'INST066_ART005_DEP_CIRC_01':(10,'EXACT_IMPLEMENTING_SCOPE_MATCH',['frais generaux','article 5']),
 'INST066_ART005_DEP_CIRC_02':(2,'EXACT_IMPLEMENTING_SCOPE_MATCH',['programme d activites','article 5','liste des documents']),
 'INST066_ART009_DEP_CIRC_01':(16,'STRONG_IMPLEMENTING_SCOPE_MATCH',['conflits d interets','regles de conduite']),
 'INST066_ART011_DEP_CIRC_01':(15,'STRONG_IMPLEMENTING_SCOPE_MATCH',['article 11','gestion des risques']),
 'INST066_ART012_DEP_CIRC_01':(14,'EXACT_IMPLEMENTING_SCOPE_MATCH',['gestion de la liquidite','simulations de crise','suspendre temporairement']),
 'INST066_ART013_DEP_CIRC_01':(12,'EXACT_IMPLEMENTING_SCOPE_MATCH',['procedures d evaluation','valeur nette d inventaire','expert externe']),
 'INST066_ART017_DEP_CIRC_01':(3,'EXACT_IMPLEMENTING_SCOPE_MATCH',['articles 17 25 et 55','processus d agrement']),
 'INST066_ART021_DEP_CIRC_01':(4,'STRONG_IMPLEMENTING_SCOPE_MATCH_WITH_REPORTING_LIMITATION',['depositaire','article 21','fonctions du depositaire']),
 'INST066_ART021_DEP_CIRC_02':(4,'EXACT_IMPLEMENTING_SCOPE_MATCH',['contrat de depositaire','article 21','fonctions du depositaire']),
 'INST066_ART025_DEP_CIRC_01':(3,'EXACT_IMPLEMENTING_SCOPE_MATCH',['articles 17 25 et 55','demande d agrement']),
 'INST066_ART028_DEP_CIRC_01':(5,'EXACT_IMPLEMENTING_SCOPE_MATCH',['contenu du prospectus','instruction n 66']),
 'INST066_ART032_DEP_CIRC_01':(7,'EXACT_IMPLEMENTING_SCOPE_MATCH',['communications publicitaires','claire exacte et non trompeuse']),
 'INST066_ART033_DEP_CIRC_01':(6,'EXACT_IMPLEMENTING_SCOPE_MATCH',['document d informations cles','instruction n 66']),
 'INST066_ART036_DEP_CIRC_01':(9,'STRONG_IMPLEMENTING_SCOPE_MATCH',['conseil regional','comptes rendus']),
 'INST066_ART037_DEP_CIRC_01':(8,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 37','rapports periodiques']),
 'INST066_ART037_DEP_CIRC_02':(8,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 37','rapports periodiques']),
 'INST066_ART038_DEP_CIRC_01':(13,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 38','classes de parts']),
 'INST066_ART040_DEP_CIRC_01':(15,'STRONG_IMPLEMENTING_SCOPE_MATCH',['risque global','instruments derives']),
 'INST066_ART040_DEP_CIRC_02':(15,'STRONG_IMPLEMENTING_SCOPE_MATCH',['gestion des risques','instruments derives']),
 'INST066_ART047_DEP_CIRC_01':(14,'EXACT_IMPLEMENTING_SCOPE_MATCH',['suspendre temporairement','rachat','remboursement']),
 'INST066_ART053_DEP_CIRC_01':(11,'EXACT_IMPLEMENTING_SCOPE_MATCH',['remuneration','mode de calcul','frais de l opc']),
 'INST066_ART053_DEP_CIRC_02':(11,'EXACT_IMPLEMENTING_SCOPE_MATCH',['frais','societe de gestion','prospectus']),
 'INST066_ART055_DEP_CIRC_01':(3,'EXACT_IMPLEMENTING_SCOPE_MATCH',['articles 17 25 et 55','fusion']),
 'INST066_ART074_DEP_CIRC_01':(13,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 74','classes de parts']),
 'INST066_ART074_DEP_CIRC_02':(13,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 74','classes de parts']),
 'INST066_ART080_DEP_CIRC_01':(13,'EXACT_IMPLEMENTING_SCOPE_MATCH',['article 80','classes de parts']),
}
RELATED={
 'INST066_ART059_DEP_CIRC_01':(3,'RELATED_ONLY_NOT_EXACT_IMPLEMENTING_MATCH',['information des porteurs','fusion']),
 'INST066_ART074_DEP_CIRC_03':(6,'RELATED_INFORMATION_ONLY_OPERATING_MODALITIES_NOT_ESTABLISHED',['fcpe nourricier','opc maitre']),
}
NO_CONFIRMED={
 'INST066_ART004_DEP_CIRC_01':'AUXILIARY_SERVICES_LIMITS_NOT_IDENTIFIED_IN_2022_SERIES',
 'INST066_ART014_DEP_CIRC_01':'DELEGATION_BOX_LETTER_IMPLEMENTING_CIRCULAR_NOT_IDENTIFIED_IN_2022_SERIES',
 'INST066_ART023_DEP_CIRC_01':'SICAV_MARKET_ADMISSION_CIRCULAR_NOT_IDENTIFIED_IN_2022_SERIES',
 'INST066_ART023_DEP_CIRC_02':'SICAV_GLOBAL_PORTFOLIO_DELEGATION_CIRCULAR_NOT_IDENTIFIED_IN_2022_SERIES',
 'INST066_ART075_DEP_CIRC_01':'FCPE_SUPERVISORY_COUNCIL_ANNUAL_REPORT_CONTENT_NOT_IDENTIFIED_IN_2022_SERIES',
 'INST066_ART076_DEP_CIRC_01':'SICAVAS_SUPERVISORY_COUNCIL_ANNUAL_REPORT_CONTENT_NOT_IDENTIFIED_IN_2022_SERIES',
}

def main():
    digest=json.loads(DIGEST.read_text(encoding='utf-8'))
    cat=json.loads(CAT.read_text(encoding='utf-8'))
    if digest['rowCount']!=34: raise RuntimeError('digest count changed')
    if cat['status']!='COMPLETE_16_BINARIES_MATERIALIZED': raise RuntimeError('circular corpus incomplete')
    cat_by={e['number']:e for e in cat['entries']}
    texts={}
    for n in range(1,17):
        p=TEXT_DIR/f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022.txt'
        texts[n]=norm(p.read_text(encoding='utf-8',errors='ignore'))
    rows=[]; failures=[]
    ids={r['dependencyId'] for r in digest['rows']}
    curated=set(MAP)|set(RELATED)|set(NO_CONFIRMED)
    if curated!=ids:
        failures.append({'type':'CURATED_ID_SET_MISMATCH','missingFromCuration':sorted(ids-curated),'unknownInCuration':sorted(curated-ids)})
    for d in digest['rows']:
        did=d['dependencyId']
        base={'articleNumber':d['articleNumber'],'articleTitle':d['articleTitle'],'dependencyId':did,'sourceContext':d['sourceContext'],'resolved':False,'requirementActivationAllowed':False}
        if did in MAP or did in RELATED:
            n,status,anchors=(MAP.get(did) or RELATED.get(did))
            text=texts[n]; checks=[]
            for a in anchors:
                ok=norm(a) in text;checks.append({'anchor':a,'present':ok})
                if not ok: failures.append({'type':'MISSING_TEXT_ANCHOR','dependencyId':did,'circularNumber':n,'anchor':a})
            ce=cat_by[n]
            base.update({'matchStatus':status,'circularNumber':n,'circularReference':ce['reference'],'circularSha256':ce['sha256'],'circularTextPath':ce['repositoryText'],'textAnchorChecks':checks,'contentEvidenceValidated':all(x['present'] for x in checks),'legalReviewStatus':'PENDING','complianceReviewStatus':'PENDING'})
        else:
            base.update({'matchStatus':'NO_CONFIRMED_MATCH_IN_REVIEWED_2022_SERIES','reason':NO_CONFIRMED[did],'circularNumber':None,'circularReference':None,'contentEvidenceValidated':False,'legalReviewStatus':'PENDING','complianceReviewStatus':'PENDING'})
        rows.append(base)
    counts={}
    for r in rows:counts[r['matchStatus']]=counts.get(r['matchStatus'],0)+1
    out={'schemaVersion':'INST066_TO_AMF_UMOA_2022_CIRCULAR_CONTENT_SCOPE_MATRIX_V0_1','sourceInstruction':'INSTRUCTION_66_CREPMF_2021','officialCircularCorpus':str(CAT.relative_to(ROOT)),'status':'CURATED_OWN_BINARY_CONTENT_SCOPE_REVIEW_NO_LEGAL_RESOLUTION','summary':{'dependencyCount':len(rows),'matchedStrongOrExact':sum(r['circularNumber'] is not None and not r['matchStatus'].startswith('RELATED') for r in rows),'relatedOnly':sum(r['matchStatus'].startswith('RELATED') for r in rows),'noConfirmedMatch':sum(r['circularNumber'] is None for r in rows),'countsByStatus':counts},'rows':rows,'boundary':{'contentScopeMatchIsLegalResolution':False,'relatedOnlyMayBePromotedAutomatically':False,'noConfirmedMatchMeansInstrumentDoesNotExist':False,'automaticDependencyResolutionAllowed':False,'automaticRuleReconstructionAllowed':False,'automaticRequirementActivationAllowed':False,'humanLegalReviewRequired':True,'humanComplianceReviewRequired':True,'readyForSubmissionMustRemainFalse':True}}
    val={'schemaVersion':'INST066_TO_AMF_UMOA_2022_CIRCULAR_CONTENT_SCOPE_MATRIX_VALIDATION_V0_1','result':'PASS' if not failures else 'FAIL','checks':{'all34DependenciesPreserved':len(rows)==34,'allCuratedIdsAccountedFor':curated==ids,'allMappedAnchorsPresent':not any(f['type']=='MISSING_TEXT_ANCHOR' for f in failures),'noResolvedRows':all(r['resolved'] is False for r in rows),'noRequirementActivation':all(r['requirementActivationAllowed'] is False for r in rows),'automaticResolutionForbidden':True},'failures':failures}
    OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');VAL.write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'summary':out['summary'],'failures':failures},ensure_ascii=False))
    if failures: raise SystemExit(2)
if __name__=='__main__':main()
