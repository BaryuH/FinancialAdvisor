from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Goal(Base):
    __tablename__ = "goals"

    __table_args__ = (
        CheckConstraint("target_minor > 0", name="chk_goals_target_positive"),
        CheckConstraint("current_minor >= 0", name="chk_goals_current_non_negative"),
        CheckConstraint("current_minor <= target_minor", name="chk_goals_current_not_exceed_target"),
        Index("idx_goals_user_deadline", "user_id", "deadline"),
        Index("idx_goals_user_completed_at", "user_id", "completed_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    target_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    current_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    deadline: Mapped[date] = mapped_column(nullable=False)
    icon_key: Mapped[str] = mapped_column(String(50), nullable=False, default="target")
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="goals")