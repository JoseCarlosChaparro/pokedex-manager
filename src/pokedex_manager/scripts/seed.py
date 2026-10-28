import asyncio

from pokedex_manager.db import client, users_collection
from pokedex_manager.services.auth import hash_password

TEST_USERS = [
    {"email": "maria.garcia@example.com", "password": "Maria2026!"},
    {"email": "juan.lopez@example.com", "password": "JuanLopez123"},
    {"email": "ana.martinez@example.com", "password": "AnaMtz2026"},
    {"email": "carlos.hernandez@example.com", "password": "Carlos12345"},
]

async def seed_users() -> None:
    await users_collection.create_index("email", unique=True)
    for user in TEST_USERS:
        await users_collection.update_one(
            {"email": user["email"]},
            {"$set": {"password_hash": hash_password(user["password"])}},
            upsert=True,
        )
    await client.close()
    print(f"Seeded {len(TEST_USERS)} test users")


if __name__ == "__main__":
    asyncio.run(seed_users())