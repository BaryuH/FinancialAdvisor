from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.security import get_current_user
from db.session import get_db
from models.user import User
from schemas.auth import (
    AuthSessionResponse,
    AuthUserResponse,
    LoginRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RegisterRequest,
)
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    return AuthService.register(db, payload)


@router.post(
    "/login",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    return AuthService.login(db, payload)


@router.post(
    "/refresh",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
)
def refresh(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    return AuthService.refresh(db, payload)


@router.get(
    "/me",
    response_model=AuthUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user",
)
def me(current_user: User = Depends(get_current_user)) -> AuthUserResponse:
    return AuthUserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout current user",
)
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LogoutResponse:
    AuthService.logout(db, current_user)
    return LogoutResponse(detail="Logged out successfully.")