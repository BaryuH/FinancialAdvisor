from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.user import User


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> User | None:
        stmt = select(User).where(User.id == user_id).limit(1)
        return db.scalar(stmt)

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        normalized_email = email.strip().lower()
        stmt = (
            select(User)
            .where(func.lower(User.email) == normalized_email)
            .limit(1)
        )
        return db.scalar(stmt)

    @staticmethod
    def create(
        db: Session,
        *,
        email: str,
        password_hash: str,
        display_name: str | None,
    ) -> User:
        user = User(
            email=email.strip().lower(),
            password_hash=password_hash,
            display_name=display_name.strip() if display_name else None,
            is_active=True,
            token_version=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def increment_token_version(db: Session, user: User) -> User:
        user.token_version += 1
        db.add(user)
        db.commit()
        db.refresh(user)
        return user