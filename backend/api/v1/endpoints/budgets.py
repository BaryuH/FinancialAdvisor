from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.budget import BudgetCreate, BudgetItemResponse, BudgetListResponse, BudgetUpdate
from services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get(
    "",
    response_model=BudgetListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get budgets by month",
)
def list_budgets(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetListResponse:
    return BudgetService.list_budgets(
        db,
        current_user=current_user,
        month=month,
    )


@router.post(
    "",
    response_model=BudgetItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a budget",
)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetItemResponse:
    return BudgetService.create_budget(
        db,
        current_user=current_user,
        payload=payload,
    )


@router.patch(
    "/{budget_id}",
    response_model=BudgetItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a budget",
)
def update_budget(
    budget_id: UUID,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetItemResponse:
    return BudgetService.update_budget(
        db,
        current_user=current_user,
        budget_id=budget_id,
        payload=payload,
    )


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a budget",
)
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    BudgetService.delete_budget(
        db,
        current_user=current_user,
        budget_id=budget_id,
    )