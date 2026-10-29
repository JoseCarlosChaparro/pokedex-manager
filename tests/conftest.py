import os

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from pokedex_manager.app import create_app
from pokedex_manager.config import Settings
from tests.fakes import FAKE_POKEAPI_BASE_URL, FakeClock, FakePokeAPI

TEST_MONGO_URL = os.getenv("TEST_MONGO_URL", "mongodb://localhost:27017")
TEST_PASSWORD = "Password123"
TEST_DB_NAME = "pokedex_test"


@pytest.fixture
def fake_pokeapi() -> FakePokeAPI:
    return FakePokeAPI()


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def settings() -> Settings:
    return Settings(
        mongo_url=TEST_MONGO_URL,
        # One reused database, emptied after each test: a database per test exhausted Mongo's open-file limit
        mongo_db_name=TEST_DB_NAME,
        jwt_secret_key="test-secret-key-with-enough-length-1234",
        pokeapi_base_url=FAKE_POKEAPI_BASE_URL,
        pokeapi_cache_ttl_seconds=60,
    )


@pytest.fixture
def client(settings, fake_pokeapi, clock):
    empty_database(settings)
    app = create_app(settings, pokeapi_transport=fake_pokeapi.transport, clock=clock)
    with TestClient(app) as test_client:
        yield test_client
    empty_database(settings)


def empty_database(settings: Settings) -> None:
    """Deletes every document but keeps collections and indexes (cheap, no new files for Mongo)."""
    with MongoClient(settings.mongo_url) as mongo:
        database = mongo[settings.mongo_db_name]
        for name in database.list_collection_names():
            database[name].delete_many({})


def register(client: TestClient, email: str, password: str = TEST_PASSWORD):
    return client.post("/auth/register", json={"email": email, "password": password})


def login(client: TestClient, email: str, password: str = TEST_PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


@pytest.fixture
def auth_headers(client) -> dict:
    register(client, "ash@example.com")
    token = login(client, "ash@example.com").json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
