import uuid

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    # bcrypt truncates at 72 bytes; cap here so that's a documented decision.
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    has_seen_intro: bool
    dismissed_hints: list[str]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    user: UserRead
    access_token: str
