from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, SmallInteger, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enums import SmartInputMode, SmartInputStatus, TransactionType
from db.base import Base


def enum_values(enum_cls):
    return [item.value for item in enum_cls]


class SmartInputDraft(Base):
    __tablename__ = "smart_input_drafts"

    __table_args__ = (
        CheckConstraint(
            "parsed_amount_minor IS NULL OR parsed_amount_minor > 0",
            name="chk_drafts_amount_positive",
        ),
        CheckConstraint(
            "confidence_percent IS NULL OR confidence_percent BETWEEN 0 AND 100",
            name="chk_drafts_confidence_range",
        ),
        UniqueConstraint("confirmed_transaction_id", name="uq_drafts_confirmed_transaction"),
        Index("idx_drafts_user_status_created_at", "user_id", "status", "created_at"),
        Index("idx_drafts_user_mode_created_at", "user_id", "mode", "created_at"),
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
    mode: Mapped[SmartInputMode] = mapped_column(
        Enum(
            SmartInputMode,
            name="smart_input_mode",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    status: Mapped[SmartInputStatus] = mapped_column(
        Enum(
            SmartInputStatus,
            name="smart_input_status",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    raw_text: Mapped[str | None] = mapped_column(nullable=True)
    source_file_ref: Mapped[str | None] = mapped_column(nullable=True)
    parsed_type: Mapped[TransactionType | None] = mapped_column(
        Enum(
            TransactionType,
            name="transaction_type",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=True,
    )
    parsed_amount_minor: Mapped[int | None] = mapped_column(nullable=True)
    parsed_description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    suggested_category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    merchant_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    confidence_percent: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    parser_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confirmed_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True,
    )
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="smart_input_drafts")
    suggested_category: Mapped["Category | None"] = relationship(
        "Category",
        back_populates="suggested_drafts",
    )