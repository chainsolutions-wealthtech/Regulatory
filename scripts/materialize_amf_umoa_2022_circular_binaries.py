#!/usr/bin/env python3
import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API_REGISTRY = ROOT / 'regulatory/registries/AMF_UMOA_2022_CIRCULAR_API_REGISTRY_V0_1.json'
OUT_DIR = ROOT / 'regulatory/sources/amf-umoa-2022-circulars'
CATALOG = ROOT / 'regulatory/registries/AMF_UMOA_2022_CIRCULAR_CATALOG_V0_1.json'
VALIDATION = ROOT / 'regulatory/validation/AMF_UMOA_2022_CIRCULAR_BINARIES_VALIDATION_V0_1.json'
API = 'https://www.amf-umoa.org/service/api/elastic/actualite'
UA = 'Mozilla/5.0 RegulatoryCorpusBot/1.0'


def fetch_json(actualite_id):
    url = API + '?' + urlencode({'id': actualite_id, 'langue': 'fr'})
    req = Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urlopen(req, timeout=35) as r:
        raw = r.read()
    data = json.loads(raw.decode('utf-8'))
    if not isinstance(data, list) or len(data) != 1 or not isinstance(data[0], dict):
        raise RuntimeError(f'Unexpected API payload for {actualite_id}')
    return url, raw, data[0]


def clean_text(v):
    if not isinstance(v, str):
        return None
    return re.sub(r'\s+', ' ', v).strip()


def pdf_page_count(path):
    p = subprocess.run(['pdfinfo', str(path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    m = re.search(r'^Pages:\s+(\d+)\s*$', p.stdout, re.M)
    if not m:
        raise RuntimeError(f'Unable to determine page count: {path}')
    return int(m.group(1))


def pdftotext(path, out_txt):
    subprocess.run(['pdftotext', '-layout', str(path), str(out_txt)], check=True)
    return out_txt.read_text(encoding='utf-8', errors='ignore') if out_txt.exists() else ''


def ocr_pdf(path, out_txt):
    # OCR is a fallback only for image-only scanned circulars.
    work = path.parent / (path.stem + '_ocr_pages')
    work.mkdir(parents=True, exist_ok=True)
    subprocess.run(['pdftoppm', '-jpeg', '-r', '180', str(path), str(work / 'page')], check=True)
    chunks = []
    for img in sorted(work.glob('page-*.jpg')):
        outbase = img.with_suffix('')
        subprocess.run(['tesseract', str(img), str(outbase), '-l', 'fra', '--psm', '6'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        txt = outbase.with_suffix('.txt')
        if txt.exists():
            chunks.append(txt.read_text(encoding='utf-8', errors='ignore'))
    combined = '\n\n'.join(chunks)
    out_txt.write_text(combined, encoding='utf-8')
    # Clean temporary raster/OCR page files so they are not committed.
    for p in work.iterdir():
        p.unlink()
    work.rmdir()
    return combined


def find_reference(text):
    m = re.search(r'CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,2})\s*[-/]\s*2022', text or '', re.I)
    return int(m.group(1)) if m else None


def main():
    reg = json.loads(API_REGISTRY.read_text(encoding='utf-8'))
    if reg.get('status') != 'COMPLETE_01_TO_16' or reg.get('missingNumbers') != []:
        raise RuntimeError('API registry is not complete 01..16')
    entries = reg['entries']
    if [e['number'] for e in entries] != list(range(1, 17)):
        raise RuntimeError('API registry numbering is not exactly 01..16')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    catalog_entries = []
    failures = []
    ocr_used = []

    for seed in entries:
        n = seed['number']
        aid = seed['actualiteId']
        try:
            api_url, raw, obj = fetch_json(aid)
            titre = clean_text(obj.get('titre')) or ''
            resume = clean_text(obj.get('resume'))
            texte = clean_text(obj.get('texte'))
            categorie = clean_text(obj.get('categorie'))
            doc_url = clean_text(obj.get('documentUrl'))
            api_num = find_reference(titre + ' ' + (resume or '') + ' ' + (texte or ''))
            if api_num != n:
                raise RuntimeError(f'API title/reference mismatch: expected {n}, got {api_num}; titre={titre!r}')
            if categorie and 'circulaire' not in categorie.lower():
                raise RuntimeError(f'Unexpected category for circular {n}: {categorie}')
            doc = obj.get('doc')
            if not isinstance(doc, str) or not doc.strip():
                raise RuntimeError(f'Missing Base64 doc for circular {n}')
            try:
                pdf = base64.b64decode(doc, validate=True)
            except Exception as e:
                raise RuntimeError(f'Invalid Base64 PDF for circular {n}: {e}')
            if not pdf.startswith(b'%PDF'):
                raise RuntimeError(f'Decoded doc is not PDF for circular {n}')

            pdf_path = OUT_DIR / f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022.pdf'
            txt_path = OUT_DIR / f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022.txt'
            meta_path = OUT_DIR / f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022.metadata.json'
            pdf_path.write_bytes(pdf)
            sha = hashlib.sha256(pdf).hexdigest()
            pages = pdf_page_count(pdf_path)
            text = pdftotext(pdf_path, txt_path)
            useful = re.sub(r'\s+', '', text)
            method = 'PDFTOTEXT'
            if len(useful) < 150:
                text = ocr_pdf(pdf_path, txt_path)
                useful = re.sub(r'\s+', '', text)
                method = 'OCR_TESSERACT_FRA_FALLBACK'
                ocr_used.append(n)
            if len(useful) < 150:
                raise RuntimeError(f'Insufficient extracted text after fallback for circular {n}: {len(useful)} chars')

            text_num = find_reference(text)
            # Scans/OCR may damage the header. API title is authoritative for identity;
            # extracted text match is recorded, not required when OCR is imperfect.
            meta = {
                'sourceId': f'CIRCULAIRE_{n:02d}_AMF_UMOA_2022',
                'reference': f'Circulaire n°{n:02d}/AMF-UMOA/2022',
                'actualiteId': aid,
                'apiUrl': api_url,
                'apiRawSha256': hashlib.sha256(raw).hexdigest(),
                'titreFromApi': titre,
                'resumeFromApi': resume,
                'texteFromApi': texte,
                'categorieFromApi': categorie,
                'documentUrlFromApi': doc_url,
                'repositoryPdf': str(pdf_path.relative_to(ROOT)),
                'repositoryText': str(txt_path.relative_to(ROOT)),
                'sha256': sha,
                'byteSize': len(pdf),
                'pageCount': pages,
                'textExtractionMethod': method,
                'usefulTextChars': len(useful),
                'referenceNumberDetectedInExtractedText': text_num,
                'binaryIdentity': 'API_OBJECT_REFERENCE_MATCH_AND_BASE64_PDF_MAGIC_CONFIRMED',
                'legalStatus': 'TO_VERIFY',
                'automaticDependencyResolutionAllowed': False,
                'automaticRequirementActivationAllowed': False,
                'humanLegalReviewRequired': True,
                'humanComplianceReviewRequired': True,
                'readyForSubmission': False,
            }
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            catalog_entries.append({
                'number': n,
                'reference': meta['reference'],
                'actualiteId': aid,
                'titre': titre,
                'resume': resume,
                'texte': texte,
                'documentUrl': doc_url,
                'sha256': sha,
                'byteSize': len(pdf),
                'pageCount': pages,
                'textExtractionMethod': method,
                'usefulTextChars': len(useful),
                'repositoryPdf': meta['repositoryPdf'],
                'repositoryText': meta['repositoryText'],
                'repositoryMetadata': str(meta_path.relative_to(ROOT)),
                'dependencyResolutionStatus': 'BINARY_MATERIALIZED_SCOPE_MAPPING_PENDING',
            })
        except Exception as e:
            failures.append({'number': n, 'actualiteId': aid, 'error': str(e)})

    catalog = {
        'schemaVersion': 'AMF_UMOA_2022_CIRCULAR_CATALOG_V0_1',
        'authority': 'AMF-UMOA',
        'sourceApi': API,
        'status': 'COMPLETE_16_BINARIES_MATERIALIZED' if not failures and len(catalog_entries) == 16 else 'INCOMPLETE_BINARY_MATERIALIZATION',
        'circularCount': len(catalog_entries),
        'ocrFallbackUsedForNumbers': ocr_used,
        'failures': failures,
        'entries': catalog_entries,
        'boundary': {
            'binaryMaterializationIsDependencyResolution': False,
            'automaticDependencyResolutionAllowed': False,
            'automaticRequirementActivationAllowed': False,
            'humanLegalReviewRequired': True,
            'humanComplianceReviewRequired': True,
            'readyForSubmissionMustRemainFalse': True,
        },
    }
    validation = {
        'schemaVersion': 'AMF_UMOA_2022_CIRCULAR_BINARIES_VALIDATION_V0_1',
        'result': 'PASS' if catalog['status'] == 'COMPLETE_16_BINARIES_MATERIALIZED' else 'FAIL',
        'checks': {
            'exactly16Binaries': len(catalog_entries) == 16,
            'numbers01To16': [e['number'] for e in catalog_entries] == list(range(1,17)),
            'noMaterializationFailures': not failures,
            'allPdfMagicAndApiReferenceValidated': not failures and len(catalog_entries) == 16,
            'automaticResolutionForbidden': True,
            'readyForSubmissionFalse': True,
        },
        'failures': failures,
    }
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': catalog['status'], 'count': len(catalog_entries), 'ocr': ocr_used, 'failures': failures}, ensure_ascii=False))
    if validation['result'] != 'PASS':
        raise SystemExit(2)

if __name__ == '__main__':
    main()
