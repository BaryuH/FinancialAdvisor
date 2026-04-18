from __future__ import annotations

from datetime import date, datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from core.enums import TransactionSource, TransactionType
from schemas.category import CategoryResponse


class TransactionCreate(BaseModel):
    type: TransactionType
    category_id: UUID
    amount_minor: int = Field(gt=0)
    description: str = Field(min_length=1, max_length=255)
    transaction_date: date
    source: TransactionSource = TransactionSource.MANUAL


class TransactionUpdate(BaseModel):
    type: TransactionType | None = None
    category_id: UUID | None = None
    amount_minor: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, min_length=1, max_length=255)
    transaction_date: date | None = None
    source: TransactionSource | None = None


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: TransactionType
    amount_minor: int
    currency_code: str
    description: str
    transaction_date: date
    source: TransactionSource
    created_at: datetime
    updated_at: datetime
    category: CategoryResponse


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    page: int
    page_size: int
    total_items: int
    total_pages: int