from __future__ import annotations

from math import ceil


def compute_total_pages(total_items: int, page_size: int) -> int:
    if page_size <= 0:
        return 0
    if total_items <= 0:
        return 0
    return ceil(total_items / page_size)