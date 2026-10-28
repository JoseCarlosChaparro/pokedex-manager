from fastapi import APIRouter, Query, HTTPException, status
from pokedex_manager.services import pokeapi

router = APIRouter(prefix="/api", tags=["Pokemon"])

@router.get("/pokemon")
async def get_pokemon(limit: int = Query(20, ge=1, le=50), offset: int = Query(0, ge=0)):
    pokemon = await pokeapi.get_pokemon_task(limit, offset)
    return pokemon

@router.get("/pokemon/search")
async def search_pokemon(name: str = Query(...)):
    clean_name = name.strip().lower()
    if not clean_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="name must not be blank")
    return await pokeapi.get_pokemon_by_id_task(clean_name)

@router.get("/pokemon/{id_or_name}")
async def get_pokemon_by_id(id_or_name: str):
    pokemon = await pokeapi.get_pokemon_by_id_task(id_or_name)
    return pokemon