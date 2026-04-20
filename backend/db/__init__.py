from __future__ import annotations

from sqlalchemy.orm import Session

from utils.demo_user import get_or_create_demo_user_id


def init_db(db: Session) -> None:
    """
    Init tối thiểu cho giai đoạn hiện tại.
    Không tạo schema ở đây vì schema đã được dựng bằng SQL.
    Vẫn giữ demo user để các endpoint business cũ chưa gắn auth thật không bị vỡ.
    """
    get_or_create_demo_user_id(db)