from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(60), nullable=False)

    # Drives the first-run guided walkthrough: once dismissed, never shown again.
    has_seen_intro: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Keys of one-time contextual tooltips the user has dismissed (e.g.
    # "opportunities", "pages", "page-detail"), persisted per-user so they
    # never resurface across sessions or devices.
    dismissed_hints: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )

    websites: Mapped[list["Website"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
