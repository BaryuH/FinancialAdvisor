from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.category import CategoryListResponse
from services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get(
    "",
    response_model=CategoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get category list",
)
def list_categories(
    flow_type: CategoryFlowType | None = Query(default=None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryListResponse:
    items = CategoryService.list_categories(
        db=db,
        user_id=current_user.id,
        flow_type=flow_type,
        active_only=active_only,
    )
    return CategoryListResponse(items=items)