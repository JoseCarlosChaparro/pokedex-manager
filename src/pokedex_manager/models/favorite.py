from datetime import datetime

from pydantic import BaseModel


class Favorite(BaseModel):
    pokemon_id: int
    name: str
    added_at: datetime
