from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.smart_input import (
    SmartInputConfirmRequest,
    SmartInputConfirmResponse,
    SmartInputDraftResponse,
    SmartInputDraftUpdate,
    VoiceDraftCreate,
)
from services.smart_input_service import SmartInputService

router = APIRouter(prefix="/smart-input", tags=["smart-input"])


@router.post(
    "/drafts/voice",
    response_model=SmartInputDraftResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create voice smart-input draft",
)
def create_voice_draft(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SmartInputDraftResponse:
    return SmartInputService.create_voice_draft(
        db,
        current_user=current_user,
        file=file,
    )


@router.post(
    "/drafts/ocr",
    response_model=SmartInputDraftResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create OCR smart-input draft",
)
def create_ocr_draft(
    file: UploadFile = File(...),
    hint_text: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SmartInputDraftResponse:
    return SmartInputService.create_ocr_draft(
        db=db,
        current_user=current_user,
        file=file,
        hint_text=hint_text,
    )


@router.get(
    "/drafts/{draft_id}",
    response_model=SmartInputDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Get smart-input draft",
)
def get_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SmartInputDraftResponse:
    from uuid import UUID

    return SmartInputService.get_draft(
        db,
        current_user=current_user,
        draft_id=UUID(draft_id),
    )


@router.patch(
    "/drafts/{draft_id}",
    response_model=SmartInputDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Update smart-input draft",
)
def update_draft(
    draft_id: str,
    payload: SmartInputDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SmartInputDraftResponse:
    from uuid import UUID

    return SmartInputService.update_draft(
        db=db,
        current_user=current_user,
        draft_id=UUID(draft_id),
        payload=payload,
    )


@router.post(
    "/drafts/{draft_id}/confirm",
    response_model=SmartInputConfirmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm smart-input draft and create transaction",
)
def confirm_draft(
    draft_id: str,
    payload: SmartInputConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SmartInputConfirmResponse:
    from uuid import UUID

    return SmartInputService.confirm_draft(
        db=db,
        current_user=current_user,
        draft_id=UUID(draft_id),
        payload=payload,
    )