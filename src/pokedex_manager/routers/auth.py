from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from pokedex_manager.dependencies import get_revoked_tokens, get_token_payload, get_tokens, get_users
from pokedex_manager.exceptions.auth import EmailAlreadyRegisteredError
from pokedex_manager.models.user import AccessToken, LoginCredentials, RegisterCredentials, UserPublic
from pokedex_manager.repositories.revoked_tokens import RevokedTokenRepository
from pokedex_manager.repositories.users import UserRepository
from pokedex_manager.services.auth import TokenService, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

Users = Annotated[UserRepository, Depends(get_users)]
Tokens = Annotated[TokenService, Depends(get_tokens)]


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
async def register(credentials: RegisterCredentials, users: Users):
    email = credentials.email.lower()
    try:
        user_id = await users.create(email, hash_password(credentials.password))
    except EmailAlreadyRegisteredError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered") from error
    return UserPublic(id=user_id, email=email)


@router.post("/login", response_model=AccessToken)
async def login(credentials: LoginCredentials, users: Users, tokens: Tokens):
    user = await users.find_by_email(credentials.email.lower())
    if user is None or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return AccessToken(access_token=tokens.create_access_token(str(user["_id"])))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: Annotated[dict, Depends(get_token_payload)],
    revoked_tokens: Annotated[RevokedTokenRepository, Depends(get_revoked_tokens)],
):
    await revoked_tokens.revoke(payload["jti"], TokenService.expires_at(payload))
