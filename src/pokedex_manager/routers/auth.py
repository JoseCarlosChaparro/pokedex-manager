from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from pokedex_manager.dependencies import (
    get_login_guard,
    get_revoked_tokens,
    get_token_payload,
    get_tokens,
    get_users,
)
from pokedex_manager.exceptions.auth import EmailAlreadyRegisteredError
from pokedex_manager.models.user import AccessToken, LoginCredentials, RegisterCredentials, UserPublic
from pokedex_manager.repositories.revoked_tokens import RevokedTokenRepository
from pokedex_manager.repositories.users import UserRepository
from pokedex_manager.services.auth import TokenService, hash_password, verify_password
from pokedex_manager.services.rate_limit import LoginAttemptGuard, TooManyLoginAttemptsError

router = APIRouter(prefix="/auth", tags=["Auth"])

UNKNOWN_CLIENT_IP = "unknown"

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
async def login(
    credentials: LoginCredentials,
    request: Request,
    users: Users,
    tokens: Tokens,
    guard: Annotated[LoginAttemptGuard, Depends(get_login_guard)],
):
    email = credentials.email.lower()
    client_ip = request.client.host if request.client else UNKNOWN_CLIENT_IP
    try:
        guard.check(email, client_ip)
    except TooManyLoginAttemptsError as error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Try again later.",
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error

    user = await users.find_by_email(email)
    if user is None or not verify_password(credentials.password, user["password_hash"]):
        guard.record_failure(email, client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    guard.record_success(email)
    return AccessToken(access_token=tokens.create_access_token(str(user["_id"])))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: Annotated[dict, Depends(get_token_payload)],
    revoked_tokens: Annotated[RevokedTokenRepository, Depends(get_revoked_tokens)],
):
    await revoked_tokens.revoke(payload["jti"], TokenService.expires_at(payload))
