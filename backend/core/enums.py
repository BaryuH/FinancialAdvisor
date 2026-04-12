from enum import Enum


class CategoryFlowType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionSource(str, Enum):
    MANUAL = "manual"
    VOICE = "voice"
    OCR = "ocr"


class SmartInputMode(str, Enum):
    VOICE = "voice"
    OCR = "ocr"


class SmartInputStatus(str, Enum):
    PROCESSING = "processing"
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    DISCARDED = "discarded"