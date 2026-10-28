class PokeAPIError(Exception):
    pass

class PokemonNotFoundError(PokeAPIError):
    def __init__(self, id_or_name):
        self.id_or_name = id_or_name
        super().__init__(f"Pokemon not found: {id_or_name}")

class PokeAPITimeoutError(PokeAPIError):
    pass

class PokeAPIServerError(PokeAPIError):
    pass