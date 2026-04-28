from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from db.session import get_db
from models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)
TokenType = Literal["access", "refresh"]


def _unauthorized(detail: str = "Not authenticated.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False


from utils.dates import get_now


def _create_token(
    *,
    subject: str,
    token_type: TokenType,
    token_version: int,
    expires_delta: timedelta,
) -> str:
    now = get_now()
    payload = {
        "sub": subject,
        "type": token_type,
        "ver": token_version,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(*, user_id: UUID | str, token_version: int = 0) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="access",
        token_version=token_version,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(*, user_id: UUID | str, token_version: int = 0) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="refresh",
        token_version=token_version,
        expires_delta=timedelta(minutes=settings.refresh_token_expire_minutes),
    )


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.InvalidTokenError as exc:
        raise _unauthorized("Invalid or expired token.") from exc

    if expected_type is not None and payload.get("type") != expected_type:
        raise _unauthorized("Token type is not valid.")

    if "sub" not in payload:
        raise _unauthorized("Token subject is missing.")

    return payload


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    stmt = select(User).where(User.id == user_id).limit(1)
    return db.scalar(stmt)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    token_payload = decode_token(credentials.credentials, expected_type="access")

    try:
        user_id = UUID(str(token_payload["sub"]))
    except (ValueError, TypeError, KeyError) as exc:
        raise _unauthorized("Invalid or expired token.") from exc

    user = get_user_by_id(db, user_id)
    if user is None:
        raise _unauthorized("User not found.")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    token_version = int(token_payload.get("ver", -1))
    if token_version != user.token_version:
        raise _unauthorized("Token has been revoked.")

    return user