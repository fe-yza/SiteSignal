import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.seo_issue import SEOIssueRead


class PageSummary(BaseModel):
    id: uuid.UUID
    url: str
    status_code: int | None
    title: str | None
    word_count: int
    crawl_depth: int
    is_indexable: bool
    internal_link_count: int
    external_link_count: int
    issue_count: int

    model_config = {"from_attributes": True}


class PageDetail(BaseModel):
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
    created_at: datetime

    incoming_internal_link_count: int
    issues: list[SEOIssueRead]

    model_config = {"from_attributes": True}
