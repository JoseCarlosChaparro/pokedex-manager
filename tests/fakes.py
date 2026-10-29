"""In-memory fakes for the app's external boundaries: PokéAPI and the clock."""

import httpx

FAKE_POKEAPI_BASE_URL = "https://pokeapi.test/api/v2"

# (id, name, types)
FAKE_POKEMON = [
    (1, "bulbasaur", ["grass", "poison"]),
    (4, "charmander", ["fire"]),
    (6, "charizard", ["fire", "flying"]),
    (25, "pikachu", ["electric"]),
    (26, "raichu", ["electric"]),
    (172, "pichu", ["electric"]),
]

TIMEOUT = "timeout"


class FakeClock:
    """Manually advanced clock returning epoch seconds."""

    def __init__(self, start: float = 1_800_000_000.0):
        self.now = start

    def __call__(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


def _resource_url(kind: str, pokemon_id: int) -> str:
    return f"{FAKE_POKEAPI_BASE_URL}/{kind}/{pokemon_id}/"


def _detail(pokemon_id: int, name: str, types: list[str]) -> dict:
    stat_names = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"]
    return {
        "id": pokemon_id,
        "name": name,
        "height": 7,
        "weight": 69,
        "types": [{"slot": slot, "type": {"name": t}} for slot, t in enumerate(types, start=1)],
        "stats": [{"base_stat": 40 + i, "stat": {"name": s}} for i, s in enumerate(stat_names)],
        "abilities": [{"ability": {"name": "static"}, "is_hidden": False}],
        "sprites": {
            "front_default": f"https://sprites.test/{pokemon_id}.png",
            "front_shiny": f"https://sprites.test/shiny/{pokemon_id}.png",
            "other": {"official-artwork": {"front_default": f"https://sprites.test/art/{pokemon_id}.png"}},
        },
        "cries": {"latest": f"https://cries.test/{pokemon_id}.ogg"},
    }


class FakePokeAPI:
    """Serves a tiny PokéAPI over httpx.MockTransport and records every request path."""

    def __init__(self):
        self.requests: list[str] = []
        self.fail_with: int | str | None = None

    @property
    def transport(self) -> httpx.MockTransport:
        return httpx.MockTransport(self.handle)

    def handle(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request.url.path)
        if self.fail_with == TIMEOUT:
            raise httpx.ReadTimeout("fake timeout", request=request)
        if self.fail_with is not None:
            return httpx.Response(self.fail_with)

        parts = request.url.path.removeprefix("/api/v2/").strip("/").split("/")
        if parts == ["pokemon"]:
            return self._list(request)
        if len(parts) == 2 and parts[0] == "pokemon":
            return self._pokemon(parts[1])
        if len(parts) == 2 and parts[0] == "type":
            return self._type(parts[1])
        return httpx.Response(404, text="Not Found")

    def _list(self, request: httpx.Request) -> httpx.Response:
        limit = int(request.url.params.get("limit", 20))
        offset = int(request.url.params.get("offset", 0))
        page = FAKE_POKEMON[offset : offset + limit]
        results = [{"name": name, "url": _resource_url("pokemon", pid)} for pid, name, _ in page]
        return httpx.Response(200, json={"count": len(FAKE_POKEMON), "results": results})

    def _pokemon(self, id_or_name: str) -> httpx.Response:
        for pid, name, types in FAKE_POKEMON:
            if id_or_name in (str(pid), name):
                return httpx.Response(200, json=_detail(pid, name, types))
        return httpx.Response(404, text="Not Found")

    def _type(self, type_name: str) -> httpx.Response:
        members = [(pid, name, types.index(type_name) + 1) for pid, name, types in FAKE_POKEMON if type_name in types]
        if not members:
            return httpx.Response(404, text="Not Found")
        entries = [{"slot": slot, "pokemon": {"name": n, "url": _resource_url("pokemon", p)}} for p, n, slot in members]
        return httpx.Response(200, json={"name": type_name, "pokemon": entries})
