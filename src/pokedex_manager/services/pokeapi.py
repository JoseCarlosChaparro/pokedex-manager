import httpx

URL = "https://pokeapi.co/api/v2/pokemon/"

async def get_pokemon_request(client: httpx.AsyncClient, limit: int, offset: int):
    response = await client.get(URL, params={"limit": limit, "offset": offset})
    return response.json()

async def get_pokemon_task(limit: int, offset: int):
    async with httpx.AsyncClient() as client:
        result = await get_pokemon_request(client, limit, offset)
        return result
