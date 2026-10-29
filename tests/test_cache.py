from pokedex_manager.cache import TTLCache
from tests.fakes import FakeClock

TTL_SECONDS = 60


def test_returns_stored_value_before_ttl():
    clock = FakeClock()
    cache = TTLCache(TTL_SECONDS, clock)
    cache.set("k", {"v": 1})

    clock.advance(TTL_SECONDS - 1)

    assert cache.get("k") == {"v": 1}


def test_expires_after_ttl():
    clock = FakeClock()
    cache = TTLCache(TTL_SECONDS, clock)
    cache.set("k", "value")

    clock.advance(TTL_SECONDS)

    assert cache.get("k") is None


def test_evicts_oldest_entry_when_full():
    cache = TTLCache(TTL_SECONDS, FakeClock(), max_entries=2)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)

    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("c") == 3


def test_pokemon_detail_is_fetched_once_within_ttl(client, auth_headers, fake_pokeapi):
    client.get("/api/pokemon/pikachu", headers=auth_headers)
    client.get("/api/pokemon/PIKACHU", headers=auth_headers)

    assert fake_pokeapi.requests.count("/api/v2/pokemon/pikachu") == 1


def test_type_pages_share_one_upstream_call(client, auth_headers, fake_pokeapi):
    client.get("/api/pokemon/type/electric", params={"offset": 0, "limit": 1}, headers=auth_headers)
    client.get("/api/pokemon/type/electric", params={"offset": 1, "limit": 1}, headers=auth_headers)

    assert fake_pokeapi.requests.count("/api/v2/type/electric") == 1


def test_cached_data_is_refetched_after_ttl(client, auth_headers, fake_pokeapi, clock, settings):
    client.get("/api/pokemon/25", headers=auth_headers)
    clock.advance(settings.pokeapi_cache_ttl_seconds)
    client.get("/api/pokemon/25", headers=auth_headers)

    assert fake_pokeapi.requests.count("/api/v2/pokemon/25") == 2


def test_errors_are_not_cached(client, auth_headers, fake_pokeapi):
    fake_pokeapi.fail_with = 500
    assert client.get("/api/pokemon/25", headers=auth_headers).status_code == 502

    fake_pokeapi.fail_with = None
    assert client.get("/api/pokemon/25", headers=auth_headers).status_code == 200
