from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from db.session import get_db
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
) -> CategoryListResponse:
    items = CategoryService.list_categories(
        db=db,
        flow_type=flow_type,
        active_only=active_only,
    )
    return CategoryListResponse(items=items)