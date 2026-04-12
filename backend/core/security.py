from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from utils.demo_user import get_or_create_demo_user_id


def get_current_user_id(db: Session) -> UUID:
    
    return get_or_create_demo_user_id(db)