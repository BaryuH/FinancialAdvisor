from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import conflict
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from models.user import User
from repositories.user_repository import UserRepository
from schemas.auth import (
    AuthSessionResponse,
    AuthUserResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
)


class AuthService:
    @staticmethod
    def register(db: Session, payload: RegisterRequest) -> AuthSessionResponse:
        normalized_email = payload.email.strip().lower()

        existing_user = UserRepository.get_by_email(db, normalized_email)
        if existing_user is not None:
            raise conflict("Email already exists.")

        password_hash = hash_password(payload.password)
        user = UserRepository.create(
            db,
            email=normalized_email,
            password_hash=password_hash,
            display_name=payload.display_name,
        )

        return AuthService._build_session_response(user)

    @staticmethod
    def login(db: Session, payload: LoginRequest) -> AuthSessionResponse:
        normalized_email = payload.email.strip().lower()
        user = UserRepository.get_by_email(db, normalized_email)

        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return AuthService._build_session_response(user)

    @staticmethod
    def refresh(db: Session, payload: RefreshTokenRequest) -> AuthSessionResponse:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")

        try:
            user_id = UUID(str(token_payload["sub"]))
        except (ValueError, TypeError, KeyError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            ) from exc

        user = UserRepository.get_by_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        token_version = int(token_payload.get("ver", -1))
        if token_version != user.token_version:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked.",
            )

        return AuthService._build_session_response(user)

    @staticmethod
    def logout(db: Session, current_user: User) -> None:
        UserRepository.increment_token_version(db, current_user)

    @staticmethod
    def _build_session_response(user: User) -> AuthSessionResponse:
        access_token = create_access_token(
            user_id=user.id,
            token_version=user.token_version,
        )
        refresh_token = create_refresh_token(
            user_id=user.id,
            token_version=user.token_version,
        )

        return AuthSessionResponse(
            user=AuthUserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            access_token_expires_in=settings.access_token_expire_minutes * 60,
            refresh_token_expires_in=settings.refresh_token_expire_minutes * 60,
        )