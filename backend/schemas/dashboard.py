from __future__ import annotations

from datetime import date
from typing import List
from uuid import UUID

from pydantic import BaseModel

from schemas.category import CategoryResponse


class DashboardSummaryStats(BaseModel):
    balance_minor: int
    income_minor: int
    expense_minor: int


class DashboardBudgetSummary(BaseModel):
    total_limit_minor: int
    total_spent_minor: int
    usage_percent: float
    status_text: str


class DashboardGoalPreviewItem(BaseModel):
    id: UUID
    name: str
    target_minor: int
    current_minor: int
    progress_percent: float
    deadline: date
    icon_key: str


class DashboardRecentTransactionItem(BaseModel):
    id: UUID
    type: str
    amount_minor: int
    currency_code: str
    description: str
    transaction_date: date
    source: str
    category: CategoryResponse


class DashboardExpenseCalendarDay(BaseModel):
    date: date
    expense_minor: int
    income_minor: int


class DashboardSelectedDayItem(BaseModel):
    id: UUID
    description: str
    amount_minor: int
    category: CategoryResponse


class DashboardSelectedDay(BaseModel):
    date: date
    expense_minor: int
    items: List[DashboardSelectedDayItem]


class DashboardExpenseCalendar(BaseModel):
    month: str
    days: List[DashboardExpenseCalendarDay]


class DashboardSummaryResponse(BaseModel):
    summary: DashboardSummaryStats
    budget_summary: DashboardBudgetSummary
    goals_preview: List[DashboardGoalPreviewItem]
    recent_transactions: List[DashboardRecentTransactionItem]
    expense_calendar: DashboardExpenseCalendar
    selected_day: DashboardSelectedDay