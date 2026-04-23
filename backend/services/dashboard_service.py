from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from core.enums import TransactionType
from models.goal import Goal
from models.transaction import Transaction
from models.user import User
from repositories.budget_repository import BudgetRepository
from schemas.dashboard import (
    DashboardBudgetSummary,
    DashboardExpenseCalendar,
    DashboardExpenseCalendarDay,
    DashboardGoalPreviewItem,
    DashboardRecentTransactionItem,
    DashboardSelectedDay,
    DashboardSelectedDayItem,
    DashboardSummaryResponse,
    DashboardSummaryStats,
)
from services.goal_service import GoalService
from utils.dates import format_year_month, get_month_date_range, parse_year_month


class DashboardService:
    @staticmethod
    def get_summary(
        db: Session,
        *,
        current_user: User,
        month: str,
        selected_date: date | None = None,
    ) -> DashboardSummaryResponse:
        month_date = DashboardService._parse_month_or_raise(month)
        month_start, month_end = get_month_date_range(month_date)
        user_id = current_user.id

        target_selected_date = selected_date or month_start
        if target_selected_date < month_start or target_selected_date > month_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="selected_date must be inside the requested month.",
            )

        summary = DashboardService._build_summary_stats(db, user_id, month_start, month_end)
        budget_summary = DashboardService._build_budget_summary(db, user_id, month_date)
        goals_preview = DashboardService._build_goals_preview(db, user_id)
        recent_transactions = DashboardService._build_recent_transactions(db, user_id)
        expense_calendar = DashboardService._build_expense_calendar(db, user_id, month_start, month_end, month_date)
        selected_day = DashboardService._build_selected_day(db, user_id, target_selected_date)

        return DashboardSummaryResponse(
            summary=summary,
            budget_summary=budget_summary,
            goals_preview=goals_preview,
            recent_transactions=recent_transactions,
            expense_calendar=expense_calendar,
            selected_day=selected_day,
        )

    @staticmethod
    def _build_summary_stats(
        db: Session,
        user_id: UUID,
        month_start: date,
        month_end: date,
    ) -> DashboardSummaryStats:
        stmt = select(
            func.coalesce(
                func.sum(
                    case(
                        (Transaction.type == TransactionType.INCOME, Transaction.amount_minor),
                        else_=0,
                    )
                ),
                0,
            ).label("income_minor"),
            func.coalesce(
                func.sum(
                    case(
                        (Transaction.type == TransactionType.EXPENSE, Transaction.amount_minor),
                        else_=0,
                    )
                ),
                0,
            ).label("expense_minor"),
        ).where(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date <= month_end,
        )

        row = db.execute(stmt).one()
        income_minor = int(row.income_minor or 0)
        expense_minor = int(row.expense_minor or 0)

        return DashboardSummaryStats(
            balance_minor=income_minor - expense_minor,
            income_minor=income_minor,
            expense_minor=expense_minor,
        )

    @staticmethod
    def _build_budget_summary(
        db: Session,
        user_id: UUID,
        month_date: date,
    ) -> DashboardBudgetSummary:
        budgets = BudgetRepository.list_by_month(
            db=db,
            user_id=user_id,
            budget_month=month_date,
        )
        month_start, month_end = get_month_date_range(month_date)
        spent_map = BudgetRepository.get_spent_map_for_month(
            db=db,
            user_id=user_id,
            month_start=month_start,
            month_end=month_end,
        )

        total_limit_minor = sum(int(budget.limit_minor) for budget in budgets)
        total_spent_minor = sum(spent_map.get(budget.category_id, 0) for budget in budgets)
        usage_percent = round((total_spent_minor / total_limit_minor) * 100, 2) if total_limit_minor > 0 else 0.0

        if usage_percent > 90:
            status_text = "Cảnh báo: ngân sách đã dùng rất cao"
        elif usage_percent > 70:
            status_text = "Bạn đang tiến gần hạn mức ngân sách"
        else:
            status_text = "Ngân sách đang trong vùng an toàn"

        return DashboardBudgetSummary(
            total_limit_minor=total_limit_minor,
            total_spent_minor=total_spent_minor,
            usage_percent=usage_percent,
            status_text=status_text,
        )

    @staticmethod
    def _build_goals_preview(db: Session, user_id: UUID) -> list[DashboardGoalPreviewItem]:
        stmt = (
            select(Goal)
            .where(Goal.user_id == user_id)
            .order_by(Goal.deadline.asc(), Goal.created_at.asc())
            .limit(2)
        )
        goals = list(db.scalars(stmt).all())

        items: list[DashboardGoalPreviewItem] = []
        for goal in goals:
            goal_response = GoalService._to_goal_response(goal)
            items.append(
                DashboardGoalPreviewItem(
                    id=goal.id,
                    name=goal.name,
                    target_minor=int(goal.target_minor),
                    current_minor=int(goal.current_minor),
                    progress_percent=goal_response.progress_percent,
                    deadline=goal.deadline,
                    icon_key=goal.icon_key,
                )
            )
        return items

    @staticmethod
    def _build_recent_transactions(db: Session, user_id: UUID) -> list[DashboardRecentTransactionItem]:
        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
            .limit(5)
        )
        transactions = list(db.scalars(stmt).unique().all())

        return [
            DashboardRecentTransactionItem(
                id=transaction.id,
                type=transaction.type.value,
                amount_minor=int(transaction.amount_minor),
                currency_code=transaction.currency_code,
                description=transaction.description,
                transaction_date=transaction.transaction_date,
                source=transaction.source.value,
                category=transaction.category,
            )
            for transaction in transactions
        ]

    @staticmethod
    def _build_expense_calendar(
        db: Session,
        user_id: UUID,
        month_start: date,
        month_end: date,
        month_date: date,
    ) -> DashboardExpenseCalendar:
        stmt = (
            select(
                Transaction.transaction_date,
                func.coalesce(
                    func.sum(
                        case(
                            (Transaction.type == TransactionType.INCOME, Transaction.amount_minor),
                            else_=0,
                        )
                    ),
                    0,
                ).label("income_minor"),
                func.coalesce(
                    func.sum(
                        case(
                            (Transaction.type == TransactionType.EXPENSE, Transaction.amount_minor),
                            else_=0,
                        )
                    ),
                    0,
                ).label("expense_minor"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= month_start,
                Transaction.transaction_date <= month_end,
            )
            .group_by(Transaction.transaction_date)
            .order_by(Transaction.transaction_date.asc())
        )
        rows = db.execute(stmt).all()

        days = [
            DashboardExpenseCalendarDay(
                date=row.transaction_date,
                income_minor=int(row.income_minor),
                expense_minor=int(row.expense_minor),
            )
            for row in rows
        ]

        return DashboardExpenseCalendar(
            month=format_year_month(month_date),
            days=days,
        )

    @staticmethod
    def _build_selected_day(
        db: Session,
        user_id: UUID,
        target_date: date,
    ) -> DashboardSelectedDay:
        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(
                Transaction.user_id == user_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.transaction_date == target_date,
            )
            .order_by(Transaction.created_at.desc())
        )
        transactions = list(db.scalars(stmt).unique().all())

        items = [
            DashboardSelectedDayItem(
                id=transaction.id,
                description=transaction.description,
                amount_minor=int(transaction.amount_minor),
                category=transaction.category,
            )
            for transaction in transactions
        ]
        expense_minor = sum(item.amount_minor for item in items)

        return DashboardSelectedDay(
            date=target_date,
            expense_minor=expense_minor,
            items=items,
        )

    @staticmethod
    def _parse_month_or_raise(month: str) -> date:
        try:
            return parse_year_month(month)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc