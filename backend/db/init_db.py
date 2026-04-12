from __future__ import annotations

from sqlalchemy.orm import Session

from utils.demo_user import get_or_create_demo_user_id


def init_db(db: Session) -> None:
    """
    Init tối thiểu cho giai đoạn V1.
    Không tạo schema ở đây vì schema đã được dựng bằng SQL.
    Chỉ đảm bảo demo user tồn tại nếu app cần dữ liệu owner mặc định.
    """
    get_or_create_demo_user_id(db)