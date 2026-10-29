from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from pokedex_manager.clock import Clock
from pokedex_manager.dependencies import get_clock, get_current_user_id, get_favorites, get_pokeapi
from pokedex_manager.models.favorite import Favorite
from pokedex_manager.repositories.favorites import FavoriteRepository
from pokedex_manager.services.pokeapi import PokeAPIClient

router = APIRouter(prefix="/api/me/favorites", tags=["Favorites"])

UserId = Annotated[str, Depends(get_current_user_id)]
Favorites = Annotated[FavoriteRepository, Depends(get_favorites)]
PokemonId = Annotated[int, Path(ge=1)]


@router.get("", response_model=list[Favorite])
async def list_favorites(user_id: UserId, favorites: Favorites):
    return await favorites.list_for_user(user_id)


@router.put("/{pokemon_id}", response_model=Favorite)
async def add_favorite(
    pokemon_id: PokemonId,
    user_id: UserId,
    favorites: Favorites,
    pokeapi: Annotated[PokeAPIClient, Depends(get_pokeapi)],
    clock: Annotated[Clock, Depends(get_clock)],
):
    pokemon = await pokeapi.get_pokemon(pokemon_id)
    added_at = datetime.fromtimestamp(clock(), tz=UTC)
    return await favorites.add(user_id, pokemon_id, pokemon.name, added_at)


@router.post("/{pokemon_id}/open", response_model=Favorite)
async def open_favorite_pack(pokemon_id: PokemonId, user_id: UserId, favorites: Favorites):
    favorite = await favorites.mark_opened(user_id, pokemon_id)
    if favorite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pokémon is not in your collection")
    return favorite


@router.delete("/{pokemon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(pokemon_id: PokemonId, user_id: UserId, favorites: Favorites):
    await favorites.remove(user_id, pokemon_id)
