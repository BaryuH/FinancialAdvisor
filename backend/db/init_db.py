from __future__ import annotations

from sqlalchemy.orm import Session


def init_db(db: Session) -> None:
    """
    Giữ hook init_db cho tương thích codebase hiện tại.
    Không còn tự tạo demo user nữa.
    """
    _ = db
    return None