from __future__ import annotations

from datetime import date
from typing import List
from uuid import UUID

from pydantic import BaseModel

from schemas.category import CategoryResponse


class CalendarMonthSummary(BaseModel):
    income_minor: int
    expense_minor: int
    net_minor: int


class CalendarMonthDayItem(BaseModel):
    date: date
    income_minor: int
    expense_minor: int
    net_minor: int
    transaction_count: int


class CalendarMonthResponse(BaseModel):
    month: str
    summary: CalendarMonthSummary
    days: List[CalendarMonthDayItem]


class CalendarDayTransactionItem(BaseModel):
    id: UUID
    type: str
    amount_minor: int
    currency_code: str
    description: str
    transaction_date: date
    source: str
    category: CategoryResponse


class CalendarDayResponse(BaseModel):
    date: date
    summary: CalendarMonthSummary
    items: List[CalendarDayTransactionItem]