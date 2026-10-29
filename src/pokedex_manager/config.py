import os
from dataclasses import dataclass

DEV_JWT_SECRET_KEY = "dev-only-secret-change-me-in-production"


@dataclass(frozen=True)
class Settings:
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "pokedex"
    jwt_secret_key: str = DEV_JWT_SECRET_KEY
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
    pokeapi_base_url: str = "https://pokeapi.co/api/v2"
    pokeapi_timeout_seconds: float = 10.0

    @classmethod
    def from_env(cls) -> "Settings":
        defaults = cls()
        cors_origins = os.getenv("CORS_ORIGINS")
        return cls(
            mongo_url=os.getenv("MONGO_URL", defaults.mongo_url),
            mongo_db_name=os.getenv("MONGO_DB_NAME", defaults.mongo_db_name),
            jwt_secret_key=os.getenv("JWT_SECRET_KEY", defaults.jwt_secret_key),
            cors_origins=tuple(cors_origins.split(",")) if cors_origins else defaults.cors_origins,
        )
