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
