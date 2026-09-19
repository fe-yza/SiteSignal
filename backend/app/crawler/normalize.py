"""URL normalization shared by "add website" and the crawler itself."""

from urllib.parse import urljoin, urlsplit, urlunsplit

ALLOWED_SCHEMES = {"http", "https"}
DEFAULT_PORTS = {"http": 80, "https": 443}


class InvalidURLError(ValueError):
    pass


def normalize_url(raw_url: str, *, base_url: str | None = None) -> str:
    """Normalize a URL to a canonical absolute form.

    - Resolves relative URLs against base_url (for links found during a crawl).
    - Lowercases scheme and host.
    - Strips the fragment.
    - Strips the default port for the scheme (":80" on http, ":443" on https).
    - Rejects embedded credentials (user:pass@host).
    - Rejects anything that isn't http(s).
    """
    candidate = urljoin(base_url, raw_url) if base_url else raw_url
    parts = urlsplit(candidate.strip())

    scheme = parts.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise InvalidURLError(f"Unsupported URL scheme: {scheme or '(none)'}")

    if parts.username or parts.password:
        raise InvalidURLError("URLs with embedded credentials are not allowed")

    if not parts.hostname:
        raise InvalidURLError("URL is missing a host")

    host = parts.hostname.lower()
    port = parts.port
    netloc = host if (port is None or port == DEFAULT_PORTS[scheme]) else f"{host}:{port}"

    path = parts.path or "/"

    return urlunsplit((scheme, netloc, path, parts.query, ""))


def extract_domain(url: str) -> str:
    return urlsplit(url).hostname or ""
