from __future__ import annotations


def get_or_create_demo_user_id(*args, **kwargs):
    raise RuntimeError(
        "demo_user flow has been removed. "
        "Please update the caller to use authenticated current_user instead."
    )