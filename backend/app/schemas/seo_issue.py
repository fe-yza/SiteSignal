import uuid

from pydantic import BaseModel

from app.models.seo_issue import IssueCategory, IssueSeverity


class SEOIssueRead(BaseModel):
    id: uuid.UUID
    page_id: uuid.UUID
    issue_type: str
    severity: IssueSeverity
    category: IssueCategory
    explanation: str
    recommended_action: str

    model_config = {"from_attributes": True}


class SEOIssueWithPage(SEOIssueRead):
    page_url: str
