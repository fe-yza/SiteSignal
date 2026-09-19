import pytest

from app.crawler.normalize import InvalidURLError, extract_domain, normalize_url


def test_lowercases_scheme_and_host():
    assert normalize_url("HTTPS://Example.COM/Path") == "https://example.com/Path"


def test_strips_fragment():
    assert normalize_url("https://example.com/page#section") == "https://example.com/page"


def test_strips_default_https_port():
    assert normalize_url("https://example.com:443/page") == "https://example.com/page"


def test_strips_default_http_port():
    assert normalize_url("http://example.com:80/page") == "http://example.com/page"


def test_keeps_non_default_port():
    assert normalize_url("https://example.com:8443/page") == "https://example.com:8443/page"


def test_adds_root_path_when_missing():
    assert normalize_url("https://example.com") == "https://example.com/"


def test_keeps_query_string():
    assert normalize_url("https://example.com/page?x=1") == "https://example.com/page?x=1"


def test_rejects_embedded_credentials():
    with pytest.raises(InvalidURLError):
        normalize_url("https://user:pass@example.com/")


def test_rejects_non_http_scheme():
    with pytest.raises(InvalidURLError):
        normalize_url("ftp://example.com/")


def test_rejects_missing_scheme():
    with pytest.raises(InvalidURLError):
        normalize_url("example.com/page")


def test_rejects_missing_host():
    with pytest.raises(InvalidURLError):
        normalize_url("https:///path")


def test_resolves_relative_url_against_base():
    assert normalize_url("/about", base_url="https://example.com/home") == "https://example.com/about"


def test_resolves_relative_url_with_dot_segments():
    assert (
        normalize_url("../about", base_url="https://example.com/blog/post")
        == "https://example.com/about"
    )


def test_extract_domain():
    assert extract_domain("https://example.com/page") == "example.com"
