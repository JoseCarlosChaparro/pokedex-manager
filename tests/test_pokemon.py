from tests.fakes import TIMEOUT


def test_list_paginates_through_pokeapi(client, auth_headers):
    response = client.get("/api/pokemon", params={"limit": 2, "offset": 1}, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 6
    assert [p["name"] for p in body["results"]] == ["charmander", "charizard"]


def test_list_rejects_limit_above_maximum(client, auth_headers):
    response = client.get("/api/pokemon", params={"limit": 51}, headers=auth_headers)

    assert response.status_code == 422


def test_detail_by_name_or_id(client, auth_headers):
    by_name = client.get("/api/pokemon/Pikachu", headers=auth_headers)
    by_id = client.get("/api/pokemon/25", headers=auth_headers)

    assert by_name.status_code == by_id.status_code == 200
    assert by_name.json() == by_id.json()
    assert by_name.json()["name"] == "pikachu"


def test_detail_unknown_pokemon_is_404(client, auth_headers):
    assert client.get("/api/pokemon/missingno", headers=auth_headers).status_code == 404


def test_search_trims_and_lowercases(client, auth_headers):
    response = client.get("/api/pokemon/search", params={"name": "  PIKACHU "}, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == 25


def test_search_rejects_blank_name(client, auth_headers):
    response = client.get("/api/pokemon/search", params={"name": "   "}, headers=auth_headers)

    assert response.status_code == 422


def test_type_filter_paginates_locally(client, auth_headers):
    response = client.get("/api/pokemon/type/Electric", params={"limit": 2, "offset": 1}, headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {
        "count": 3,
        "results": [
            {"name": "raichu", "url": "https://pokeapi.test/api/v2/pokemon/26/"},
            {"name": "pichu", "url": "https://pokeapi.test/api/v2/pokemon/172/"},
        ],
    }


def test_unknown_type_is_404(client, auth_headers):
    assert client.get("/api/pokemon/type/cosmic", headers=auth_headers).status_code == 404


def test_pokeapi_server_error_maps_to_502(client, auth_headers, fake_pokeapi):
    fake_pokeapi.fail_with = 500

    assert client.get("/api/pokemon", headers=auth_headers).status_code == 502


def test_pokeapi_timeout_maps_to_504(client, auth_headers, fake_pokeapi):
    fake_pokeapi.fail_with = TIMEOUT

    assert client.get("/api/pokemon/25", headers=auth_headers).status_code == 504
