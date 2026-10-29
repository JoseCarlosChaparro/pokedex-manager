from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from pokedex_manager.clock import Clock
from pokedex_manager.repositories.favorites import FavoriteRepository
from pokedex_manager.repositories.revoked_tokens import RevokedTokenRepository
from pokedex_manager.repositories.users import UserRepository
from pokedex_manager.services.auth import TokenService
from pokedex_manager.services.pokeapi import PokeAPIClient

bearer_scheme = HTTPBearer(auto_error=False)


# The composition root (app.create_app) stores every service in app.state; routes receive them here.
def get_users(request: Request) -> UserRepository:
    return request.app.state.users


def get_revoked_tokens(request: Request) -> RevokedTokenRepository:
    return request.app.state.revoked_tokens


def get_favorites(request: Request) -> FavoriteRepository:
    return request.app.state.favorites


def get_clock(request: Request) -> Clock:
    return request.app.state.clock


def get_tokens(request: Request) -> TokenService:
    return request.app.state.tokens


def get_pokeapi(request: Request) -> PokeAPIClient:
    return request.app.state.pokeapi


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    tokens: Annotated[TokenService, Depends(get_tokens)],
    revoked_tokens: Annotated[RevokedTokenRepository, Depends(get_revoked_tokens)],
) -> dict:
    if credentials is None:
        raise _unauthorized("Not authenticated")
    try:
        payload = tokens.decode_access_token(credentials.credentials)
    except jwt.InvalidTokenError as error:
        raise _unauthorized("Invalid or expired token") from error

    if await revoked_tokens.is_revoked(payload["jti"]):
        raise _unauthorized("Token has been revoked")
    return payload


def get_current_user_id(payload: Annotated[dict, Depends(get_token_payload)]) -> str:
    return payload["sub"]
