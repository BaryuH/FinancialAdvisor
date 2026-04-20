from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.dashboard import DashboardSummaryResponse
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dashboard summary",
)
def get_dashboard_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    selected_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummaryResponse:
    return DashboardService.get_summary(
        db=db,
        current_user=current_user,
        month=month,
        selected_date=selected_date,
    )