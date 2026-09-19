import uuid

from pydantic import BaseModel

from app.models.seo_issue import IssueCategory, IssueSeverity


class OpportunityRead(BaseModel):
    id: uuid.UUID
    issue_type: str
    severity: IssueSeverity
    category: IssueCategory
    title: str
    explanation: str
    recommended_action: str
    affected_page_ids: list[uuid.UUID]
    affected_page_count: int
    score: float
    score_breakdown: dict

    model_config = {"from_attributes": True}
