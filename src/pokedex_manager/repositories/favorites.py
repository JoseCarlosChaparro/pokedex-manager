from datetime import datetime

from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase


class FavoriteRepository:
    """Each user's personal collection of Pokémon; one document per (user, Pokémon)."""

    def __init__(self, database: AsyncDatabase):
        self._collection = database["favorites"]

    async def ensure_indexes(self) -> None:
        await self._collection.create_index([("user_id", ASCENDING), ("pokemon_id", ASCENDING)], unique=True)
        await self._collection.create_index([("user_id", ASCENDING), ("added_at", ASCENDING)])

    async def list_for_user(self, user_id: str) -> list[dict]:
        cursor = self._collection.find({"user_id": user_id}, {"_id": 0, "user_id": 0}).sort("added_at", ASCENDING)
        return await cursor.to_list()

    async def add(self, user_id: str, pokemon_id: int, name: str, added_at: datetime) -> dict:
        """Idempotent: adding an existing favorite keeps its original date."""
        key = {"user_id": user_id, "pokemon_id": pokemon_id}
        await self._collection.update_one(
            key, {"$setOnInsert": {"name": name, "added_at": added_at, "opened": False}}, upsert=True
        )
        return await self._collection.find_one(key, {"_id": 0, "user_id": 0})

    async def mark_opened(self, user_id: str, pokemon_id: int) -> dict | None:
        """Opens the sealed pack of a favorite; None when it is not a favorite."""
        key = {"user_id": user_id, "pokemon_id": pokemon_id}
        result = await self._collection.update_one(key, {"$set": {"opened": True}})
        if result.matched_count == 0:
            return None
        return await self._collection.find_one(key, {"_id": 0, "user_id": 0})

    async def remove(self, user_id: str, pokemon_id: int) -> None:
        await self._collection.delete_one({"user_id": user_id, "pokemon_id": pokemon_id})
