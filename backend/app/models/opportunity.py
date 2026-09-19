import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.seo_issue import IssueCategory, IssueSeverity
from sqlalchemy import Enum


class Opportunity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An aggregated, ranked recommendation grouping same-type issues across pages.

    `score_breakdown` stores every factor that produced `score`
    (severity_weight, affected_page_count, log_scaled_count, depth_factor,
    effort_multiplier) so the number is inspectable, never a black box.
    """

    __tablename__ = "opportunities"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )

    issue_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    severity: Mapped[IssueSeverity] = mapped_column(
        Enum(IssueSeverity, name="issue_severity", create_type=False), nullable=False
    )
    category: Mapped[IssueCategory] = mapped_column(
        Enum(IssueCategory, name="issue_category", create_type=False), nullable=False
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)

    affected_page_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)), default=list, nullable=False
    )
    affected_page_count: Mapped[int] = mapped_column(Integer, nullable=False)

    score: Mapped[float] = mapped_column(Float, nullable=False)
    score_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False)

    audit: Mapped["Audit"] = relationship(back_populates="opportunities")
