from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from core.enums import TransactionType
from models.transaction import Transaction
from schemas.calendar import (
    CalendarDayResponse,
    CalendarDayTransactionItem,
    CalendarMonthDayItem,
    CalendarMonthResponse,
    CalendarMonthSummary,
)
from utils.dates import format_year_month, get_month_date_range, parse_year_month
from utils.demo_user import get_or_create_demo_user_id


class CalendarService:
    @staticmethod
    def get_month_data(db: Session, month: str) -> CalendarMonthResponse:
        month_date = CalendarService._parse_month_or_raise(month)
        month_start, month_end = get_month_date_range(month_date)
        user_id = get_or_create_demo_user_id(db)

        totals_stmt = select(
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
        totals_row = db.execute(totals_stmt).one()
        income_minor = int(totals_row.income_minor or 0)
        expense_minor = int(totals_row.expense_minor or 0)

        days_stmt = (
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
                func.count(Transaction.id).label("transaction_count"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= month_start,
                Transaction.transaction_date <= month_end,
            )
            .group_by(Transaction.transaction_date)
            .order_by(Transaction.transaction_date.asc())
        )
        rows = db.execute(days_stmt).all()

        days = [
            CalendarMonthDayItem(
                date=row.transaction_date,
                income_minor=int(row.income_minor),
                expense_minor=int(row.expense_minor),
                net_minor=int(row.income_minor) - int(row.expense_minor),
                transaction_count=int(row.transaction_count),
            )
            for row in rows
        ]

        return CalendarMonthResponse(
            month=format_year_month(month_date),
            summary=CalendarMonthSummary(
                income_minor=income_minor,
                expense_minor=expense_minor,
                net_minor=income_minor - expense_minor,
            ),
            days=days,
        )

    @staticmethod
    def get_day_data(db: Session, target_date: date) -> CalendarDayResponse:
        user_id = get_or_create_demo_user_id(db)

        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(
                Transaction.user_id == user_id,
                Transaction.transaction_date == target_date,
            )
            .order_by(Transaction.created_at.desc())
        )
        transactions = list(db.scalars(stmt).unique().all())

        items = [
            CalendarDayTransactionItem(
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

        income_minor = sum(item.amount_minor for item in items if item.type == TransactionType.INCOME.value)
        expense_minor = sum(item.amount_minor for item in items if item.type == TransactionType.EXPENSE.value)

        return CalendarDayResponse(
            date=target_date,
            summary=CalendarMonthSummary(
                income_minor=income_minor,
                expense_minor=expense_minor,
                net_minor=income_minor - expense_minor,
            ),
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