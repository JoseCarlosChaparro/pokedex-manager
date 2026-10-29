from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from pokedex_manager.dependencies import get_pokeapi, get_token_payload
from pokedex_manager.models.pokemon import PokemonDetail, PokemonSummary
from pokedex_manager.services.pokeapi import PokeAPIClient
from pokedex_manager.services.search import suggest

router = APIRouter(prefix="/api", tags=["Pokemon"], dependencies=[Depends(get_token_payload)])

PokeAPI = Annotated[PokeAPIClient, Depends(get_pokeapi)]
Limit = Annotated[int, Query(ge=1, le=50)]
Offset = Annotated[int, Query(ge=0)]


@router.get("/pokemon")
async def list_pokemon(pokeapi: PokeAPI, limit: Limit = 20, offset: Offset = 0):
    return await pokeapi.list_pokemon(limit, offset)


@router.get("/pokemon/index", response_model=list[PokemonSummary])
async def pokedex_index(pokeapi: PokeAPI):
    return await pokeapi.get_pokedex_index()


@router.get("/pokemon/suggest")
async def suggest_pokemon(
    pokeapi: PokeAPI,
    q: Annotated[str, Query(min_length=1)],
    limit: Annotated[int, Query(ge=1, le=20)] = 8,
):
    if not q.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="q must not be blank")
    index = await pokeapi.get_name_index()
    return [match._asdict() for match in suggest(index, q, limit)]


@router.get("/pokemon/search", response_model=PokemonDetail)
async def search_pokemon(pokeapi: PokeAPI, name: str = Query(...)):
    clean_name = name.strip().lower()
    if not clean_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="name must not be blank")
    return await pokeapi.get_pokemon(clean_name)


@router.get("/pokemon/{id_or_name}", response_model=PokemonDetail)
async def get_pokemon(id_or_name: str, pokeapi: PokeAPI):
    return await pokeapi.get_pokemon(id_or_name)


@router.get("/pokemon/type/{type_name}")
async def list_pokemon_by_type(type_name: str, pokeapi: PokeAPI, limit: Limit = 20, offset: Offset = 0):
    return await pokeapi.list_pokemon_by_type(type_name, limit, offset)
