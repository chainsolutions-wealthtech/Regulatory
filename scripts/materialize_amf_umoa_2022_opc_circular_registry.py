#!/usr/bin/env python3
import hashlib
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "regulatory" / "sources" / "amf-umoa-2022-report"
REGISTRY = ROOT / "regulatory" / "registries" / "AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_V0_1.json"
VALIDATION = ROOT / "regulatory" / "validation" / "AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_VALIDATION_V0_1.json"
INDEX_URLS = [
    "https://www.amf-umoa.org/publication/rapport",
    "https://www.crepmf.org/publication/rapport",
]
ALLOWED_HOSTS = {"amf-umoa.org", "www.amf-umoa.org", "crepmf.org", "www.crepmf.org"}
UA = "Mozilla/5.0 RegulatoryCorpusBot/1.0"


def fetch(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,*/*"})
    with urlopen(req, timeout=45) as r:
        return r.read()


def allowed(url: str) -> bool:
    return urlparse(url).hostname in ALLOWED_HOSTS


def hrefs(raw: str, base: str):
    out = []
    for m in re.finditer(r'href\s*=\s*["\']([^"\']+)["\']', raw, re.I):
        u = html.unescape(m.group(1)).strip()
        if not u or u.startswith(("javascript:", "mailto:", "#")):
            continue
        full = urljoin(base, u)
        if allowed(full):
            out.append((m.start(), full))
    return out


def discover_report_2022():
    attempts = []
    for index_url in INDEX_URLS:
        try:
            b = fetch(index_url)
            raw = b.decode("utf-8", errors="ignore")
            attempts.append({"url": index_url, "status": "FETCHED", "sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b)})
        except Exception as e:
            attempts.append({"url": index_url, "status": "FAILED", "error": str(e)})
            continue
        positions = [m.start() for m in re.finditer(r'RAPPORT\s+ANNUEL\s+2022', raw, re.I)]
        links = hrefs(raw, index_url)
        candidates = []
        for p in positions:
            for lp, u in links:
                dist = abs(lp - p)
                if dist <= 8000:
                    score = 0
                    lu = u.lower()
                    if ".pdf" in lu:
                        score += 100
                    if "actuality-details" in lu or "actualite" in lu:
                        score += 50
                    score += max(0, 40 - dist // 200)
                    candidates.append((score, dist, u))
        for _, _, candidate in sorted(candidates, reverse=True):
            try:
                cb = fetch(candidate)
            except Exception:
                continue
            if cb.startswith(b"%PDF"):
                return candidate, cb, index_url, attempts
            craw = cb.decode("utf-8", errors="ignore")
            for _, u in hrefs(craw, candidate):
                if ".pdf" not in u.lower():
                    continue
                try:
                    pb = fetch(u)
                except Exception:
                    continue
                if pb.startswith(b"%PDF"):
                    return u, pb, candidate, attempts
        # fallback: scan any PDF link whose nearby HTML mentions 2022/report
        for lp, u in links:
            if ".pdf" not in u.lower():
                continue
            ctx = raw[max(0, lp-2000):lp+2000]
            if re.search(r'RAPPORT\s+ANNUEL\s+2022|2022.*RAPPORT|RAPPORT.*2022', ctx, re.I | re.S):
                try:
                    pb = fetch(u)
                except Exception:
                    continue
                if pb.startswith(b"%PDF"):
                    return u, pb, index_url, attempts
    raise RuntimeError("Official AMF-UMOA 2022 annual report PDF not discovered from official report index")


def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("\u00a0", " ")).strip(" ;.\n\t")


def extract_circulars(text: str):
    flat = normalize_text(text)
    # Capture each 2022 AMF-UMOA circular up to the next circular/reference bullet.
    pat = re.compile(
        r'(?:la\s+)?Circulaire\s+n[°ºo]?\s*(\d{1,2})\s*/\s*AMF[-\s]?UMOA\s*/\s*2022\s+(.*?)(?=(?:la\s+)?Circulaire\s+n[°ºo]?\s*\d{1,2}\s*/\s*AMF[-\s]?UMOA\s*/\s*2022|Instruction\s+n[°ºo]?|Décision\s+n[°ºo]?|$)',
        re.I | re.S,
    )
    found = {}
    for num, title in pat.findall(flat):
        n = int(num)
        if not 1 <= n <= 16:
            continue
        # Trim common report prose after a semicolon/bullet boundary where possible.
        t = title
        for stop in [" ; ", " • ", "  ", " RAPPORT ANNUEL 2022 "]:
            if stop in t:
                t = t.split(stop, 1)[0]
        found[n] = normalize_text(t)
    return found


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION.parent.mkdir(parents=True, exist_ok=True)
    pdf_url, pdf, discovery_page, attempts = discover_report_2022()
    pdf_path = OUT_DIR / "RAPPORT_ANNUEL_2022_AMF_UMOA.pdf"
    txt_path = OUT_DIR / "RAPPORT_ANNUEL_2022_AMF_UMOA.txt"
    meta_path = OUT_DIR / "RAPPORT_ANNUEL_2022_AMF_UMOA.metadata.json"
    pdf_path.write_bytes(pdf)
    sha = hashlib.sha256(pdf).hexdigest()

    try:
        subprocess.run(["pdftotext", "-layout", str(pdf_path), str(txt_path)], check=True)
    except Exception as e:
        raise RuntimeError(f"pdftotext failed: {e}")
    text = txt_path.read_text(encoding="utf-8", errors="ignore")
    if "RAPPORT ANNUEL 2022" not in text.upper() or "AMF-UMOA" not in text.upper():
        raise RuntimeError("Downloaded PDF identity check failed")

    circulars = extract_circulars(text)
    expected = set(range(1, 17))
    missing = sorted(expected - set(circulars))
    entries = [
        {
            "number": n,
            "reference": f"Circulaire n°{n:02d}/AMF-UMOA/2022",
            "titleFromOfficialAnnualReport": circulars.get(n),
            "source": "RAPPORT_ANNUEL_2022_AMF_UMOA",
            "individualBinaryStatus": "TO_MATERIALIZE_AND_COMPARE",
            "automaticDependencyResolutionAllowed": False,
        }
        for n in range(1, 17)
    ]
    registry = {
        "schemaVersion": "AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_V0_1",
        "authority": "AMF-UMOA",
        "sourceDocument": "Rapport annuel 2022 AMF-UMOA",
        "officialSourceUrl": pdf_url,
        "officialDiscoveryPage": discovery_page,
        "sourceSha256": sha,
        "sourceByteSize": len(pdf),
        "status": "OFFICIAL_ANNUAL_REPORT_REGISTRY_ONLY_INDIVIDUAL_BINARIES_PENDING",
        "expectedCircularCount": 16,
        "detectedCircularCount": len(circulars),
        "missingCircularNumbers": missing,
        "entries": entries,
        "boundary": {
            "annualReportListingIsIndividualNormativeBinary": False,
            "automaticDependencyResolutionAllowed": False,
            "automaticRequirementActivationAllowed": False,
            "humanLegalReviewRequired": True,
            "humanComplianceReviewRequired": True,
            "readyForSubmissionMustRemainFalse": True,
        },
    }
    validation = {
        "schemaVersion": "AMF_UMOA_2022_OPC_CIRCULARS_REGISTRY_VALIDATION_V0_1",
        "result": "PASS" if not missing else "FAIL",
        "checks": {
            "pdfMagic": pdf.startswith(b"%PDF"),
            "officialHost": allowed(pdf_url),
            "annualReportIdentity": True,
            "expected16Detected": len(circulars) == 16,
            "allNumbers01To16": not missing,
            "individualBinariesRemainPending": True,
            "automaticResolutionForbidden": True,
        },
        "missingCircularNumbers": missing,
    }
    REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    VALIDATION.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    meta_path.write_text(json.dumps({
        "officialSourceUrl": pdf_url,
        "officialDiscoveryPage": discovery_page,
        "sha256": sha,
        "byteSize": len(pdf),
        "discoveryAttempts": attempts,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pdfUrl": pdf_url, "sha256": sha, "detected": len(circulars), "missing": missing}, ensure_ascii=False))
    if missing:
        sys.exit(2)


if __name__ == "__main__":
    main()
