from __future__ import annotations

from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from core.enums import CategoryFlowType


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    flow_type: CategoryFlowType
    icon_key: str
    color_hex: str
    sort_order: int
    is_system: bool
    is_active: bool


class CategoryListResponse(BaseModel):
    items: List[CategoryResponse]