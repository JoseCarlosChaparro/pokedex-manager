import asyncio
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
from pokedex_manager.models.pokemon import Ability, PokemonDetail, PokemonImages, PokemonSummary, Stat
from pokedex_manager.services.search import PokemonName

# Larger than the whole Pokédex, so a single request returns every name
NAME_INDEX_LIMIT = 100_000
NAME_INDEX_CACHE_KEY = ("name-index",)
POKEDEX_INDEX_CACHE_KEY = ("pokedex-index",)
POKEMON_TYPES = (
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground",
    "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
)  # fmt: skip


# PokéAPI returns height in decimeters and weight in hectograms
DECIMETERS_PER_METER = 10
HECTOGRAMS_PER_KILOGRAM = 10


def _to_pokemon_detail(data: dict) -> PokemonDetail:
    sprites = data["sprites"]
    return PokemonDetail(
        id=data["id"],
        name=data["name"],
        types=[entry["type"]["name"] for entry in sorted(data["types"], key=lambda entry: entry["slot"])],
        height_m=data["height"] / DECIMETERS_PER_METER,
        weight_kg=data["weight"] / HECTOGRAMS_PER_KILOGRAM,
        abilities=[Ability(name=a["ability"]["name"], is_hidden=a["is_hidden"]) for a in data["abilities"]],
        stats=[Stat(name=s["stat"]["name"], value=s["base_stat"]) for s in data["stats"]],
        images=PokemonImages(
            sprite=sprites.get("front_default"),
            shiny=sprites.get("front_shiny"),
            artwork=sprites.get("other", {}).get("official-artwork", {}).get("front_default"),
        ),
        cry=data.get("cries", {}).get("latest"),
    )


def _id_from_resource_url(url: str) -> int:
    return int(url.rstrip("/").rsplit("/", 1)[-1])


class PokeAPIClient:
    """Adapter pattern: speaks PokéAPI's HTTP API and returns plain data or domain errors."""

    def __init__(self, http_client: httpx.AsyncClient, base_url: str, cache: TTLCache):
        self._http = http_client
        self._base_url = base_url
        self._cache = cache

    async def list_pokemon(self, limit: int, offset: int) -> dict:
        return await self._get_json("/pokemon", params={"limit": limit, "offset": offset})

    async def get_pokemon(self, id_or_name: str | int) -> PokemonDetail:
        key = str(id_or_name).strip().lower()
        data = await self._get_json(f"/pokemon/{key}", on_not_found=lambda: PokemonNotFoundError(key))
        return _to_pokemon_detail(data)

    async def get_name_index(self) -> tuple[PokemonName, ...]:
        """Every Pokémon name, parsed once per TTL (it is read on every autocomplete keystroke)."""
        cached = self._cache.get(NAME_INDEX_CACHE_KEY)
        if cached is not None:
            return cached
        data = await self._fetch_json("/pokemon", {"limit": NAME_INDEX_LIMIT, "offset": 0}, on_not_found=None)
        index = tuple(PokemonName(_id_from_resource_url(entry["url"]), entry["name"]) for entry in data["results"])
        self._cache.set(NAME_INDEX_CACHE_KEY, index)
        return index

    async def get_pokedex_index(self) -> tuple[PokemonSummary, ...]:
        """Every Pokémon with its types, built from the 18 type lists (cached), so clients can filter instantly."""
        cached = self._cache.get(POKEDEX_INDEX_CACHE_KEY)
        if cached is not None:
            return cached
        type_lists = await asyncio.gather(*(self._type_entries(type_name) for type_name in POKEMON_TYPES))

        slots_by_id: dict[int, dict] = {}
        for type_name, entries in zip(POKEMON_TYPES, type_lists, strict=True):
            for entry in entries:
                pokemon_id = _id_from_resource_url(entry["pokemon"]["url"])
                summary = slots_by_id.setdefault(pokemon_id, {"name": entry["pokemon"]["name"], "types": {}})
                summary["types"][entry["slot"]] = type_name

        index = tuple(
            PokemonSummary(
                id=pokemon_id, name=data["name"], types=[data["types"][slot] for slot in sorted(data["types"])]
            )
            for pokemon_id, data in sorted(slots_by_id.items())
        )
        self._cache.set(POKEDEX_INDEX_CACHE_KEY, index)
        return index

    async def _type_entries(self, type_name: str) -> list[dict]:
        try:
            data = await self._get_json(f"/type/{type_name}", on_not_found=lambda: PokemonTypeNotFoundError(type_name))
        except PokemonTypeNotFoundError:
            return []
        return data["pokemon"]

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
