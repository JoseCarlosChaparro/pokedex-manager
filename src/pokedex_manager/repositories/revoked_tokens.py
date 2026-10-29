from datetime import datetime

from pymongo.asynchronous.database import AsyncDatabase


class RevokedTokenRepository:
    """Denylist of logged-out token ids; a TTL index deletes each entry once the token would have expired."""

    def __init__(self, database: AsyncDatabase):
        self._collection = database["revoked_tokens"]

    async def ensure_indexes(self) -> None:
        await self._collection.create_index("expires_at", expireAfterSeconds=0)

    async def revoke(self, token_id: str, expires_at: datetime) -> None:
        await self._collection.update_one({"_id": token_id}, {"$set": {"expires_at": expires_at}}, upsert=True)

    async def is_revoked(self, token_id: str) -> bool:
        return await self._collection.find_one({"_id": token_id}) is not None
