from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.session import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Basic health check",
)
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "financial-tracker-api",
    }


@router.get(
    "/db",
    status_code=status.HTTP_200_OK,
    summary="Database health check",
)
def database_health_check(db: Session = Depends(get_db)) -> dict[str, str | int]:
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "database": "connected",
    }