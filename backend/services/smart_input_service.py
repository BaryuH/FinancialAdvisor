from __future__ import annotations

import os
import re
from datetime import date
from typing import Any, Iterable
from uuid import UUID

import httpx
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from core.config import settings
from core.enums import (
    CategoryFlowType,
    SmartInputMode,
    SmartInputStatus,
    TransactionSource,
    TransactionType,
)

# External AI API Configuration
MAIN_URL = "http://n3.ckey.vn:1707"
OCR_API_URL = f"{MAIN_URL}/api/process/image"
ASR_API_URL =  f"{MAIN_URL}/api/process/audio"

from models.category import Category
from models.smart_input_draft import SmartInputDraft
from models.transaction import Transaction
from models.user import User
from repositories.category_repository import CategoryRepository
from repositories.smart_input_repository import SmartInputRepository
from repositories.transaction_repository import TransactionRepository
from schemas.smart_input import (
    SmartInputConfirmRequest,
    SmartInputConfirmResponse,
    SmartInputDraftResponse,
    SmartInputDraftUpdate,
    VoiceDraftCreate,
)
from schemas.transaction import TransactionResponse


class SmartInputService:
    @staticmethod
    def create_voice_draft(
        db: Session,
        *,
        current_user: User,
        file: UploadFile,
    ) -> SmartInputDraftResponse:
        # Call External ASR API
        ai_result = SmartInputService._call_external_ai_api(
            url=ASR_API_URL,
            file=file,
        )

        raw_text = ai_result.get("raw_text") or ""
        ai_data = ai_result.get("result", {})
        
        # Priority: AI Result -> Manual Extraction
        parsed_amount_minor = ai_data.get("price")
        if parsed_amount_minor is None or parsed_amount_minor <= 0:
            parsed_amount_minor = SmartInputService._extract_amount_minor(raw_text)
        
        # Ensure it's None if still 0 or less to satisfy DB check constraint
        if parsed_amount_minor is not None and parsed_amount_minor <= 0:
            parsed_amount_minor = None
            
        parsed_description = ai_data.get("note") or raw_text.strip()
        
        categories = SmartInputService._get_expense_categories(
            db,
            user_id=current_user.id,
        )
        
        # Try to match category from AI or suggest from text
        suggested_category = None
        ai_category_name = (ai_data.get("category") or "").strip().lower()
        
        # Define allowed categories for matching
        allowed_cats = ["ăn uống", "mua sắm", "di chuyển", "giải trí", "nhà cửa", "y tế"]
        
        if ai_category_name in allowed_cats:
            suggested_category = next((c for c in categories if c.name.lower() == ai_category_name), None)
        
        if not suggested_category:
            # Fallback to keyword suggestion or default to 'Khác'
            suggested_category = SmartInputService._suggest_category(raw_text, categories)

        draft = SmartInputDraft(
            user_id=current_user.id,
            mode=SmartInputMode.VOICE,
            status=SmartInputStatus.DRAFT,
            raw_text=raw_text,
            parsed_type=TransactionType.EXPENSE,
            parsed_amount_minor=parsed_amount_minor,
            parsed_description=parsed_description[:255] if parsed_description else None,
            suggested_category_id=suggested_category.id if suggested_category else None,
            parser_payload={"source": "external_asr_api", "ai_response": ai_result},
        )
        created = SmartInputRepository.create(db, draft)
        return SmartInputDraftResponse.model_validate(created)

    @staticmethod
    def create_ocr_draft(
        db: Session,
        *,
        current_user: User,
        file: UploadFile,
        hint_text: str | None = None,
    ) -> SmartInputDraftResponse:
        # Call External OCR API
        ai_result = SmartInputService._call_external_ai_api(
            url=settings.ocr_api_url,
            file=file,
        )

        raw_text = ai_result.get("raw_text") or ""
        ai_data = ai_result.get("result", {})

        # Priority: AI Result -> Manual Extraction
        parsed_amount_minor = ai_data.get("price")
        if parsed_amount_minor is None or parsed_amount_minor <= 0:
            parsed_amount_minor = SmartInputService._extract_amount_minor(raw_text)
        
        # Ensure it's None if still 0 or less to satisfy DB check constraint
        if parsed_amount_minor is not None and parsed_amount_minor <= 0:
            parsed_amount_minor = None

        parsed_description = ai_data.get("note") or (hint_text if hint_text else raw_text.strip())

        categories = SmartInputService._get_expense_categories(
            db,
            user_id=current_user.id,
        )

        # Try to match category from AI or suggest from text
        suggested_category = None
        ai_category_name = (ai_data.get("category") or "").strip().lower()
        
        allowed_cats = ["ăn uống", "mua sắm", "di chuyển", "giải trí", "nhà cửa", "y tế"]
        
        if ai_category_name in allowed_cats:
            suggested_category = next((c for c in categories if c.name.lower() == ai_category_name), None)
        
        if not suggested_category:
            final_suggest_text = f"{hint_text} {raw_text}" if hint_text else raw_text
            suggested_category = SmartInputService._suggest_category(final_suggest_text, categories)

        draft = SmartInputDraft(
            user_id=current_user.id,
            mode=SmartInputMode.OCR,
            status=SmartInputStatus.DRAFT,
            raw_text=raw_text or None,
            source_file_ref=file.filename,
            parsed_type=TransactionType.EXPENSE,
            parsed_amount_minor=parsed_amount_minor,
            parsed_description=parsed_description[:255] if parsed_description else None,
            suggested_category_id=suggested_category.id if suggested_category else None,
            merchant_name=ai_data.get("note")[:150] if ai_data.get("note") else None,
            confidence_percent=None,
            parser_payload={
                "source": "external_ocr_api",
                "filename": file.filename,
                "ai_response": ai_result
            },
        )
        created = SmartInputRepository.create(db, draft)
        return SmartInputDraftResponse.model_validate(created)

    @staticmethod
    def _call_external_ai_api(url: str, file: UploadFile) -> dict[str, Any]:
        try:
            file_content = file.file.read()
            file.file.seek(0)

            # Detect content type or default to octet-stream
            content_type = file.content_type or "application/octet-stream"
            files = {"file": (file.filename, file_content, content_type)}
            
            with httpx.Client(timeout=45.0) as client:
                response = client.post(url, files=files)
                
                if response.status_code != 200:
                    print(f"AI API Error ({response.status_code}): {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"AI service returned error {response.status_code}"
                    )
                    
                return response.json()

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service timed out"
            )
        except Exception as e:
            print(f"Internal AI API Call Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI Service communication error: {str(e)}",
            )

    @staticmethod
    def get_draft(
        db: Session,
        *,
        current_user: User,
        draft_id: UUID,
    ) -> SmartInputDraftResponse:
        draft = SmartInputService._get_draft_or_raise(
            db,
            current_user=current_user,
            draft_id=draft_id,
        )
        return SmartInputDraftResponse.model_validate(draft)

    @staticmethod
    def update_draft(
        db: Session,
        *,
        current_user: User,
        draft_id: UUID,
        payload: SmartInputDraftUpdate,
    ) -> SmartInputDraftResponse:
        draft = SmartInputService._get_draft_or_raise(
            db,
            current_user=current_user,
            draft_id=draft_id,
        )
        update_data = payload.model_dump(exclude_unset=True)

        if "suggested_category_id" in update_data and update_data["suggested_category_id"] is not None:
            category = CategoryRepository.get_accessible_by_id(
                db,
                user_id=current_user.id,
                category_id=update_data["suggested_category_id"],
            )
            if category is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found.",
                )
            if not category.is_active:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Category is inactive.",
                )
            if category.flow_type != CategoryFlowType.EXPENSE:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Smart input draft currently supports expense categories only.",
                )

        for field_name, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(draft, field_name, value)

        updated = SmartInputRepository.update(db, draft)
        return SmartInputDraftResponse.model_validate(updated)

    @staticmethod
    def confirm_draft(
        db: Session,
        *,
        current_user: User,
        draft_id: UUID,
        payload: SmartInputConfirmRequest,
    ) -> SmartInputConfirmResponse:
        draft = SmartInputService._get_draft_or_raise(
            db,
            current_user=current_user,
            draft_id=draft_id,
        )

        if draft.status != SmartInputStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Draft is not in confirmable state.",
            )

        if draft.parsed_amount_minor is None or draft.parsed_amount_minor <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Draft amount is incomplete.",
            )

        if draft.parsed_description is None or not draft.parsed_description.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Draft description is incomplete.",
            )

        if draft.suggested_category_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Draft category is incomplete.",
            )

        category = CategoryRepository.get_accessible_by_id(
            db,
            user_id=current_user.id,
            category_id=draft.suggested_category_id,
        )
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )

        if not category.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category is inactive.",
            )

        if category.flow_type != CategoryFlowType.EXPENSE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Smart input draft currently supports expense categories only.",
            )

        transaction_date = payload.transaction_date or date.today()
        transaction = Transaction(
            user_id=draft.user_id,
            category_id=draft.suggested_category_id,
            type=draft.parsed_type or TransactionType.EXPENSE,
            amount_minor=draft.parsed_amount_minor,
            currency_code="VND",
            description=draft.parsed_description.strip(),
            transaction_date=transaction_date,
            source=TransactionSource.VOICE if draft.mode == SmartInputMode.VOICE else TransactionSource.OCR,
            smart_input_draft_id=draft.id,
        )

        db.add(transaction)
        db.flush()

        draft.confirmed_transaction_id = transaction.id
        draft.status = SmartInputStatus.CONFIRMED

        db.add(draft)
        db.commit()
        db.refresh(transaction)
        db.refresh(draft)

        loaded_transaction = TransactionRepository.get_by_id(
            db,
            user_id=current_user.id,
            transaction_id=transaction.id,
        )
        if loaded_transaction is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load confirmed transaction.",
            )

        return SmartInputConfirmResponse(
            draft_id=draft.id,
            status=draft.status,
            transaction=TransactionResponse.model_validate(loaded_transaction),
        )

    @staticmethod
    def _get_draft_or_raise(
        db: Session,
        *,
        current_user: User,
        draft_id: UUID,
    ) -> SmartInputDraft:
        draft = SmartInputRepository.get_by_id(
            db,
            user_id=current_user.id,
            draft_id=draft_id,
        )
        if draft is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Smart input draft not found.",
            )
        return draft

    @staticmethod
    def _get_expense_categories(
        db: Session,
        *,
        user_id: UUID,
    ) -> list[Category]:
        return CategoryRepository.list_categories(
            db,
            user_id=user_id,
            flow_type=CategoryFlowType.EXPENSE,
            active_only=True,
        )

    @staticmethod
    def _suggest_category(text: str, categories: Iterable[Category]) -> Category | None:
        normalized = SmartInputService._normalize_text(text)

        keyword_map = {
            "Ăn uống": ["ăn", "cơm", "phở", "bún", "cafe", "coffee", "trà sữa", "trà", "tea", "pizza", "mì"],
            "Di chuyển": ["grab", "taxi", "xăng", "xe", "bus", "gửi xe"],
            "Mua sắm": ["mua", "shop", "quần áo", "áo", "giày", "shopping"],
            "Giải trí": ["phim", "karaoke", "game", "netflix", "spotify"],
            "Y tế": ["thuốc", "bệnh viện", "khám", "nha khoa", "y tế"],
            "Nhà cửa": ["tiền nhà", "điện", "nước", "wifi", "internet", "nhà"],
        }

        categories_list = list(categories)

        for category in categories_list:
            if category.name.lower() in normalized:
                return category

        for category_name, keywords in keyword_map.items():
            if any(keyword in normalized for keyword in keywords):
                for category in categories_list:
                    if category.name == category_name:
                        return category

        for category in categories_list:
            if category.name == "Khác":
                return category

        return categories_list[0] if categories_list else None

    @staticmethod
    def _extract_amount_minor(text: str) -> int | None:
        normalized = SmartInputService._normalize_text(text)

        match_million = re.search(r"(\d+(?:[.,]\d+)?)\s*(tr|triệu)", normalized)
        if match_million:
            value = float(match_million.group(1).replace(",", "."))
            return int(value * 1_000_000)

        match_thousand = re.search(r"(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn)", normalized)
        if match_thousand:
            value = float(match_thousand.group(1).replace(",", "."))
            return int(value * 1_000)

        raw_numbers = re.findall(r"\d[\d., ]*", normalized)
        if not raw_numbers:
            return None

        cleaned_candidates: list[int] = []
        for raw_number in raw_numbers:
            digits_only = re.sub(r"[^\d]", "", raw_number)
            if digits_only:
                cleaned_candidates.append(int(digits_only))

        if not cleaned_candidates:
            return None

        return max(cleaned_candidates)

    @staticmethod
    def _normalize_text(text: str) -> str:
        return re.sub(r"\s+", " ", text.strip().lower())