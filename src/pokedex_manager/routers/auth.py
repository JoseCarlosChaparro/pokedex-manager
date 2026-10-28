from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from pokedex_manager.db import revoked_tokens_collection, users_collection
from pokedex_manager.dependencies import get_token_payload
from pokedex_manager.models.user import AccessToken, LoginCredentials, RegisterCredentials, UserPublic
from pokedex_manager.services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
async def register(credentials: RegisterCredentials):
    user = {
        "email": credentials.email.lower(),
        "password_hash": hash_password(credentials.password),
    }
    try:
        result = await users_collection.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return UserPublic(id=str(result.inserted_id), email=user["email"])

@router.post("/login", response_model=AccessToken)
async def login(credentials: LoginCredentials):
    user = await users_collection.find_one({"email": credentials.email.lower()})
    if user is None or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return AccessToken(access_token=create_access_token(str(user["_id"])))

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: dict = Depends(get_token_payload)):
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    await revoked_tokens_collection.insert_one({"_id": payload["jti"], "expires_at": expires_at})
