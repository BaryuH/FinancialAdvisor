from __future__ import annotations

from calendar import monthrange
from datetime import date


def parse_year_month(month_str: str) -> date:
    parts = month_str.split("-")
    if len(parts) != 2:
        raise ValueError("Month must be in YYYY-MM format.")

    year = int(parts[0])
    month = int(parts[1])

    if month < 1 or month > 12:
        raise ValueError("Month must be between 01 and 12.")

    return date(year, month, 1)


def format_year_month(month_date: date) -> str:
    return month_date.strftime("%Y-%m")


def get_month_date_range(month_date: date) -> tuple[date, date]:
    last_day = monthrange(month_date.year, month_date.month)[1]
    return month_date, date(month_date.year, month_date.month, last_day)