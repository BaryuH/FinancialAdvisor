from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from core.enums import TransactionType
from models.budget import Budget
from models.category import Category
from models.transaction import Transaction
from schemas.budget import BudgetCreate, BudgetUpdate


class BudgetRepository:
    @staticmethod
    def get_by_id(db: Session, budget_id: UUID) -> Budget | None:
        stmt = (
            select(Budget)
            .options(joinedload(Budget.category))
            .where(Budget.id == budget_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def get_by_user_category_month(
        db: Session,
        *,
        user_id: UUID,
        category_id: UUID,
        budget_month: date,
    ) -> Budget | None:
        stmt = (
            select(Budget)
            .where(
                Budget.user_id == user_id,
                Budget.category_id == category_id,
                Budget.budget_month == budget_month,
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def list_by_month(
        db: Session,
        *,
        user_id: UUID,
        budget_month: date,
    ) -> list[Budget]:
        stmt: Select[tuple[Budget]] = (
            select(Budget)
            .join(Category, Budget.category_id == Category.id)
            .options(joinedload(Budget.category))
            .where(
                Budget.user_id == user_id,
                Budget.budget_month == budget_month,
            )
            .order_by(Category.sort_order.asc(), Category.name.asc())
        )
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def get_spent_map_for_month(
        db: Session,
        *,
        user_id: UUID,
        month_start: date,
        month_end: date,
    ) -> dict[UUID, int]:
        stmt = (
            select(
                Transaction.category_id,
                func.coalesce(func.sum(Transaction.amount_minor), 0),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.transaction_date >= month_start,
                Transaction.transaction_date <= month_end,
            )
            .group_by(Transaction.category_id)
        )

        rows = db.execute(stmt).all()
        return {category_id: int(amount_minor) for category_id, amount_minor in rows}

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: UUID,
        payload: BudgetCreate,
        budget_month: date,
    ) -> Budget:
        budget = Budget(
            user_id=user_id,
            category_id=payload.category_id,
            budget_month=budget_month,
            limit_minor=payload.limit_minor,
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return BudgetRepository.get_by_id(db, budget.id)  # type: ignore[return-value]

    @staticmethod
    def update(
        db: Session,
        *,
        budget: Budget,
        payload: BudgetUpdate,
        budget_month: date | None = None,
    ) -> Budget:
        update_data = payload.model_dump(exclude_unset=True)

        if "month" in update_data:
            update_data.pop("month")

        for field_name, value in update_data.items():
            setattr(budget, field_name, value)

        if budget_month is not None:
            budget.budget_month = budget_month

        db.add(budget)
        db.commit()
        db.refresh(budget)
        return BudgetRepository.get_by_id(db, budget.id)  # type: ignore[return-value]

    @staticmethod
    def delete(db: Session, budget: Budget) -> None:
        db.delete(budget)
        db.commit()

    @staticmethod
    def get_or_create_demo_user_id(db: Session) -> UUID:
        from models.user import User

        stmt = select(User.id).order_by(User.created_at.asc()).limit(1)
        user_id = db.scalar(stmt)

        if user_id is None:
            demo_user = User(
                email="demo@example.com",
                display_name="Demo User",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            return demo_user.id

        return user_id