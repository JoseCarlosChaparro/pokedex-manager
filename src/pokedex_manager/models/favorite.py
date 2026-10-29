from datetime import datetime

from pydantic import BaseModel


class Favorite(BaseModel):
    pokemon_id: int
    name: str
    added_at: datetime
    # New favorites arrive as a sealed booster pack that the user opens once
    opened: bool = False
