"""SSRF-safe HTTP fetching with manual redirect handling.

Every hop — including redirects — is re-validated against the SSRF blocklist
before being fetched, since an attacker-controlled server could redirect a
first, safe request toward an internal address.
"""

import time
from dataclasses import dataclass
from urllib.parse import urlsplit

import httpx

from app.crawler.normalize import InvalidURLError, normalize_url
from app.crawler.ssrf import DNSResolutionError, SSRFViolationError, assert_hostname_is_safe

MAX_REDIRECTS = 5


@dataclass
class FetchResult:
    final_url: str
    status_code: int | None
    html: str | None
    response_time_ms: int
    redirect_count: int
    error: str | None


async def safe_fetch(
    client: httpx.AsyncClient,
    start_url: str,
    *,
    timeout_seconds: float,
    max_bytes: int,
) -> FetchResult:
    current_url = start_url
    redirect_count = 0
    start = time.monotonic()

    while True:
        hostname = urlsplit(current_url).hostname
        if not hostname:
            return _error_result(current_url, redirect_count, start, "Invalid URL")

        try:
            assert_hostname_is_safe(hostname)
        except DNSResolutionError:
            return _error_result(current_url, redirect_count, start, f"Couldn't resolve host: {hostname}")
        except SSRFViolationError:
            return _error_result(
                current_url, redirect_count, start, "URL resolves to a private or restricted network address"
            )

        try:
            async with client.stream(
                "GET", current_url, follow_redirects=False, timeout=timeout_seconds
            ) as response:
                if response.is_redirect:
                    redirect_count += 1
                    if redirect_count > MAX_REDIRECTS:
                        return _error_result(current_url, redirect_count, start, "Too many redirects")

                    location = response.headers.get("location")
                    if not location:
                        return _error_result(current_url, redirect_count, start, "Redirect missing Location header")

                    try:
                        current_url = normalize_url(location, base_url=current_url)
                    except InvalidURLError as exc:
                        return _error_result(current_url, redirect_count, start, str(exc))
                    continue

                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > max_bytes:
                        break

                encoding = response.encoding or "utf-8"
                html = bytes(body).decode(encoding, errors="replace")

                return FetchResult(
                    final_url=current_url,
                    status_code=response.status_code,
                    html=html,
                    response_time_ms=_elapsed_ms(start),
                    redirect_count=redirect_count,
                    error=None,
                )
        except httpx.HTTPError as exc:
            return _error_result(current_url, redirect_count, start, f"Request failed: {exc}")


def _elapsed_ms(start: float) -> int:
    return int((time.monotonic() - start) * 1000)


def _error_result(url: str, redirect_count: int, start: float, error: str) -> FetchResult:
    return FetchResult(
        final_url=url,
        status_code=None,
        html=None,
        response_time_ms=_elapsed_ms(start),
        redirect_count=redirect_count,
        error=error,
    )
