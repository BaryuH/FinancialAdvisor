from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from core.enums import ReportPeriod, TransactionType
from models.transaction import Transaction
from schemas.reports import (
    CashFlowSeriesItem,
    ExpenseByCategoryItem,
    IncomeExpenseSeriesItem,
    ReportsInsights,
    ReportsOverviewResponse,
    ReportsSummary,
)
from utils.demo_user import get_or_create_demo_user_id


class ReportsService:
    @staticmethod
    def get_overview(
        db: Session,
        *,
        period: ReportPeriod,
        anchor_date: date,
    ) -> ReportsOverviewResponse:
        user_id = get_or_create_demo_user_id(db)
        start_date, end_date = ReportsService._resolve_period(period, anchor_date)

        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
            )
            .order_by(Transaction.transaction_date.asc(), Transaction.created_at.asc())
        )
        transactions = list(db.scalars(stmt).unique().all())

        income_minor = sum(
            int(transaction.amount_minor)
            for transaction in transactions
            if transaction.type == TransactionType.INCOME
        )
        expense_minor = sum(
            int(transaction.amount_minor)
            for transaction in transactions
            if transaction.type == TransactionType.EXPENSE
        )
        balance_minor = income_minor - expense_minor
        savings_ratio_percent = round((balance_minor / income_minor) * 100, 2) if income_minor > 0 else 0.0

        expense_by_category = ReportsService._build_expense_by_category(transactions, expense_minor)
        income_expense_series = ReportsService._build_income_expense_series(transactions, start_date, end_date)
        cash_flow_series = ReportsService._build_cash_flow_series(transactions, start_date, end_date)
        insights = ReportsService._build_insights(expense_by_category, expense_minor, start_date, end_date)

        return ReportsOverviewResponse(
            period=period,
            start_date=start_date,
            end_date=end_date,
            summary=ReportsSummary(
                income_minor=income_minor,
                expense_minor=expense_minor,
                balance_minor=balance_minor,
                savings_ratio_percent=savings_ratio_percent,
            ),
            expense_by_category=expense_by_category,
            income_expense_series=income_expense_series,
            cash_flow_series=cash_flow_series,
            insights=insights,
        )

    @staticmethod
    def _build_expense_by_category(
        transactions: list[Transaction],
        total_expense_minor: int,
    ) -> list[ExpenseByCategoryItem]:
        grouped: dict[str, dict[str, str | int]] = {}

        for transaction in transactions:
            if transaction.type != TransactionType.EXPENSE:
                continue

            category = transaction.category
            key = str(category.id)

            if key not in grouped:
                grouped[key] = {
                    "category_name": category.name,
                    "color_hex": category.color_hex,
                    "amount_minor": 0,
                }

            grouped[key]["amount_minor"] = int(grouped[key]["amount_minor"]) + int(transaction.amount_minor)

        items = [
            ExpenseByCategoryItem(
                category_id=category_id,
                category_name=str(payload["category_name"]),
                amount_minor=int(payload["amount_minor"]),
                color_hex=str(payload["color_hex"]),
                percentage=round((int(payload["amount_minor"]) / total_expense_minor) * 100, 2)
                if total_expense_minor > 0
                else 0.0,
            )
            for category_id, payload in grouped.items()
        ]

        items.sort(key=lambda item: item.amount_minor, reverse=True)
        return items

    @staticmethod
    def _build_income_expense_series(
        transactions: list[Transaction],
        start_date: date,
        end_date: date,
    ) -> list[IncomeExpenseSeriesItem]:
        income_map: dict[date, int] = defaultdict(int)
        expense_map: dict[date, int] = defaultdict(int)

        for transaction in transactions:
            if transaction.type == TransactionType.INCOME:
                income_map[transaction.transaction_date] += int(transaction.amount_minor)
            else:
                expense_map[transaction.transaction_date] += int(transaction.amount_minor)

        result: list[IncomeExpenseSeriesItem] = []
        cursor = start_date
        while cursor <= end_date:
            result.append(
                IncomeExpenseSeriesItem(
                    bucket_label=cursor.strftime("%d/%m"),
                    income_minor=income_map[cursor],
                    expense_minor=expense_map[cursor],
                )
            )
            cursor += timedelta(days=1)

        return result

    @staticmethod
    def _build_cash_flow_series(
        transactions: list[Transaction],
        start_date: date,
        end_date: date,
    ) -> list[CashFlowSeriesItem]:
        net_map: dict[date, int] = defaultdict(int)
        for transaction in transactions:
            amount = int(transaction.amount_minor)
            if transaction.type == TransactionType.INCOME:
                net_map[transaction.transaction_date] += amount
            else:
                net_map[transaction.transaction_date] -= amount

        result: list[CashFlowSeriesItem] = []
        running_balance = 0
        cursor = start_date
        while cursor <= end_date:
            running_balance += net_map[cursor]
            result.append(
                CashFlowSeriesItem(
                    date=cursor,
                    balance_minor=running_balance,
                )
            )
            cursor += timedelta(days=1)

        return result

    @staticmethod
    def _build_insights(
        expense_by_category: list[ExpenseByCategoryItem],
        total_expense_minor: int,
        start_date: date,
        end_date: date,
    ) -> ReportsInsights:
        top_item = expense_by_category[0] if expense_by_category else None
        day_count = max((end_date - start_date).days + 1, 1)
        average_daily_expense_minor = total_expense_minor // day_count

        return ReportsInsights(
            top_expense_category=top_item.category_name if top_item else None,
            top_expense_amount_minor=top_item.amount_minor if top_item else 0,
            average_daily_expense_minor=average_daily_expense_minor,
        )

    @staticmethod
    def _resolve_period(period: ReportPeriod, anchor_date: date) -> tuple[date, date]:
        if period == ReportPeriod.WEEK:
            return anchor_date - timedelta(days=6), anchor_date

        if period == ReportPeriod.MONTH:
            start_date = anchor_date.replace(day=1)
            if anchor_date.month == 12:
                next_month = anchor_date.replace(year=anchor_date.year + 1, month=1, day=1)
            else:
                next_month = anchor_date.replace(month=anchor_date.month + 1, day=1)
            end_date = next_month - timedelta(days=1)
            return start_date, end_date

        quarter = (anchor_date.month - 1) // 3 + 1
        start_month = (quarter - 1) * 3 + 1
        start_date = anchor_date.replace(month=start_month, day=1)

        if start_month == 10:
            next_quarter = anchor_date.replace(year=anchor_date.year + 1, month=1, day=1)
        else:
            next_quarter = anchor_date.replace(month=start_month + 3, day=1)

        end_date = next_quarter - timedelta(days=1)
        return start_date, end_date