from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.user import User


def get_or_create_demo_user_id(db: Session) -> UUID:
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