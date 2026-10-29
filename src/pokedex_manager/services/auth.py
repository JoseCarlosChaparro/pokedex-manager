import uuid
from datetime import UTC, datetime

import jwt
from pwdlib import PasswordHash

from pokedex_manager.clock import Clock

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


class TokenService:
    """Issues and validates access tokens. Expiration is checked against the injected clock."""

    def __init__(self, secret_key: str, clock: Clock):
        self._secret_key = secret_key
        self._clock = clock

    def create_access_token(self, subject: str) -> str:
        payload = {
            "sub": subject,
            "exp": int(self._clock()) + ACCESS_TOKEN_LIFETIME_SECONDS,
            "jti": uuid.uuid4().hex,
        }
        return jwt.encode(payload, self._secret_key, algorithm=JWT_ALGORITHM)

    def decode_access_token(self, token: str) -> dict:
        payload = jwt.decode(
            token,
            self._secret_key,
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": False, "require": ["sub", "exp", "jti"]},
        )
        if payload["exp"] <= self._clock():
            raise jwt.ExpiredSignatureError("Signature has expired")
        return payload

    @staticmethod
    def expires_at(payload: dict) -> datetime:
        return datetime.fromtimestamp(payload["exp"], tz=UTC)
