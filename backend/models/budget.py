from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Budget(Base):
    __tablename__ = "budgets"

    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "budget_month", name="uq_budgets_user_category_month"),
        CheckConstraint("limit_minor > 0", name="chk_budgets_limit_positive"),
        CheckConstraint(
            "budget_month = date_trunc('month', budget_month)::date",
            name="chk_budgets_month_first_day",
        ),
        Index("idx_budgets_user_month", "user_id", "budget_month"),
        Index("idx_budgets_user_month_category", "user_id", "budget_month", "category_id"),
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
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    budget_month: Mapped[date] = mapped_column(nullable=False)
    limit_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="budgets")
    category: Mapped["Category"] = relationship("Category", back_populates="budgets")