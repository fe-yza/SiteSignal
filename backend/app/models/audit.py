import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AuditStatus(str, enum.Enum):
    PENDING = "pending"
    CRAWLING = "crawling"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class Audit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One row per crawl run. Never overwritten, so audit history accumulates."""

    __tablename__ = "audits"

    website_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus, name="audit_status"), default=AuditStatus.PENDING, nullable=False
    )
    pages_crawled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pages_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    website: Mapped["Website"] = relationship(back_populates="audits")
    pages: Mapped[list["Page"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    issues: Mapped[list["SEOIssue"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    opportunities: Mapped[list["Opportunity"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
