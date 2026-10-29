from datetime import datetime

from pydantic import BaseModel


class Favorite(BaseModel):
    pokemon_id: int
    name: str
    added_at: datetime
    # New favorites are stored with opened=False (a sealed pack); favorites saved before packs existed
    # have no field and count as already opened
    opened: bool = True
