"""BFS crawl orchestrator: fetches pages breadth-first from a starting URL,
staying on the same domain, up to a page/depth cap, and persists Page and
Link rows as it goes so audit progress can be polled live.

Invoked today via FastAPI BackgroundTasks (run_audit_task is a plain sync
entrypoint so it can run in a threadpool without an extra process). To swap
to Celery/Redis later, point a Celery task at run_audit_task unchanged —
nothing in run_crawl or below depends on how it was scheduled.
"""

import asyncio
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.crawler.fetcher import safe_fetch
from app.crawler.normalize import InvalidURLError, extract_domain, normalize_url
from app.crawler.parser import parse_html
from app.db.session import SessionLocal
from app.models.audit import Audit, AuditStatus
from app.models.link import Link
from app.models.page import Page

USER_AGENT = "SiteSignalBot/1.0 (+https://github.com/sitesignal; SEO audit crawler)"


@dataclass
class _PendingLink:
    source_url: str
    destination_url: str
    anchor_text: str | None
    is_internal: bool


async def run_crawl(
    db: Session,
    audit: Audit,
    *,
    start_url: str,
    domain: str,
    max_pages: int,
    max_depth: int,
    timeout_seconds: float,
    max_response_bytes: int,
) -> None:
    audit.status = AuditStatus.CRAWLING
    audit.started_at = datetime.now(timezone.utc)
    db.add(audit)
    db.commit()

    visited: set[str] = set()
    queued: set[str] = {start_url}
    queue: deque[tuple[str, int]] = deque([(start_url, 0)])
    url_to_page: dict[str, Page] = {}
    pending_links: list[_PendingLink] = []

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        while queue and len(visited) < max_pages:
            url, depth = queue.popleft()
            if url in visited:
                continue
            visited.add(url)

            result = await safe_fetch(
                client, url, timeout_seconds=timeout_seconds, max_bytes=max_response_bytes
            )

            page = Page(
                audit_id=audit.id,
                url=url,
                status_code=result.status_code,
                crawl_depth=depth,
                response_time_ms=result.response_time_ms,
                redirect_count=result.redirect_count,
                fetch_error=result.error,
            )

            is_success = result.status_code is not None and 200 <= result.status_code < 300
            if is_success and result.html:
                parsed = parse_html(result.html)
                page.title = parsed.title
                page.meta_description = parsed.meta_description
                page.h1s = parsed.h1s
                page.h2s = parsed.h2s
                page.word_count = parsed.word_count
                page.canonical_url = parsed.canonical_url
                page.robots_meta = parsed.robots_meta
                page.is_indexable = parsed.is_indexable
                page.images = parsed.images

                internal_count = 0
                external_count = 0
                for link in parsed.links:
                    try:
                        dest_url = normalize_url(link.href, base_url=url)
                    except InvalidURLError:
                        continue

                    is_internal = extract_domain(dest_url) == domain
                    if is_internal:
                        internal_count += 1
                        can_queue = (
                            dest_url not in queued
                            and len(queued) < max_pages
                            and depth + 1 <= max_depth
                        )
                        if can_queue:
                            queued.add(dest_url)
                            queue.append((dest_url, depth + 1))
                    else:
                        external_count += 1

                    pending_links.append(
                        _PendingLink(
                            source_url=url,
                            destination_url=dest_url,
                            anchor_text=link.anchor_text,
                            is_internal=is_internal,
                        )
                    )

                page.internal_link_count = internal_count
                page.external_link_count = external_count

            db.add(page)
            db.commit()
            db.refresh(page)
            url_to_page[url] = page

            audit.pages_crawled = len(visited)
            db.add(audit)
            db.commit()

    audit.status = AuditStatus.ANALYZING
    db.add(audit)
    db.commit()

    for pending in pending_links:
        source_page = url_to_page.get(pending.source_url)
        if source_page is None:
            continue
        destination_page = url_to_page.get(pending.destination_url)
        db.add(
            Link(
                audit_id=audit.id,
                source_page_id=source_page.id,
                destination_page_id=destination_page.id if destination_page else None,
                destination_url=pending.destination_url,
                anchor_text=pending.anchor_text,
                is_internal=pending.is_internal,
            )
        )
    db.commit()

    from app.analysis.pipeline import run_analysis

    run_analysis(db, audit)

    audit.status = AuditStatus.COMPLETED
    audit.completed_at = datetime.now(timezone.utc)
    db.add(audit)
    db.commit()


def run_audit_task(audit_id, start_url: str, domain: str) -> None:
    """Sync entrypoint for FastAPI BackgroundTasks (runs in a threadpool)."""
    settings = get_settings()
    db = SessionLocal()
    try:
        audit = db.get(Audit, audit_id)
        if audit is None:
            return
        try:
            asyncio.run(
                run_crawl(
                    db,
                    audit,
                    start_url=start_url,
                    domain=domain,
                    max_pages=settings.crawl_max_pages,
                    max_depth=settings.crawl_max_depth,
                    timeout_seconds=settings.crawl_timeout_seconds,
                    max_response_bytes=settings.crawl_max_response_bytes,
                )
            )
        except Exception as exc:  # noqa: BLE001 — crawl failures must not crash the worker
            db.rollback()
            audit = db.get(Audit, audit_id)
            if audit is not None:
                audit.status = AuditStatus.FAILED
                audit.error_message = str(exc)[:1000]
                db.add(audit)
                db.commit()
    finally:
        db.close()
