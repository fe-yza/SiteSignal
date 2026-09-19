import uuid

from pydantic import BaseModel


class InternalLinkSummary(BaseModel):
    page_id: uuid.UUID
    url: str
    incoming_count: int
    outgoing_count: int
    few_incoming_links: bool
