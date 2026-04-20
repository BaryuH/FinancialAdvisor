from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.enums import ReportPeriod
from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.reports import ReportsOverviewResponse
from services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get(
    "/overview",
    response_model=ReportsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get reports overview",
)
def get_reports_overview(
    period: ReportPeriod = Query(default=ReportPeriod.MONTH),
    anchor_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportsOverviewResponse:
    return ReportsService.get_overview(
        db=db,
        current_user=current_user,
        period=period,
        anchor_date=anchor_date,
    )