from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from core.enums import SmartInputMode, SmartInputStatus, TransactionType
from schemas.category import CategoryResponse
from schemas.transaction import TransactionResponse


class VoiceDraftCreate(BaseModel):
    raw_text: str = Field(min_length=1)


class SmartInputDraftUpdate(BaseModel):
    parsed_type: TransactionType | None = None
    parsed_amount_minor: int | None = Field(default=None, gt=0)
    parsed_description: str | None = Field(default=None, min_length=1, max_length=255)
    suggested_category_id: UUID | None = None
    merchant_name: str | None = Field(default=None, min_length=1, max_length=150)


class SmartInputConfirmRequest(BaseModel):
    transaction_date: date | None = None


class SmartInputDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    mode: SmartInputMode
    status: SmartInputStatus
    raw_text: str | None
    source_file_ref: str | None
    parsed_type: TransactionType | None
    parsed_amount_minor: int | None
    parsed_description: str | None
    merchant_name: str | None
    confidence_percent: int | None
    parser_payload: dict | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    suggested_category: CategoryResponse | None


class SmartInputConfirmResponse(BaseModel):
    draft_id: UUID
    status: SmartInputStatus
    transaction: TransactionResponse