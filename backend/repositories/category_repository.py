from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, or_, select
from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from models.category import Category


class CategoryRepository:
    @staticmethod
    def get_accessible_by_id(
        db: Session,
        *,
        user_id: UUID,
        category_id: UUID,
    ) -> Category | None:
        stmt = (
            select(Category)
            .where(
                Category.id == category_id,
                or_(
                    Category.user_id.is_(None),
                    Category.user_id == user_id,
                ),
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def list_categories(
        db: Session,
        *,
        user_id: UUID,
        flow_type: CategoryFlowType | None = None,
        active_only: bool = True,
    ) -> list[Category]:
        stmt: Select[tuple[Category]] = (
            select(Category)
            .where(
                or_(
                    Category.user_id.is_(None),
                    Category.user_id == user_id,
                )
            )
        )

        if flow_type is not None:
            stmt = stmt.where(Category.flow_type == flow_type)

        if active_only:
            stmt = stmt.where(Category.is_active.is_(True))

        stmt = stmt.order_by(
            Category.is_system.desc(),
            Category.sort_order.asc(),
            Category.name.asc(),
        )

        return list(db.scalars(stmt).all())