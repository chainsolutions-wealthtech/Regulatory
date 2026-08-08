#!/usr/bin/env python3
import concurrent.futures
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "regulatory" / "registries" / "AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_V0_1.json"
VAL = ROOT / "regulatory" / "validation" / "AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_VALIDATION_V0_1.json"
BIN = ROOT / "regulatory" / "sources" / "amf-umoa-2022-circulars"
BASES = ["https://www.crepmf.org", "https://www.amf-umoa.org"]
IDS = range(1000125, 1000156)
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"
ALLOWED = {"crepmf.org", "www.crepmf.org", "amf-umoa.org", "www.amf-umoa.org"}


def fetch(url, timeout=15):
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,*/*"})
    with urlopen(req, timeout=timeout) as r:
        return r.read()


def strip_html(raw):
    raw = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def hrefs(raw, base):
    out = []
    for m in re.finditer(r'href\s*=\s*["\']([^"\']+)["\']', raw, re.I):
        u = urljoin(base, html.unescape(m.group(1)))
        if urlparse(u).hostname in ALLOWED:
            out.append(u)
    return list(dict.fromkeys(out))


def scan(url):
    try:
        b = fetch(url)
    except Exception as e:
        return {"url": url, "status": "FETCH_FAILED", "error": str(e)}
    if b.startswith(b"%PDF"):
        return {"url": url, "status": "UNEXPECTED_PDF"}
    raw = b.decode("utf-8", errors="ignore")
    text = strip_html(raw)
    m = re.search(r"CIRCULAIRE\s+N[°ºO]?\s*0*(\d{1,2})\s*[-/]\s*2022", text, re.I)
    if not m:
        return {"url": url, "status": "NO_2022_CIRCULAR", "sha256": hashlib.sha256(b).hexdigest()}
    n = int(m.group(1))
    if n < 1 or n > 16:
        return {"url": url, "status": "OTHER_2022_CIRCULAR", "number": n}
    tail = text[m.end():m.end()+1200]
    # Titles on official pages are normally before the publication date/category footer.
    tail = re.split(r"\b(?:\d{1,2}\s+(?:janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+2023|Catégories|Contacts|Image)\b", tail, 1, flags=re.I)[0]
    title = re.sub(r"\s+", " ", tail).strip(" -–—:;.")
    candidates = []
    binary = None
    for u in hrefs(raw, url):
        if ".pdf" not in u.lower():
            continue
        candidates.append(u)
        try:
            pb = fetch(u, timeout=20)
        except Exception:
            continue
        if pb.startswith(b"%PDF"):
            BIN.mkdir(parents=True, exist_ok=True)
            p = BIN / f"CIRCULAIRE_{n:02d}_AMF_UMOA_2022.pdf"
            p.write_bytes(pb)
            binary = {"url": u, "sha256": hashlib.sha256(pb).hexdigest(), "byteSize": len(pb), "repositoryCopy": str(p.relative_to(ROOT))}
            break
    return {
        "url": url,
        "status": "OFFICIAL_PAGE_IDENTIFIED",
        "number": n,
        "reference": f"Circulaire n°{n:02d}/AMF-UMOA/2022",
        "titleFromOfficialPage": title,
        "pageSha256": hashlib.sha256(b).hexdigest(),
        "pdfCandidates": candidates,
        "materializedBinary": binary,
    }


def main():
    urls = [f"{base}/actuality-details?actualiteId={i}" for base in BASES for i in IDS]
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = list(ex.map(scan, urls))
    by_num = {}
    for r in results:
        if r.get("status") != "OFFICIAL_PAGE_IDENTIFIED":
            continue
        n = r["number"]
        prev = by_num.get(n)
        if prev is None or (r.get("materializedBinary") and not prev.get("materializedBinary")):
            by_num[n] = r
    entries = [by_num[n] for n in sorted(by_num)]
    numbers = [x["number"] for x in entries]
    missing = [n for n in range(1, 17) if n not in numbers]
    registry = {
        "schemaVersion": "AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_V0_1",
        "authority": "AMF-UMOA",
        "method": "BOUNDED_OFFICIAL_ACTUALITY_PAGE_SCAN_CONTENT_VALIDATED",
        "scanIdRange": [min(IDS), max(IDS)],
        "status": "COMPLETE_01_TO_16" if not missing else "PARTIAL_OFFICIAL_PAGE_DISCOVERY",
        "discoveredCount": len(entries),
        "missingNumbers": missing,
        "entries": entries,
        "boundary": {
            "pageIdImpliesRegulatoryNumber": False,
            "contentRegexRequired": True,
            "officialPageIsIndividualBinary": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_2022_CIRCULAR_OFFICIAL_PAGES_VALIDATION_V0_1",
        "result": "PASS" if 10 in numbers and 13 in numbers else "FAIL",
        "checks": {
            "knownCircular010Recovered": 10 in numbers,
            "knownCircular013Recovered": 13 in numbers,
            "allEntriesContentValidated": all(x["status"] == "OFFICIAL_PAGE_IDENTIFIED" for x in entries),
            "coverageComplete01To16": not missing,
            "automaticResolutionForbidden": True,
        },
        "discoveredCount": len(entries),
        "missingNumbers": missing,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    VAL.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VAL.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"discovered": numbers, "missing": missing, "materialized": [x["number"] for x in entries if x.get("materializedBinary")]}, ensure_ascii=False))
    if validation["result"] != "PASS":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
