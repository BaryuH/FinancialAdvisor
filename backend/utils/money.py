from __future__ import annotations


def format_vnd_minor(amount_minor: int) -> str:
    """
    amount_minor ở dự án này chính là số đồng.
    Ví dụ: 1250000 -> '1.250.000 đ'
    """
    return f"{amount_minor:,} đ".replace(",", ".")