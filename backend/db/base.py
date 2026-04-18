from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models here so Base.metadata knows all tables
from models.user import User  # noqa: E402, F401
from models.category import Category  # noqa: E402, F401
from models.budget import Budget  # noqa: E402, F401
from models.goal import Goal  # noqa: E402, F401
from models.smart_input_draft import SmartInputDraft  # noqa: E402, F401
from models.transaction import Transaction  # noqa: E402, F401