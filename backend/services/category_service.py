from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from models.category import Category
from repositories.category_repository import CategoryRepository


class CategoryService:
    @staticmethod
    def list_categories(
        db: Session,
        *,
        user_id: UUID,
        flow_type: CategoryFlowType | None = None,
        active_only: bool = True,
    ) -> list[Category]:
        return CategoryRepository.list_categories(
            db=db,
            user_id=user_id,
            flow_type=flow_type,
            active_only=active_only,
        )