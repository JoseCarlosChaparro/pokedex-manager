from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pokedex_manager.routers import pokemon

from pokedex_manager.exceptions.pokeapi import (
    PokemonNotFoundError,
    PokeAPIError,
    PokeAPIServerError,
    PokeAPITimeoutError,
    PokemonTypeNotFoundError
    )

app = FastAPI()

POKEAPI_ERROR_STATUS = {
    PokemonNotFoundError: status.HTTP_404_NOT_FOUND,
    PokeAPIServerError: status.HTTP_502_BAD_GATEWAY,
    PokeAPITimeoutError: status.HTTP_504_GATEWAY_TIMEOUT,
    PokemonTypeNotFoundError: status.HTTP_404_NOT_FOUND
}

@app.exception_handler(PokeAPIError)
async def pokeapi_error_handler(request: Request, exc: PokeAPIError):
    status_code = POKEAPI_ERROR_STATUS.get(type(exc), status.HTTP_502_BAD_GATEWAY)
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)},
    )

@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(pokemon.router)