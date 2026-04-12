from __future__ import annotations

from datetime import date, datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target_minor: int = Field(gt=0)
    deadline: date
    icon_key: str = Field(default="target", min_length=1, max_length=50)


class GoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    target_minor: int | None = Field(default=None, gt=0)
    current_minor: int | None = Field(default=None, ge=0)
    deadline: date | None = None
    icon_key: str | None = Field(default=None, min_length=1, max_length=50)


class GoalTopUp(BaseModel):
    amount_minor: int = Field(gt=0)


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    target_minor: int
    current_minor: int
    deadline: date
    icon_key: str
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    progress_percent: float
    is_completed: bool
    days_remaining: int
    required_monthly_saving_minor: int


class GoalListResponse(BaseModel):
    items: List[GoalResponse]
    total_items: int
    active_items: int
    completed_items: int