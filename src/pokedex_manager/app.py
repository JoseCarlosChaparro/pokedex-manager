from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import AsyncMongoClient

from pokedex_manager.cache import TTLCache
from pokedex_manager.clock import Clock, system_clock
from pokedex_manager.config import Settings
from pokedex_manager.exceptions.pokeapi import (
    PokeAPIError,
    PokeAPIServerError,
    PokeAPITimeoutError,
    PokemonNotFoundError,
    PokemonTypeNotFoundError,
)
from pokedex_manager.repositories.favorites import FavoriteRepository
from pokedex_manager.repositories.revoked_tokens import RevokedTokenRepository
from pokedex_manager.repositories.users import UserRepository
from pokedex_manager.routers import auth, favorites, pokemon
from pokedex_manager.services.auth import TokenService
from pokedex_manager.services.pokeapi import PokeAPIClient
from pokedex_manager.services.rate_limit import LoginAttemptGuard

POKEAPI_ERROR_STATUS = {
    PokemonNotFoundError: status.HTTP_404_NOT_FOUND,
    PokemonTypeNotFoundError: status.HTTP_404_NOT_FOUND,
    PokeAPIServerError: status.HTTP_502_BAD_GATEWAY,
    PokeAPITimeoutError: status.HTTP_504_GATEWAY_TIMEOUT,
}


async def pokeapi_error_handler(request: Request, exc: PokeAPIError) -> JSONResponse:
    status_code = POKEAPI_ERROR_STATUS.get(type(exc), status.HTTP_502_BAD_GATEWAY)
    return JSONResponse(status_code=status_code, content={"detail": str(exc)})


def create_app(
    settings: Settings,
    pokeapi_transport: httpx.AsyncBaseTransport | None = None,
    clock: Clock = system_clock,
) -> FastAPI:
    """Composition root: the only place where concrete adapters (Mongo, HTTP, clock) are wired."""

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        mongo = AsyncMongoClient(settings.mongo_url)
        database = mongo[settings.mongo_db_name]
        http_client = httpx.AsyncClient(transport=pokeapi_transport, timeout=settings.pokeapi_timeout_seconds)

        app.state.users = UserRepository(database)
        app.state.revoked_tokens = RevokedTokenRepository(database)
        app.state.favorites = FavoriteRepository(database)
        app.state.clock = clock
        app.state.login_guard = LoginAttemptGuard(clock)
        app.state.tokens = TokenService(settings.jwt_secret_key, clock)
        app.state.pokeapi = PokeAPIClient(
            http_client, settings.pokeapi_base_url, TTLCache(settings.pokeapi_cache_ttl_seconds, clock)
        )

        await app.state.users.ensure_indexes()
        await app.state.revoked_tokens.ensure_indexes()
        await app.state.favorites.ensure_indexes()
        try:
            yield
        finally:
            await http_client.aclose()
            await mongo.close()

    app = FastAPI(title="PokéDex Manager", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(PokeAPIError, pokeapi_error_handler)
    app.include_router(auth.router)
    app.include_router(pokemon.router)
    app.include_router(favorites.router)
    return app
