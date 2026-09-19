import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class IssueSeverity(str, enum.Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    OPPORTUNITY = "opportunity"


class IssueCategory(str, enum.Enum):
    TECHNICAL = "technical"
    ON_PAGE = "on_page"
    CONTENT = "content"
    INTERNAL_LINKING = "internal_linking"
    INDEXABILITY = "indexability"


class SEOIssue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "seo_issues"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Stable machine key grouping issues into an Opportunity, e.g. "missing_title".
    issue_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    severity: Mapped[IssueSeverity] = mapped_column(
        Enum(IssueSeverity, name="issue_severity"), nullable=False
    )
    category: Mapped[IssueCategory] = mapped_column(
        Enum(IssueCategory, name="issue_category"), nullable=False
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)

    audit: Mapped["Audit"] = relationship(back_populates="issues")
    page: Mapped["Page"] = relationship(back_populates="issues")
