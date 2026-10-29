from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from pokedex_manager.exceptions.auth import EmailAlreadyRegisteredError


class UserRepository:
    """Repository pattern: the only code that knows how users are stored."""

    def __init__(self, database: AsyncDatabase):
        self._collection = database["users"]

    async def ensure_indexes(self) -> None:
        await self._collection.create_index("email", unique=True)

    async def create(self, email: str, password_hash: str) -> str:
        try:
            result = await self._collection.insert_one({"email": email, "password_hash": password_hash})
        except DuplicateKeyError as error:
            raise EmailAlreadyRegisteredError(email) from error
        return str(result.inserted_id)

    async def upsert_password(self, email: str, password_hash: str) -> None:
        await self._collection.update_one({"email": email}, {"$set": {"password_hash": password_hash}}, upsert=True)

    async def find_by_email(self, email: str) -> dict | None:
        return await self._collection.find_one({"email": email})
