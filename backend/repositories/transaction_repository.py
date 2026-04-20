from __future__ import annotations

from datetime import date
from math import ceil
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, joinedload

from core.enums import TransactionType
from models.category import Category
from models.transaction import Transaction
from schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionRepository:
    @staticmethod
    def get_by_id(
        db: Session,
        *,
        user_id: UUID,
        transaction_id: UUID,
    ) -> Transaction | None:
        stmt = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(
                Transaction.id == transaction_id,
                Transaction.user_id == user_id,
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def list_transactions(
        db: Session,
        *,
        user_id: UUID,
        transaction_type: TransactionType | None = None,
        category_id: UUID | None = None,
        q: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Transaction], int, int]:
        stmt: Select[tuple[Transaction]] = (
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(Transaction.user_id == user_id)
        )

        count_stmt = (
            select(func.count(Transaction.id))
            .select_from(Transaction)
            .where(Transaction.user_id == user_id)
        )

        need_join_category = bool(q)

        if need_join_category:
            stmt = stmt.join(Category, Transaction.category_id == Category.id)
            count_stmt = count_stmt.join(Category, Transaction.category_id == Category.id)

        if transaction_type is not None:
            stmt = stmt.where(Transaction.type == transaction_type)
            count_stmt = count_stmt.where(Transaction.type == transaction_type)

        if category_id is not None:
            stmt = stmt.where(Transaction.category_id == category_id)
            count_stmt = count_stmt.where(Transaction.category_id == category_id)

        if date_from is not None:
            stmt = stmt.where(Transaction.transaction_date >= date_from)
            count_stmt = count_stmt.where(Transaction.transaction_date >= date_from)

        if date_to is not None:
            stmt = stmt.where(Transaction.transaction_date <= date_to)
            count_stmt = count_stmt.where(Transaction.transaction_date <= date_to)

        if q:
            keyword = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    Transaction.description.ilike(keyword),
                    Category.name.ilike(keyword),
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    Transaction.description.ilike(keyword),
                    Category.name.ilike(keyword),
                )
            )

        stmt = stmt.order_by(
            Transaction.transaction_date.desc(),
            Transaction.created_at.desc(),
        )

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        items = list(db.scalars(stmt).unique().all())
        total_items = db.scalar(count_stmt) or 0
        total_pages = ceil(total_items / page_size) if total_items > 0 else 0

        return items, total_items, total_pages

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: UUID,
        payload: TransactionCreate,
    ) -> Transaction:
        transaction = Transaction(
            user_id=user_id,
            type=payload.type,
            category_id=payload.category_id,
            amount_minor=payload.amount_minor,
            description=payload.description.strip(),
            transaction_date=payload.transaction_date,
            source=payload.source,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return TransactionRepository.get_by_id(
            db,
            user_id=user_id,
            transaction_id=transaction.id,
        )  # type: ignore[return-value]

    @staticmethod
    def update(
        db: Session,
        *,
        user_id: UUID,
        transaction: Transaction,
        payload: TransactionUpdate,
    ) -> Transaction:
        update_data = payload.model_dump(exclude_unset=True)

        for field_name, value in update_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(transaction, field_name, value)

        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return TransactionRepository.get_by_id(
            db,
            user_id=user_id,
            transaction_id=transaction.id,
        )  # type: ignore[return-value]

    @staticmethod
    def delete(db: Session, transaction: Transaction) -> None:
        db.delete(transaction)
        db.commit()