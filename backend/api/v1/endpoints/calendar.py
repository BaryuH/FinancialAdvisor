from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from schemas.calendar import CalendarDayResponse, CalendarMonthResponse
from services.calendar_service import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get(
    "/month",
    response_model=CalendarMonthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get calendar month data",
)
def get_calendar_month(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
) -> CalendarMonthResponse:
    return CalendarService.get_month_data(db, month)


@router.get(
    "/day",
    response_model=CalendarDayResponse,
    status_code=status.HTTP_200_OK,
    summary="Get calendar day data",
)
def get_calendar_day(
    date: date = Query(...),
    db: Session = Depends(get_db),
) -> CalendarDayResponse:
    return CalendarService.get_day_data(db, date)