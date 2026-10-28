from pydantic import BaseModel, EmailStr, Field

PASSWORD_MIN_LENGTH = 8

class UserCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH)


class UserPublic(BaseModel):
    id: str
    email: EmailStr