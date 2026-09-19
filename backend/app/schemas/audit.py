import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.audit import AuditStatus


class AuditRead(BaseModel):
    id: uuid.UUID
    website_id: uuid.UUID
    status: AuditStatus
    pages_crawled: int
    pages_limit: int
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
