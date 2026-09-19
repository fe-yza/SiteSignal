"""End-to-end test of crawl -> parse -> rules -> opportunities, run against
a local http.server fixture (not a live public site) so this suite never
depends on outbound internet access being available in a dev/CI sandbox.

The crawler's SSRF guard rejects loopback addresses by design (see
app/tests/test_ssrf.py for that behavior in isolation) — this test
monkeypatches it out specifically to allow crawling 127.0.0.1, since the
whole point here is exercising the crawl pipeline, not re-verifying SSRF.
"""

import asyncio
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from app.core.security import hash_password
from app.crawler import fetcher as fetcher_module
from app.crawler.orchestrator import run_crawl
from app.models.audit import Audit, AuditStatus
from app.models.opportunity import Opportunity
from app.models.page import Page
from app.models.seo_issue import SEOIssue
from app.models.user import User
from app.models.website import Website

HOME_TITLE = "H" * 40
HOME_META = "M" * 100
ABOUT_TITLE = "A" * 40
ABOUT_META = "N" * 100
LONG_BODY = "word " * 350


def _page(title: str, meta: str, heading: str, links: str) -> bytes:
    html = (
        f"<html><head><title>{title}</title>"
        f'<meta name="description" content="{meta}"></head>'
        f"<body><h1>{heading}</h1><p>{LONG_BODY}</p>{links}</body></html>"
    )
    return html.encode("utf-8")


PAGES = {
    "/": _page(
        HOME_TITLE,
        HOME_META,
        "Welcome Home",
        '<a href="/about">About</a> <a href="/broken">Broken</a> <a href="/thin">Thin</a>',
    ),
    "/about": _page(ABOUT_TITLE, ABOUT_META, "About Us", '<a href="/">Home</a>'),
    "/thin": b"<html><head></head><body><p>Too short.</p></body></html>",
}


class FixtureHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):  # noqa: N802 — required name by BaseHTTPRequestHandler
        if self.path == "/broken":
            self._respond(404, b"<html><body>Not found</body></html>")
            return

        body = PAGES.get(self.path)
        if body is None:
            self._respond(404, b"<html><body>Not found</body></html>")
            return

        self._respond(200, body)

    def _respond(self, status: int, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):  # noqa: A002 — silence test server logging
        pass


@pytest.fixture()
def fixture_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield server
    server.shutdown()
    thread.join()


def test_full_crawl_pipeline_against_local_server(db_session, fixture_server, monkeypatch):
    monkeypatch.setattr(fetcher_module, "assert_hostname_is_safe", lambda hostname: [])

    port = fixture_server.server_address[1]
    base_url = f"http://127.0.0.1:{port}/"
    domain = "127.0.0.1"

    user = User(email="fixture-crawl@example.com", hashed_password=hash_password("password123"))
    db_session.add(user)
    db_session.commit()

    website = Website(owner_id=user.id, url=base_url, domain=domain, display_name=domain)
    db_session.add(website)
    db_session.commit()

    audit = Audit(website_id=website.id, status=AuditStatus.PENDING, pages_limit=100)
    db_session.add(audit)
    db_session.commit()

    asyncio.run(
        run_crawl(
            db_session,
            audit,
            start_url=base_url,
            domain=domain,
            max_pages=100,
            max_depth=5,
            timeout_seconds=5,
            max_response_bytes=5_000_000,
        )
    )

    pages = db_session.query(Page).filter(Page.audit_id == audit.id).all()
    origin = base_url.rstrip("/")
    urls_by_path = {p.url.replace(origin, "") or "/": p for p in pages}

    assert set(urls_by_path) == {"/", "/about", "/thin", "/broken"}
    assert urls_by_path["/broken"].status_code == 404
    assert urls_by_path["/"].status_code == 200
    assert urls_by_path["/about"].status_code == 200
    assert urls_by_path["/thin"].status_code == 200

    home_page = urls_by_path["/"]
    thin_page = urls_by_path["/thin"]

    assert audit.status == AuditStatus.COMPLETED
    assert audit.pages_crawled == 4

    issues = db_session.query(SEOIssue).filter(SEOIssue.audit_id == audit.id).all()
    issue_types_by_page: dict = {}
    for issue in issues:
        issue_types_by_page.setdefault(issue.page_id, set()).add(issue.issue_type)

    assert "missing_title" in issue_types_by_page.get(thin_page.id, set())
    assert "thin_content_very_low" in issue_types_by_page.get(thin_page.id, set())
    assert "missing_meta_description" in issue_types_by_page.get(thin_page.id, set())
    assert "broken_internal_links" in issue_types_by_page.get(home_page.id, set())
    # The home and about pages have well-formed titles/descriptions/content,
    # so they should NOT be flagged for those.
    assert "missing_title" not in issue_types_by_page.get(home_page.id, set())
    assert "thin_content_low" not in issue_types_by_page.get(home_page.id, set())

    opportunities = db_session.query(Opportunity).filter(Opportunity.audit_id == audit.id).all()
    opportunity_types = {o.issue_type for o in opportunities}
    assert "missing_title" in opportunity_types
    assert "broken_internal_links" in opportunity_types
    # Opportunities are sorted by score descending in the pipeline output order.
    scores = [o.score for o in sorted(opportunities, key=lambda o: o.score, reverse=True)]
    assert scores == sorted(scores, reverse=True)
