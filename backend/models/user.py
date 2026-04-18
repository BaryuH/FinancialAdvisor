from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False,
    )

    categories: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    smart_input_drafts: Mapped[list["SmartInputDraft"]] = relationship(
        "SmartInputDraft",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )