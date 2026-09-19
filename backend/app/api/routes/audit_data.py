import uuid
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.analysis.thresholds import FEW_INCOMING_LINKS_THRESHOLD
from app.api.deps import get_current_user, get_owned_audit
from app.db.session import get_db
from app.models.link import Link
from app.models.opportunity import Opportunity
from app.models.page import Page
from app.models.seo_issue import IssueSeverity, SEOIssue
from app.models.user import User
from app.schemas.link import InternalLinkSummary
from app.schemas.opportunity import OpportunityRead
from app.schemas.page import PageDetail, PageSummary
from app.schemas.seo_issue import SEOIssueRead, SEOIssueWithPage

router = APIRouter(prefix="/api/websites/{website_id}/audits/{audit_id}", tags=["audit-data"])

# Critical > Warning > Opportunity for default list ordering — mirrors the
# same priority ordering used by the opportunity engine's severity weights.
SEVERITY_RANK = {IssueSeverity.CRITICAL: 0, IssueSeverity.WARNING: 1, IssueSeverity.OPPORTUNITY: 2}


@router.get("/pages", response_model=list[PageSummary])
def list_pages(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PageSummary]:
    audit = get_owned_audit(website_id, audit_id, current_user, db)
    pages = (
        db.query(Page).filter(Page.audit_id == audit.id).order_by(Page.crawl_depth, Page.url).all()
    )

    issue_counts: dict[uuid.UUID, int] = defaultdict(int)
    for (page_id,) in db.query(SEOIssue.page_id).filter(SEOIssue.audit_id == audit.id).all():
        issue_counts[page_id] += 1

    return [
        PageSummary(
            id=p.id,
            url=p.url,
            status_code=p.status_code,
            title=p.title,
            word_count=p.word_count,
            crawl_depth=p.crawl_depth,
            is_indexable=p.is_indexable,
            internal_link_count=p.internal_link_count,
            external_link_count=p.external_link_count,
            issue_count=issue_counts.get(p.id, 0),
        )
        for p in pages
    ]


@router.get("/pages/{page_id}", response_model=PageDetail)
def get_page(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PageDetail:
    audit = get_owned_audit(website_id, audit_id, current_user, db)
    page = db.query(Page).filter(Page.id == page_id, Page.audit_id == audit.id).first()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")

    issues = db.query(SEOIssue).filter(SEOIssue.page_id == page.id).all()
    issues.sort(key=lambda i: SEVERITY_RANK[i.severity])

    incoming_count = (
        db.query(Link)
        .filter(Link.destination_page_id == page.id, Link.is_internal.is_(True))
        .count()
    )

    return PageDetail(
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
        created_at=page.created_at,
        incoming_internal_link_count=incoming_count,
        issues=[SEOIssueRead.model_validate(i) for i in issues],
    )


@router.get("/issues", response_model=list[SEOIssueWithPage])
def list_issues(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SEOIssueWithPage]:
    audit = get_owned_audit(website_id, audit_id, current_user, db)
    rows = (
        db.query(SEOIssue, Page.url)
        .join(Page, Page.id == SEOIssue.page_id)
        .filter(SEOIssue.audit_id == audit.id)
        .all()
    )
    rows.sort(key=lambda row: (SEVERITY_RANK[row[0].severity], row[1]))

    return [
        SEOIssueWithPage(
            id=issue.id,
            page_id=issue.page_id,
            issue_type=issue.issue_type,
            severity=issue.severity,
            category=issue.category,
            explanation=issue.explanation,
            recommended_action=issue.recommended_action,
            page_url=page_url,
        )
        for issue, page_url in rows
    ]


@router.get("/opportunities", response_model=list[OpportunityRead])
def list_opportunities(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OpportunityRead]:
    audit = get_owned_audit(website_id, audit_id, current_user, db)
    opportunities = (
        db.query(Opportunity).filter(Opportunity.audit_id == audit.id).order_by(Opportunity.score.desc()).all()
    )
    return [OpportunityRead.model_validate(o) for o in opportunities]


@router.get("/internal-links", response_model=list[InternalLinkSummary])
def list_internal_links(
    website_id: uuid.UUID,
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InternalLinkSummary]:
    audit = get_owned_audit(website_id, audit_id, current_user, db)
    pages = db.query(Page).filter(Page.audit_id == audit.id).all()

    incoming: dict[uuid.UUID, int] = defaultdict(int)
    destination_ids = (
        db.query(Link.destination_page_id)
        .filter(
            Link.audit_id == audit.id,
            Link.is_internal.is_(True),
            Link.destination_page_id.isnot(None),
        )
        .all()
    )
    for (dest_id,) in destination_ids:
        incoming[dest_id] += 1

    return [
        InternalLinkSummary(
            page_id=p.id,
            url=p.url,
            incoming_count=incoming.get(p.id, 0),
            outgoing_count=p.internal_link_count,
            few_incoming_links=(
                p.crawl_depth > 0 and incoming.get(p.id, 0) < FEW_INCOMING_LINKS_THRESHOLD
            ),
        )
        for p in pages
    ]
