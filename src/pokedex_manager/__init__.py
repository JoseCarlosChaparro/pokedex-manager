from fastapi import FastAPI
from pokedex_manager.routers import pokemon

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(pokemon.router)