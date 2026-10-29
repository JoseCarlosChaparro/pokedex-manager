from pydantic import BaseModel


class Ability(BaseModel):
    name: str
    is_hidden: bool


class Stat(BaseModel):
    name: str
    value: int


class PokemonImages(BaseModel):
    sprite: str | None
    shiny: str | None
    artwork: str | None


class PokemonDetail(BaseModel):
    id: int
    name: str
    types: list[str]
    height_m: float
    weight_kg: float
    abilities: list[Ability]
    stats: list[Stat]
    images: PokemonImages
    cry: str | None
