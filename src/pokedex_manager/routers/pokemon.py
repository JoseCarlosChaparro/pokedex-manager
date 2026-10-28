from fastapi import APIRouter, Query
from pokedex_manager.services import pokeapi

router = APIRouter(prefix="/api", tags=["Pokemon"])

@router.get("/pokemon")
async def get_pokemon(limit: int = Query(20, ge=1, le=50), offset: int = Query(0, ge=0)):
    pokemon = await pokeapi.get_pokemon_task(limit, offset)
    return pokemon

@router.get("/pokemon/{id}")
async def get_pokemon_by_id(id: str):
    pokemon = await pokeapi.get_pokemon_by_id_task(id)
    return pokemon