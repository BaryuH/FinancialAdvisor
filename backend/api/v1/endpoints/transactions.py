from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.enums import TransactionType
from db.session import get_db
from schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
)
from services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get(
    "",
    response_model=TransactionListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get transaction list",
)
def list_transactions(
    type: TransactionType | None = Query(default=None),
    category_id: UUID | None = Query(default=None),
    q: str | None = Query(default=None, min_length=1),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> TransactionListResponse:
    items, total_items, total_pages = TransactionService.list_transactions(
        db=db,
        transaction_type=type,
        category_id=category_id,
        q=q,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )

    return TransactionListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
    )


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a transaction",
)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = TransactionService.create_transaction(db, payload)
    return TransactionResponse.model_validate(transaction)


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get transaction detail",
)
def get_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = TransactionService.get_transaction(db, transaction_id)
    return TransactionResponse.model_validate(transaction)


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a transaction",
)
def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = TransactionService.update_transaction(db, transaction_id, payload)
    return TransactionResponse.model_validate(transaction)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a transaction",
)
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    TransactionService.delete_transaction(db, transaction_id)