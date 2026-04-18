from __future__ import annotations

from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.category import CategoryResponse


class BudgetCreate(BaseModel):
    category_id: UUID
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    limit_minor: int = Field(gt=0)


class BudgetUpdate(BaseModel):
    category_id: UUID | None = None
    month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    limit_minor: int | None = Field(default=None, gt=0)


class BudgetItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    month: str
    limit_minor: int
    spent_minor: int
    remaining_minor: int
    usage_percent: float
    status: str
    category: CategoryResponse


class BudgetMonthSummary(BaseModel):
    total_limit_minor: int
    total_spent_minor: int
    remaining_minor: int
    usage_percent: float


class BudgetListResponse(BaseModel):
    month: str
    summary: BudgetMonthSummary
    items: List[BudgetItemResponse]