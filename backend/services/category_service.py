from __future__ import annotations

from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from models.category import Category
from repositories.category_repository import CategoryRepository


class CategoryService:
    @staticmethod
    def list_categories(
        db: Session,
        flow_type: CategoryFlowType | None = None,
        active_only: bool = True,
    ) -> list[Category]:
        return CategoryRepository.list_categories(
            db=db,
            flow_type=flow_type,
            active_only=active_only,
        )