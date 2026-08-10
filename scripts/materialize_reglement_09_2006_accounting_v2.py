#!/usr/bin/env python3
"""Governed HTTP-context wrapper for Regulation 09/2006 materialization.

V1 correctly validates the official PDF once downloaded, but the SGG Mali archive
returned HTTP 403 to a direct hotlink from GitHub Actions. V2 preserves every V1
identity/safety check and changes only the acquisition transport:

1. open the official SGG Mali UEMOA listing page to establish first-party context;
2. keep cookies in a single opener;
3. request the exact official PDF with the listing page as Referer;
4. reject any final redirect outside the SGG Mali government domain;
5. hand the bytes back to V1, which still enforces PDF magic, size, text identity,
   legal-status boundaries and human-review gates.

TLS verification is intentionally left at Python's secure default. No third-party
fallback source is permitted here.
"""

from __future__ import annotations

import http.cookiejar
import time
import urllib.error
import urllib.parse
import urllib.request

import materialize_reglement_09_2006_accounting as v1

LISTING_URL = "https://sgg-mali.ml/fr/droit-rgional/uemoa.html?page=2"
ALLOWED_HOSTS = {"sgg-mali.ml", "www.sgg-mali.ml"}
BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
)


def _assert_official_final_url(url: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in ALLOWED_HOSTS:
        raise RuntimeError(f"NON_OFFICIAL_REDIRECT_REJECTED:{url}")


def _build_opener() -> urllib.request.OpenerDirector:
    jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar),
        urllib.request.HTTPRedirectHandler(),
    )


def _prime_first_party_context(opener: urllib.request.OpenerDirector) -> None:
    request = urllib.request.Request(
        LISTING_URL,
        headers={
            "User-Agent": BROWSER_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
            "Cache-Control": "no-cache",
        },
        method="GET",
    )
    with opener.open(request, timeout=60) as response:
        _assert_official_final_url(response.geturl())
        if getattr(response, "status", 200) != 200:
            raise RuntimeError(f"LISTING_HTTP_STATUS:{getattr(response, 'status', None)}")
        # Consume a bounded prefix so cookies/headers are fully processed without
        # depending on the HTML structure of the listing page.
        response.read(64 * 1024)


def download_pdf_with_first_party_context(url: str, attempts: int = 4) -> bytes:
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        opener = _build_opener()
        try:
            _prime_first_party_context(opener)
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": BROWSER_UA,
                    "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
                    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
                    "Referer": LISTING_URL,
                    "Cache-Control": "no-cache",
                },
                method="GET",
            )
            with opener.open(request, timeout=90) as response:
                _assert_official_final_url(response.geturl())
                if getattr(response, "status", 200) != 200:
                    raise RuntimeError(f"PDF_HTTP_STATUS:{getattr(response, 'status', None)}")
                content = response.read()
                # Keep V1 as the single source of truth for full binary validation;
                # this early check prevents returning an HTML access-denied page.
                if not content.startswith(b"%PDF-"):
                    content_type = response.headers.get("Content-Type", "")
                    raise RuntimeError(
                        f"PDF_RESPONSE_NOT_PDF:content_type={content_type!r}:bytes={len(content)}"
                    )
                return content
        except (urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(attempt * 3)

    raise RuntimeError(f"PDF_DOWNLOAD_V2_FAILED:{last_error}")


def main() -> int:
    v1.download_pdf = download_pdf_with_first_party_context
    return v1.main()


if __name__ == "__main__":
    raise SystemExit(main())
