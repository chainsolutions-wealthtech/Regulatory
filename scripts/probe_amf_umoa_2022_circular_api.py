#!/usr/bin/env python3
import concurrent.futures
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'regulatory/registries/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1.json'
VAL = ROOT / 'regulatory/validation/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_VALIDATION_V0_1.json'
BIN = ROOT / 'regulatory/sources/amf-umoa-2022-circulars-api'
HOST = 'https://www.amf-umoa.org'
API = HOST + '/service/api/elastic/actualite'
UA = 'Mozilla/5.0 RegulatoryCorpusBot/1.0'
IDS = range(1000120, 1000161)
KNOWN = {1000138: 10, 1000141: 13}


def fetch(url, timeout=25):
    req = Request(url, headers={'User-Agent': UA, 'Accept': 'application/json,application/pdf,*/*'})
    with urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get('Content-Type', '')


def api_fetch(actualite_id):
    url = API + '?' + urlencode({'id': actualite_id, 'langue': 'fr'})
    try:
        b, ct = fetch(url)
        data = json.loads(b.decode('utf-8', errors='strict'))
        return {'id': actualite_id, 'url': url, 'status': 'OK', 'contentType': ct, 'rawSha256': hashlib.sha256(b).hexdigest(), 'data': data}
    except Exception as e:
        return {'id': actualite_id, 'url': url, 'status': 'ERROR', 'error': str(e)}


def flatten_strings(obj, path='$'):
    out = []
    if isinstance(obj, str):
        out.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            out.extend(flatten_strings(v, f'{path}.{k}'))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out.extend(flatten_strings(v, f'{path}[{i}]'))
    return out


def find_circular(obj):
    strings = flatten_strings(obj)
    combined = ' '.join(s for _, s in strings)
    m = re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,2})\s*[-/]\s*2022', combined, re.I)
    if not m:
        # Some API objects may store reference in separate fields as 010/AMF-UMOA/2022.
        m = re.search(r'CIRCULAIRE.{0,80}?0*(\d{1,2})\s*/\s*(?:AMF[-\s]?UMOA|CREPMF)\s*/\s*2022', combined, re.I)
    if not m:
        return None
    n = int(m.group(1))
    if not 1 <= n <= 16:
        return None
    return n, strings, combined


def attachment_candidates(obj):
    candidates = []
    for path, s in flatten_strings(obj):
        ss = s.strip()
        if '.pdf' in ss.lower() or any(tok in path.lower() for tok in ['file', 'fichier', 'piece', 'document', 'url']):
            if ss.startswith(('http://', 'https://', '/')):
                u = urljoin(HOST, ss)
                if urlparse(u).hostname in {'www.amf-umoa.org', 'amf-umoa.org'}:
                    candidates.append({'jsonPath': path, 'url': u})
    seen = set(); out = []
    for c in candidates:
        if c['url'] not in seen:
            seen.add(c['url']); out.append(c)
    return out


def materialize_pdf(number, candidates):
    attempts = []
    for c in candidates:
        try:
            b, ct = fetch(c['url'], timeout=30)
        except Exception as e:
            attempts.append({**c, 'status': 'FETCH_FAILED', 'error': str(e)})
            continue
        if not b.startswith(b'%PDF'):
            attempts.append({**c, 'status': 'NOT_PDF', 'contentType': ct, 'byteSize': len(b)})
            continue
        # Binary-level identity is kept conservative: raw bytes must expose the number only if text is embedded.
        # Full pdftotext/OCR comparison belongs to the individual circular materializer that follows this registry.
        BIN.mkdir(parents=True, exist_ok=True)
        p = BIN / f'CIRCULAIRE_{number:02d}_AMF_UMOA_2022.pdf'
        p.write_bytes(b)
        return {'url': c['url'], 'jsonPath': c['jsonPath'], 'sha256': hashlib.sha256(b).hexdigest(), 'byteSize': len(b), 'repositoryCopy': str(p.relative_to(ROOT)), 'identityStatus': 'PDF_MAGIC_CONFIRMED_TEXT_COMPARISON_PENDING'}, attempts
    return None, attempts


