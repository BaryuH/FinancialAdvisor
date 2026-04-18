from fastapi import APIRouter

from api.v1.endpoints.budgets import router as budgets_router
from api.v1.endpoints.calendar import router as calendar_router
from api.v1.endpoints.categories import router as categories_router
from api.v1.endpoints.dashboard import router as dashboard_router
from api.v1.endpoints.goals import router as goals_router
from api.v1.endpoints.health import router as health_router
from api.v1.endpoints.reports import router as reports_router
from api.v1.endpoints.smart_input import router as smart_input_router
from api.v1.endpoints.transactions import router as transactions_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(categories_router)
api_router.include_router(transactions_router)
api_router.include_router(budgets_router)
api_router.include_router(goals_router)
api_router.include_router(dashboard_router)
api_router.include_router(calendar_router)
api_router.include_router(reports_router)
api_router.include_router(smart_input_router)