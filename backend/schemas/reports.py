from __future__ import annotations

from datetime import date
from typing import List

from pydantic import BaseModel

from core.enums import ReportPeriod


class ReportsSummary(BaseModel):
    income_minor: int
    expense_minor: int
    balance_minor: int
    savings_ratio_percent: float


class ExpenseByCategoryItem(BaseModel):
    category_id: str
    category_name: str
    amount_minor: int
    color_hex: str
    percentage: float


class IncomeExpenseSeriesItem(BaseModel):
    bucket_label: str
    income_minor: int
    expense_minor: int


class CashFlowSeriesItem(BaseModel):
    date: date
    balance_minor: int


class ReportsInsights(BaseModel):
    top_expense_category: str | None
    top_expense_amount_minor: int
    average_daily_expense_minor: int


class ReportsOverviewResponse(BaseModel):
    period: ReportPeriod
    start_date: date
    end_date: date
    summary: ReportsSummary
    expense_by_category: List[ExpenseByCategoryItem]
    income_expense_series: List[IncomeExpenseSeriesItem]
    cash_flow_series: List[CashFlowSeriesItem]
    insights: ReportsInsights