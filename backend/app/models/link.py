import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Link(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single hyperlink discovered during a crawl, source page -> destination.

    destination_page_id is set when the destination was itself crawled as a
    Page in this audit; otherwise destination_url still holds the resolved
    absolute URL (external site, or internal page beyond the crawl limit).
    """

    __tablename__ = "links"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    source_page_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), index=True, nullable=False
    )
    destination_page_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="SET NULL"), index=True, nullable=True
    )
    destination_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    anchor_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False)

    source_page: Mapped["Page"] = relationship(
        back_populates="outgoing_links", foreign_keys=[source_page_id]
    )
    destination_page: Mapped["Page | None"] = relationship(
        back_populates="incoming_links", foreign_keys=[destination_page_id]
    )
