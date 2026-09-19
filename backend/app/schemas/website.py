import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WebsiteCreate(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class WebsiteRead(BaseModel):
    id: uuid.UUID
    url: str
    domain: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}
