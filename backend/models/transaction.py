from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, CheckConstraint, Enum, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enums import TransactionSource, TransactionType
from db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="chk_transactions_amount_positive"),
        CheckConstraint("length(btrim(description)) > 0", name="chk_transactions_description_not_blank"),
        CheckConstraint(r"currency_code ~ '^[A-Z]{3}$'", name="chk_transactions_currency_code"),
        Index("idx_transactions_user_date", "user_id", "transaction_date"),
        Index("idx_transactions_user_type_date", "user_id", "type", "transaction_date"),
        Index("idx_transactions_user_category_date", "user_id", "category_id", "transaction_date"),
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
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type", create_type=False),
        nullable=False,
    )
    amount_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="VND")
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    transaction_date: Mapped[date] = mapped_column(nullable=False)
    source: Mapped[TransactionSource] = mapped_column(
        Enum(TransactionSource, name="transaction_source", create_type=False),
        nullable=False,
        default=TransactionSource.MANUAL,
    )
    smart_input_draft_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("smart_input_drafts.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="transactions")
    category: Mapped["Category"] = relationship("Category", back_populates="transactions")