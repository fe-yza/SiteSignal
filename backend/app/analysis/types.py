import uuid
from dataclasses import dataclass, field

from app.models.seo_issue import IssueCategory, IssueSeverity


@dataclass(frozen=True)
class PageData:
    """Plain snapshot of a Page row, so rules stay pure functions that don't
    touch the ORM/session and are trivial to unit test in isolation."""

    id: uuid.UUID
    url: str
    status_code: int | None
    crawl_depth: int
    response_time_ms: int | None
    redirect_count: int
    canonical_url: str | None
    title: str | None
    meta_description: str | None
    h1s: list[str]
    h2s: list[str]
    word_count: int
    images: list[dict]
    internal_link_count: int
    external_link_count: int
    is_indexable: bool
    robots_meta: str | None
    fetch_error: str | None

    @property
    def is_success(self) -> bool:
        return self.status_code is not None and 200 <= self.status_code < 300


@dataclass(frozen=True)
class AuditContext:
    """Audit-wide data a single-page rule can't compute on its own, e.g.
    duplicate detection across pages or the internal link graph."""

    pages: list[PageData]
    # page_id -> count of internal Link rows whose destination is that page
    incoming_internal_link_counts: dict[uuid.UUID, int] = field(default_factory=dict)
    # page_id -> destination URLs this page links to internally that are broken
    # (destination page has a non-2xx final status or failed to fetch)
    broken_internal_link_targets: dict[uuid.UUID, list[str]] = field(default_factory=dict)


@dataclass(frozen=True)
class IssueDraft:
    page_id: uuid.UUID
    issue_type: str
    severity: IssueSeverity
    category: IssueCategory
    explanation: str
    recommended_action: str