def normalize_entry(result):
    hit = find_circular(result.get('data')) if result.get('status') == 'OK' else None
    if not hit:
        return None
    n, strings, combined = hit
    candidates = attachment_candidates(result['data'])
    binary, attempts = materialize_pdf(n, candidates)
    # Keep compact API evidence: only string fields useful for title/reference/document discovery.
    evidence = []
    for path, s in strings:
        if re.search(r'circulaire|part|action|frais|risque|liquid|publicit|rapport|prospectus|document|opc|évalu|evalu', s, re.I):
            evidence.append({'jsonPath': path, 'value': re.sub(r'\s+', ' ', s).strip()[:1200]})
    return {
        'number': n,
        'reference': f'Circulaire n°{n:02d}/AMF-UMOA/2022',
        'actualiteId': result['id'],
        'apiUrl': result['url'],
        'apiRawSha256': result['rawSha256'],
        'evidenceStrings': evidence[:20],
        'attachmentCandidates': candidates,
        'materializedBinary': binary,
        'attachmentAttempts': attempts,
        'automaticDependencyResolutionAllowed': False,
    }


def main():
    # Witness validation first.
    witnesses = {}
    for aid, expected in KNOWN.items():
        r = api_fetch(aid)
        e = normalize_entry(r)
        witnesses[str(aid)] = {'expectedNumber': expected, 'result': e, 'rawStatus': r.get('status'), 'error': r.get('error')}
    witness_pass = all(w['result'] and w['result']['number'] == w['expectedNumber'] for w in witnesses.values())
    if not witness_pass:
        OUT.parent.mkdir(parents=True, exist_ok=True); VAL.parent.mkdir(parents=True, exist_ok=True)
        VAL.write_text(json.dumps({'schemaVersion':'AMF_UMOA_2022_CIRCULAR_API_REGISTRY_VALIDATION_V0_1','result':'FAIL','reason':'KNOWN_WITNESS_MISMATCH','witnesses':witnesses},ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'witnessPass': False, 'witnesses': witnesses}, ensure_ascii=False))
        raise SystemExit(2)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        raw_results = list(ex.map(api_fetch, IDS))
    entries = []
    for r in raw_results:
        e = normalize_entry(r)
        if e:
            entries.append(e)
    by_num = {}
    duplicates = []
    for e in sorted(entries, key=lambda x: (x['number'], x['actualiteId'])):
        n = e['number']
        if n in by_num:
            duplicates.append({'number': n, 'keptActualiteId': by_num[n]['actualiteId'], 'otherActualiteId': e['actualiteId']})
            if e.get('materializedBinary') and not by_num[n].get('materializedBinary'):
                by_num[n] = e
        else:
            by_num[n] = e
    final = [by_num[n] for n in sorted(by_num)]
    numbers = [e['number'] for e in final]
    missing = [n for n in range(1,17) if n not in numbers]
    registry = {
        'schemaVersion':'AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1',
        'authority':'AMF-UMOA',
        'apiEndpoint':API,
        'method':'OFFICIAL_FRONTEND_API_WITNESS_VALIDATED_BOUNDED_ID_SCAN',
        'knownWitnesses':witnesses,
        'scanIdRange':[min(IDS),max(IDS)],
        'status':'COMPLETE_01_TO_16' if not missing else 'PARTIAL_OFFICIAL_API_DISCOVERY',
        'discoveredCount':len(final),
        'missingNumbers':missing,
        'duplicates':duplicates,
        'entries':final,
        'boundary':{
            'apiWitnessValidationRequired':True,
            'apiObjectIsIndividualNormativeBinary':False,
            'pdfMagicIsFullLegalValidation':False,
            'automaticDependencyResolutionAllowed':False,
            'automaticRequirementActivationAllowed':False,
            'humanLegalReviewRequired':True,
            'humanComplianceReviewRequired':True,
            'readyForSubmissionMustRemainFalse':True,
        },
    }
    validation = {
        'schemaVersion':'AMF_UMOA_2022_CIRCULAR_API_REGISTRY_VALIDATION_V0_1',
        'result':'PASS',
        'checks':{
            'known010WitnessMatches':witnesses['1000138']['result']['number']==10,
            'known013WitnessMatches':witnesses['1000141']['result']['number']==13,
            'officialHttpsEndpoint':API.startswith('https://www.amf-umoa.org/'),
            'coverageComplete01To16':not missing,
            'automaticResolutionForbidden':True,
        },
        'discoveredCount':len(final),
        'missingNumbers':missing,
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);VAL.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
    VAL.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'witnessPass':True,'discovered':numbers,'missing':missing,'materialized':[e['number'] for e in final if e.get('materializedBinary')]},ensure_ascii=False))

if __name__=='__main__':
    main()
