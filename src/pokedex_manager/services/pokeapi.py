import httpx
from pokedex_manager.exceptions.pokeapi import (
    PokemonNotFoundError,
    PokeAPIServerError,
    PokeAPITimeoutError
    )

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"

POKEAPI_POKEMON_ENDPOINT_BASE_URL = POKEAPI_BASE_URL + '/pokemon'


async def _get_from_pokeapi(client: httpx.AsyncClient, url: str, params: dict | None = None):
    try:
        response = await client.get(url, params=params)
    except httpx.TimeoutException as e:
        raise PokeAPITimeoutError("PokeAPI timed out") from e

    if response.is_server_error:
        raise PokeAPIServerError("PokeAPI server error")

    return response


async def get_pokemon_request(client: httpx.AsyncClient, limit: int, offset: int):
    list_pokemon_url = POKEAPI_POKEMON_ENDPOINT_BASE_URL
    response = await _get_from_pokeapi(client, list_pokemon_url, params={"limit": limit, "offset": offset})
    return response.json()

async def get_pokemon_task(limit: int, offset: int):
    async with httpx.AsyncClient() as client:
        result = await get_pokemon_request(client, limit, offset)
        return result

async def get_pokemon_by_id_request(client: httpx.AsyncClient, id_or_name: str):
    pokemon_by_id_url = f"{POKEAPI_POKEMON_ENDPOINT_BASE_URL}/{id_or_name}"
    response = await _get_from_pokeapi(client,pokemon_by_id_url)

    if response.status_code == httpx.codes.NOT_FOUND:
        raise PokemonNotFoundError(id_or_name)

    return response.json()

async def get_pokemon_by_id_task(id_or_name: str):
    async with httpx.AsyncClient() as client:
        result = await get_pokemon_by_id_request(client, id_or_name)
        return result
