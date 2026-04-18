from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from models.category import Category


class CategoryRepository:
    @staticmethod
    def get_by_id(db: Session, category_id: UUID) -> Category | None:
        stmt = select(Category).where(Category.id == category_id)
        return db.scalar(stmt)

    @staticmethod
    def list_categories(
        db: Session,
        flow_type: CategoryFlowType | None = None,
        active_only: bool = True,
    ) -> list[Category]:
        stmt: Select[tuple[Category]] = select(Category)

        if flow_type is not None:
            stmt = stmt.where(Category.flow_type == flow_type)

        if active_only:
            stmt = stmt.where(Category.is_active.is_(True))

        stmt = stmt.order_by(Category.sort_order.asc(), Category.name.asc())

        return list(db.scalars(stmt).all())