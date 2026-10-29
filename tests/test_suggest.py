from pokedex_manager.services.search import PokemonName, suggest

INDEX = [
    PokemonName(1, "bulbasaur"),
    PokemonName(25, "pikachu"),
    PokemonName(26, "raichu"),
    PokemonName(172, "pichu"),
]


def names(results: list[PokemonName]) -> list[str]:
    return [p.name for p in results]


def test_prefix_matches_come_before_substring_matches():
    index = [PokemonName(26, "raichu"), PokemonName(172, "pichu"), PokemonName(25, "pikachu")]

    assert names(suggest(index, "pi", 10)) == ["pichu", "pikachu"]
    assert names(suggest(INDEX, "chu", 10)) == ["pikachu", "raichu", "pichu"]


def test_prefix_matches_rank_above_substring_matches():
    index = [PokemonName(1, "apichu"), PokemonName(2, "pichu")]

    assert names(suggest(index, "pi", 10)) == ["pichu", "apichu"]


def test_query_is_trimmed_and_case_insensitive():
    assert names(suggest(INDEX, "  PIKA ", 10)) == ["pikachu"]


def test_numeric_query_matches_pokedex_number_prefix():
    assert names(suggest(INDEX, "2", 10)) == ["pikachu", "raichu"]


def test_limit_caps_results():
    assert len(suggest(INDEX, "u", 2)) == 2


def test_suggest_endpoint_returns_ids_and_names(client, auth_headers):
    response = client.get("/api/pokemon/suggest", params={"q": "char"}, headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == [{"id": 4, "name": "charmander"}, {"id": 6, "name": "charizard"}]


def test_suggest_endpoint_validates_query_and_limit(client, auth_headers):
    assert client.get("/api/pokemon/suggest", params={"q": "  "}, headers=auth_headers).status_code == 422
    assert client.get("/api/pokemon/suggest", params={"q": "a", "limit": 21}, headers=auth_headers).status_code == 422


def test_suggest_downloads_the_name_index_once(client, auth_headers, fake_pokeapi):
    client.get("/api/pokemon/suggest", params={"q": "pi"}, headers=auth_headers)
    client.get("/api/pokemon/suggest", params={"q": "ra"}, headers=auth_headers)

    assert fake_pokeapi.requests.count("/api/v2/pokemon") == 1
