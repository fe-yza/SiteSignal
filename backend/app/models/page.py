import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Page(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pages"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )

    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    crawl_depth: Mapped[int] = mapped_column(Integer, nullable=False)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    redirect_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    canonical_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    h1s: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    h2s: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # [{"src": "...", "alt": "..." | null}, ...]
    images: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)

    internal_link_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    external_link_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_indexable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    robots_meta: Mapped[str | None] = mapped_column(String(255), nullable=True)

    fetch_error: Mapped[str | None] = mapped_column(String(500), nullable=True)

    audit: Mapped["Audit"] = relationship(back_populates="pages")
    issues: Mapped[list["SEOIssue"]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
    outgoing_links: Mapped[list["Link"]] = relationship(
        back_populates="source_page",
        foreign_keys="Link.source_page_id",
        cascade="all, delete-orphan",
    )
    incoming_links: Mapped[list["Link"]] = relationship(
        back_populates="destination_page",
        foreign_keys="Link.destination_page_id",
    )
