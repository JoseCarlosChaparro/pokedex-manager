from pydantic import BaseModel, EmailStr, Field

PASSWORD_MIN_LENGTH = 8

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str
class RegisterCredentials(LoginCredentials):
    password: str = Field(min_length=PASSWORD_MIN_LENGTH)

class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
class UserPublic(BaseModel):
    id: str
    email: EmailStr