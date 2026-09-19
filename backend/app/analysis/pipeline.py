"""Bridges the pure rules/opportunity engines to the database: loads an
audit's crawled Page and Link rows, builds the AuditContext, runs the rules,
aggregates opportunities, and persists SEOIssue + Opportunity rows.
"""

import uuid
from collections import defaultdict

from sqlalchemy.orm import Session

from app.analysis.opportunity_engine import build_opportunities
from app.analysis.rules import run_rules
from app.analysis.types import AuditContext, PageData
from app.models.audit import Audit
from app.models.link import Link
from app.models.opportunity import Opportunity
from app.models.page import Page
from app.models.seo_issue import SEOIssue


def _to_page_data(page: Page) -> PageData:
    return PageData(
        id=page.id,
        url=page.url,
        status_code=page.status_code,
        crawl_depth=page.crawl_depth,
        response_time_ms=page.response_time_ms,
        redirect_count=page.redirect_count,
        canonical_url=page.canonical_url,
        title=page.title,
        meta_description=page.meta_description,
        h1s=page.h1s,
        h2s=page.h2s,
        word_count=page.word_count,
        images=page.images,
        internal_link_count=page.internal_link_count,
        external_link_count=page.external_link_count,
        is_indexable=page.is_indexable,
        robots_meta=page.robots_meta,
        fetch_error=page.fetch_error,
    )


def build_audit_context(pages: list[Page], links: list[Link]) -> AuditContext:
    page_data = [_to_page_data(p) for p in pages]
    pages_by_id = {p.id: p for p in page_data}

    incoming_counts: dict[uuid.UUID, int] = defaultdict(int)
    broken_targets: dict[uuid.UUID, list[str]] = defaultdict(list)

    for link in links:
        if not link.is_internal:
            continue

        if link.destination_page_id is not None and link.destination_page_id in pages_by_id:
            incoming_counts[link.destination_page_id] += 1

            destination = pages_by_id[link.destination_page_id]
            if not destination.is_success:
                broken_targets[link.source_page_id].append(link.destination_url)
        else:
            # Internal link whose destination was never crawled (beyond the
            # page cap, or fetch failed before a Page row existed) — treat
            # as broken from the source page's perspective.
            broken_targets[link.source_page_id].append(link.destination_url)

    return AuditContext(
        pages=page_data,
        incoming_internal_link_counts=dict(incoming_counts),
        broken_internal_link_targets=dict(broken_targets),
    )


def run_analysis(db: Session, audit: Audit) -> None:
    pages = db.query(Page).filter(Page.audit_id == audit.id).all()
    links = db.query(Link).filter(Link.audit_id == audit.id).all()

    context = build_audit_context(pages, links)
    issue_drafts = run_rules(context)

    for draft in issue_drafts:
        db.add(
            SEOIssue(
                audit_id=audit.id,
                page_id=draft.page_id,
                issue_type=draft.issue_type,
                severity=draft.severity,
                category=draft.category,
                explanation=draft.explanation,
                recommended_action=draft.recommended_action,
            )
        )

    pages_by_id = {p.id: p for p in context.pages}
    opportunity_drafts = build_opportunities(issue_drafts, pages_by_id, total_page_count=len(pages))

    for draft in opportunity_drafts:
        db.add(
            Opportunity(
                audit_id=audit.id,
                issue_type=draft.issue_type,
                severity=draft.severity,
                category=draft.category,
                title=draft.title,
                explanation=draft.explanation,
                recommended_action=draft.recommended_action,
                affected_page_ids=draft.affected_page_ids,
                affected_page_count=draft.affected_page_count,
                score=draft.score,
                score_breakdown=draft.score_breakdown,
            )
        )

    db.commit()
