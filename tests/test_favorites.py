import pytest

from tests.conftest import login, register

FAVORITES_URL = "/api/me/favorites"


def other_user_headers(client) -> dict:
    register(client, "gary@example.com")
    token = login(client, "gary@example.com").json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_favorites_start_empty(client, auth_headers):
    response = client.get(FAVORITES_URL, headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_add_favorite_stores_the_pokemon_name(client, auth_headers):
    response = client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["pokemon_id"] == 25
    assert response.json()["name"] == "pikachu"
    assert [f["pokemon_id"] for f in client.get(FAVORITES_URL, headers=auth_headers).json()] == [25]


def test_adding_twice_keeps_one_favorite(client, auth_headers):
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    assert len(client.get(FAVORITES_URL, headers=auth_headers).json()) == 1


def test_favorites_are_listed_in_the_order_they_were_added(client, auth_headers, clock):
    for pokemon_id in (6, 1, 25):
        client.put(f"{FAVORITES_URL}/{pokemon_id}", headers=auth_headers)
        clock.advance(1)

    ids = [f["pokemon_id"] for f in client.get(FAVORITES_URL, headers=auth_headers).json()]

    assert ids == [6, 1, 25]


def test_add_unknown_pokemon_is_404(client, auth_headers):
    assert client.put(f"{FAVORITES_URL}/9999", headers=auth_headers).status_code == 404


def test_add_invalid_id_is_422(client, auth_headers):
    assert client.put(f"{FAVORITES_URL}/0", headers=auth_headers).status_code == 422


def test_remove_favorite_is_idempotent(client, auth_headers):
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    assert client.delete(f"{FAVORITES_URL}/25", headers=auth_headers).status_code == 204
    assert client.delete(f"{FAVORITES_URL}/25", headers=auth_headers).status_code == 204
    assert client.get(FAVORITES_URL, headers=auth_headers).json() == []


def test_favorites_are_private_to_each_user(client, auth_headers):
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    assert client.get(FAVORITES_URL, headers=other_user_headers(client)).json() == []


def test_favorites_require_a_token(client):
    assert client.get(FAVORITES_URL).status_code == 401
    assert client.put(f"{FAVORITES_URL}/25").status_code == 401


@pytest.mark.anyio
async def test_concurrent_adds_of_the_same_favorite_do_not_fail(settings):
    import asyncio
    from datetime import UTC, datetime

    from pymongo import AsyncMongoClient

    from pokedex_manager.repositories.favorites import FavoriteRepository

    async with AsyncMongoClient(settings.mongo_url) as mongo:
        repository = FavoriteRepository(mongo[settings.mongo_db_name])
        await repository.ensure_indexes()
        now = datetime.now(UTC)
        await asyncio.gather(*(repository.add("u1", 25, "pikachu", now) for _ in range(10)))

        assert len(await repository.list_for_user("u1")) == 1
        await mongo.drop_database(settings.mongo_db_name)


def test_new_favorites_arrive_as_sealed_packs(client, auth_headers):
    response = client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    assert response.json()["opened"] is False


def test_opening_a_pack_is_remembered(client, auth_headers):
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)

    response = client.post(f"{FAVORITES_URL}/25/open", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["opened"] is True
    assert client.get(FAVORITES_URL, headers=auth_headers).json()[0]["opened"] is True


def test_re_adding_an_opened_favorite_keeps_it_opened(client, auth_headers):
    client.put(f"{FAVORITES_URL}/25", headers=auth_headers)
    client.post(f"{FAVORITES_URL}/25/open", headers=auth_headers)

    assert client.put(f"{FAVORITES_URL}/25", headers=auth_headers).json()["opened"] is True


def test_opening_a_pokemon_that_is_not_a_favorite_is_404(client, auth_headers):
    assert client.post(f"{FAVORITES_URL}/25/open", headers=auth_headers).status_code == 404
