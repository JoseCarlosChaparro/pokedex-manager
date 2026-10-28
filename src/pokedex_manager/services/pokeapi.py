import httpx
from pokedex_manager.exceptions.pokeapi import (
    PokemonNotFoundError,
    PokeAPIServerError,
    PokeAPITimeoutError
    )

POKEAPI_BASE_URL = "https://pokeapi.co/api/v2"

POKEAPI_POKEMON_ENDPOINT_BASE_URL = POKEAPI_BASE_URL + '/pokemon'

async def get_pokemon_request(client: httpx.AsyncClient, limit: int, offset: int):
    list_pokemon_url = POKEAPI_POKEMON_ENDPOINT_BASE_URL
    try:
        response = await client.get(list_pokemon_url, params={"limit": limit, "offset": offset})
    except httpx.TimeoutException as e:
        raise PokeAPITimeoutError("PokeAPI timed out") from e

    if response.is_server_error:
        raise PokeAPIServerError("PokeAPI server error")
    
    return response.json()

async def get_pokemon_task(limit: int, offset: int):
    async with httpx.AsyncClient() as client:
        result = await get_pokemon_request(client, limit, offset)
        return result

async def get_pokemon_by_id_request(client: httpx.AsyncClient, id_or_name: str):
    pokemon_by_id_url = POKEAPI_POKEMON_ENDPOINT_BASE_URL + f'/{id_or_name}'
    try:
        response = await client.get(pokemon_by_id_url)
    except httpx.TimeoutException as e:
        raise PokeAPITimeoutError("PokeAPI timed out") from e

    if response.status_code == httpx.codes.NOT_FOUND:
        raise PokemonNotFoundError(id_or_name)

    if response.is_server_error:
        raise PokeAPIServerError("PokeAPI server error")

    return response.json()

async def get_pokemon_by_id_task(id_or_name: str):
    async with httpx.AsyncClient() as client:
        result = await get_pokemon_by_id_request(client, id_or_name)
        return result