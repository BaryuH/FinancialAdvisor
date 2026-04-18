from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.enums import TransactionType
from models.transaction import Transaction
from repositories.category_repository import CategoryRepository
from repositories.transaction_repository import TransactionRepository
from schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionService:
    @staticmethod
    def list_transactions(
        db: Session,
        *,
        transaction_type: TransactionType | None = None,
        category_id: UUID | None = None,
        q: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Transaction], int, int]:
        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="date_from must be less than or equal to date_to.",
            )

        return TransactionRepository.list_transactions(
            db=db,
            transaction_type=transaction_type,
            category_id=category_id,
            q=q,
            date_from=date_from,
            date_to=date_to,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def get_transaction(db: Session, transaction_id: UUID) -> Transaction:
        transaction = TransactionRepository.get_by_id(db, transaction_id)
        if transaction is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found.",
            )
        return transaction

    @staticmethod
    def create_transaction(db: Session, payload: TransactionCreate) -> Transaction:
        category = CategoryRepository.get_by_id(db, payload.category_id)

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

        if category.flow_type != payload.type:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category flow type does not match transaction type.",
            )

        return TransactionRepository.create(db, payload)

    @staticmethod
    def update_transaction(
        db: Session,
        transaction_id: UUID,
        payload: TransactionUpdate,
    ) -> Transaction:
        transaction = TransactionService.get_transaction(db, transaction_id)

        effective_type = payload.type if payload.type is not None else transaction.type
        effective_category_id = (
            payload.category_id if payload.category_id is not None else transaction.category_id
        )

        category = CategoryRepository.get_by_id(db, effective_category_id)
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

        if category.flow_type != effective_type:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category flow type does not match transaction type.",
            )

        return TransactionRepository.update(db, transaction, payload)

    @staticmethod
    def delete_transaction(db: Session, transaction_id: UUID) -> None:
        transaction = TransactionService.get_transaction(db, transaction_id)
        TransactionRepository.delete(db, transaction)