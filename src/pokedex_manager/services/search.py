from typing import NamedTuple


class PokemonName(NamedTuple):
    id: int
    name: str


def suggest(index: list[PokemonName], query: str, limit: int) -> list[PokemonName]:
    """Autocomplete: Pokédex-number prefix for digits, otherwise name prefix matches before substring matches.

    Results keep the index order (Pokédex order).
    """
    clean_query = query.strip().lower()
    if clean_query.isdigit():
        return [p for p in index if str(p.id).startswith(clean_query)][:limit]

    prefix_matches = [p for p in index if p.name.startswith(clean_query)]
    substring_matches = [p for p in index if clean_query in p.name and not p.name.startswith(clean_query)]
    return (prefix_matches + substring_matches)[:limit]
