from collections.abc import Callable

import httpx

from pokedex_manager.cache import TTLCache
from pokedex_manager.exceptions.pokeapi import (
    PokeAPIError,
    PokeAPIServerError,
    PokeAPITimeoutError,
    PokemonNotFoundError,
    PokemonTypeNotFoundError,
)


class PokeAPIClient:
    """Adapter pattern: speaks PokéAPI's HTTP API and returns plain data or domain errors."""

    def __init__(self, http_client: httpx.AsyncClient, base_url: str, cache: TTLCache):
        self._http = http_client
        self._base_url = base_url
        self._cache = cache

    async def list_pokemon(self, limit: int, offset: int) -> dict:
        return await self._get_json("/pokemon", params={"limit": limit, "offset": offset})

    async def get_pokemon(self, id_or_name: str | int) -> dict:
        key = str(id_or_name).strip().lower()
        return await self._get_json(f"/pokemon/{key}", on_not_found=lambda: PokemonNotFoundError(key))

    async def list_pokemon_by_type(self, type_name: str, limit: int, offset: int) -> dict:
        key = type_name.strip().lower()
        data = await self._get_json(f"/type/{key}", on_not_found=lambda: PokemonTypeNotFoundError(key))
        entries = data["pokemon"]
        page = entries[offset : offset + limit]
        return {"count": len(entries), "results": [entry["pokemon"] for entry in page]}

    async def _get_json(
        self,
        path: str,
        params: dict | None = None,
        on_not_found: Callable[[], PokeAPIError] | None = None,
    ) -> dict:
        cache_key = (path, tuple(sorted((params or {}).items())))
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        data = await self._fetch_json(path, params, on_not_found)
        self._cache.set(cache_key, data)
        return data

    async def _fetch_json(
        self,
        path: str,
        params: dict | None,
        on_not_found: Callable[[], PokeAPIError] | None,
    ) -> dict:
        try:
            response = await self._http.get(f"{self._base_url}{path}", params=params)
        except httpx.TimeoutException as error:
            raise PokeAPITimeoutError("PokeAPI timed out") from error
        except httpx.TransportError as error:
            raise PokeAPIServerError("PokeAPI is unreachable") from error

        if response.status_code == httpx.codes.NOT_FOUND and on_not_found:
            raise on_not_found()
        if response.is_server_error:
            raise PokeAPIServerError("PokeAPI server error")
        if not response.is_success:
            raise PokeAPIError(f"Unexpected PokeAPI response: {response.status_code}")
        return response.json()
