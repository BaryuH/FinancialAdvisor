from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.enums import CategoryFlowType
from models.budget import Budget
from repositories.budget_repository import BudgetRepository
from repositories.category_repository import CategoryRepository
from schemas.budget import (
    BudgetCreate,
    BudgetItemResponse,
    BudgetListResponse,
    BudgetMonthSummary,
    BudgetUpdate,
)
from utils.dates import format_year_month, get_month_date_range, parse_year_month


class BudgetService:
    @staticmethod
    def list_budgets(db: Session, month: str) -> BudgetListResponse:
        budget_month = BudgetService._parse_month_or_raise(month)
        user_id = BudgetRepository.get_or_create_demo_user_id(db)

        budgets = BudgetRepository.list_by_month(
            db=db,
            user_id=user_id,
            budget_month=budget_month,
        )

        month_start, month_end = get_month_date_range(budget_month)
        spent_map = BudgetRepository.get_spent_map_for_month(
            db=db,
            user_id=user_id,
            month_start=month_start,
            month_end=month_end,
        )

        items = [
            BudgetService._to_budget_item_response(budget, spent_map.get(budget.category_id, 0))
            for budget in budgets
        ]

        total_limit_minor = sum(item.limit_minor for item in items)
        total_spent_minor = sum(item.spent_minor for item in items)
        remaining_minor = total_limit_minor - total_spent_minor
        usage_percent = round((total_spent_minor / total_limit_minor) * 100, 2) if total_limit_minor > 0 else 0.0

        return BudgetListResponse(
            month=format_year_month(budget_month),
            summary=BudgetMonthSummary(
                total_limit_minor=total_limit_minor,
                total_spent_minor=total_spent_minor,
                remaining_minor=remaining_minor,
                usage_percent=usage_percent,
            ),
            items=items,
        )

    @staticmethod
    def create_budget(db: Session, payload: BudgetCreate) -> BudgetItemResponse:
        budget_month = BudgetService._parse_month_or_raise(payload.month)
        user_id = BudgetRepository.get_or_create_demo_user_id(db)

        category = CategoryRepository.get_by_id(db, payload.category_id)
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category is inactive.",
            )

        if category.flow_type != CategoryFlowType.EXPENSE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Budget category must be an expense category.",
            )

        existing_budget = BudgetRepository.get_by_user_category_month(
            db,
            user_id=user_id,
            category_id=payload.category_id,
            budget_month=budget_month,
        )
        if existing_budget is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Budget already exists for this category and month.",
            )

        budget = BudgetRepository.create(
            db=db,
            user_id=user_id,
            payload=payload,
            budget_month=budget_month,
        )

        month_start, month_end = get_month_date_range(budget_month)
        spent_map = BudgetRepository.get_spent_map_for_month(
            db=db,
            user_id=user_id,
            month_start=month_start,
            month_end=month_end,
        )
        return BudgetService._to_budget_item_response(budget, spent_map.get(budget.category_id, 0))

    @staticmethod
    def update_budget(
        db: Session,
        budget_id: UUID,
        payload: BudgetUpdate,
    ) -> BudgetItemResponse:
        budget = BudgetService._get_budget_or_raise(db, budget_id)
        user_id = budget.user_id

        effective_category_id = payload.category_id if payload.category_id is not None else budget.category_id
        effective_month = (
            BudgetService._parse_month_or_raise(payload.month)
            if payload.month is not None
            else budget.budget_month
        )

        category = CategoryRepository.get_by_id(db, effective_category_id)
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category is inactive.",
            )

        if category.flow_type != CategoryFlowType.EXPENSE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Budget category must be an expense category.",
            )

        existing_budget = BudgetRepository.get_by_user_category_month(
            db,
            user_id=user_id,
            category_id=effective_category_id,
            budget_month=effective_month,
        )
        if existing_budget is not None and existing_budget.id != budget.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Budget already exists for this category and month.",
            )

        updated_budget = BudgetRepository.update(
            db=db,
            budget=budget,
            payload=payload,
            budget_month=effective_month if payload.month is not None else None,
        )

        month_start, month_end = get_month_date_range(updated_budget.budget_month)
        spent_map = BudgetRepository.get_spent_map_for_month(
            db=db,
            user_id=updated_budget.user_id,
            month_start=month_start,
            month_end=month_end,
        )
        return BudgetService._to_budget_item_response(
            updated_budget,
            spent_map.get(updated_budget.category_id, 0),
        )

    @staticmethod
    def delete_budget(db: Session, budget_id: UUID) -> None:
        budget = BudgetService._get_budget_or_raise(db, budget_id)
        BudgetRepository.delete(db, budget)

    @staticmethod
    def _get_budget_or_raise(db: Session, budget_id: UUID) -> Budget:
        budget = BudgetRepository.get_by_id(db, budget_id)
        if budget is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found.",
            )
        return budget

    @staticmethod
    def _parse_month_or_raise(month: str):
        try:
            return parse_year_month(month)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

    @staticmethod
    def _to_budget_item_response(budget: Budget, spent_minor: int) -> BudgetItemResponse:
        remaining_minor = budget.limit_minor - spent_minor
        usage_percent = round((spent_minor / budget.limit_minor) * 100, 2) if budget.limit_minor > 0 else 0.0

        if usage_percent > 100:
            status_text = "exceeded"
        elif usage_percent > 80:
            status_text = "warning"
        else:
            status_text = "normal"

        return BudgetItemResponse(
            id=budget.id,
            month=format_year_month(budget.budget_month),
            limit_minor=int(budget.limit_minor),
            spent_minor=int(spent_minor),
            remaining_minor=int(remaining_minor),
            usage_percent=usage_percent,
            status=status_text,
            category=budget.category,
        )