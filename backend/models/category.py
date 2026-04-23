from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, Enum, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enums import CategoryFlowType
from db.base import Base
from utils.dates import get_now


def enum_values(enum_cls):
    return [item.value for item in enum_cls]


class Category(Base):
    __tablename__ = "categories"

    __table_args__ = (
        UniqueConstraint("user_id", "slug", "flow_type", name="uq_categories_user_slug_flow"),
        CheckConstraint(r"color_hex ~ '^#[0-9A-Fa-f]{6}$'", name="chk_categories_color_hex"),
        Index("idx_categories_flow_active", "flow_type", "is_active"),
        Index("idx_categories_user_active", "user_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    flow_type: Mapped[CategoryFlowType] = mapped_column(
        Enum(
            CategoryFlowType,
            name="category_flow_type",
            create_type=False,
            values_callable=enum_values,
        ),
        nullable=False,
    )
    icon_key: Mapped[str] = mapped_column(String(50), nullable=False)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        default=get_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=get_now,
        onupdate=get_now,
        nullable=False,
    )

    user: Mapped["User | None"] = relationship("User", back_populates="categories")
    budgets: Mapped[list["Budget"]] = relationship("Budget", back_populates="category")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="category")
    suggested_drafts: Mapped[list["SmartInputDraft"]] = relationship(
        "SmartInputDraft",
        back_populates="suggested_category",
    )