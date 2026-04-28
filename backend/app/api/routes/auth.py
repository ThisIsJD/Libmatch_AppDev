from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.core.security import verify_password
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    message: str


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    normalized_email = payload.email.strip().lower()
    stmt = select(User).where(User.email == normalized_email)
    user = db.execute(stmt).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "role": user.role,
        },
    )

    return LoginResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=LogoutResponse)
def logout(current_user: User = Depends(get_current_user)) -> LogoutResponse:
    _ = current_user
    return LogoutResponse(message="Logged out successfully. Remove token on the client.")
