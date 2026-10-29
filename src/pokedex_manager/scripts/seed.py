import asyncio

from pymongo import AsyncMongoClient

from pokedex_manager.config import Settings
from pokedex_manager.repositories.users import UserRepository
from pokedex_manager.services.auth import hash_password

TEST_USERS = [
    {"email": "maria.garcia@example.com", "password": "Maria2026!"},
    {"email": "juan.lopez@example.com", "password": "JuanLopez123"},
    {"email": "ana.martinez@example.com", "password": "AnaMtz2026"},
    {"email": "carlos.hernandez@example.com", "password": "Carlos12345"},
]


async def seed_users(settings: Settings) -> None:
    async with AsyncMongoClient(settings.mongo_url) as mongo:
        users = UserRepository(mongo[settings.mongo_db_name])
        await users.ensure_indexes()
        for user in TEST_USERS:
            await users.upsert_password(user["email"], hash_password(user["password"]))
    print(f"Seeded {len(TEST_USERS)} test users")


if __name__ == "__main__":
    asyncio.run(seed_users(Settings.from_env()))
