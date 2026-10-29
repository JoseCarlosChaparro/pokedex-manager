import os
import uuid

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from pokedex_manager.app import create_app
from pokedex_manager.config import Settings
from tests.fakes import FAKE_POKEAPI_BASE_URL, FakeClock, FakePokeAPI

TEST_MONGO_URL = os.getenv("TEST_MONGO_URL", "mongodb://localhost:27017")
TEST_PASSWORD = "Password123"


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
        mongo_db_name=f"pokedex_test_{uuid.uuid4().hex[:8]}",
        jwt_secret_key="test-secret-key-with-enough-length-1234",
        pokeapi_base_url=FAKE_POKEAPI_BASE_URL,
        pokeapi_cache_ttl_seconds=60,
    )


@pytest.fixture
def client(settings, fake_pokeapi, clock):
    app = create_app(settings, pokeapi_transport=fake_pokeapi.transport, clock=clock)
    with TestClient(app) as test_client:
        yield test_client
    with MongoClient(settings.mongo_url) as mongo:
        mongo.drop_database(settings.mongo_db_name)


def register(client: TestClient, email: str, password: str = TEST_PASSWORD):
    return client.post("/auth/register", json={"email": email, "password": password})


def login(client: TestClient, email: str, password: str = TEST_PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


@pytest.fixture
def auth_headers(client) -> dict:
    register(client, "ash@example.com")
    token = login(client, "ash@example.com").json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
