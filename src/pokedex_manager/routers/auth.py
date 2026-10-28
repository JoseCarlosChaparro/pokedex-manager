from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError

from pokedex_manager.db import users_collection
from pokedex_manager.models.user import UserCredentials, UserPublic
from pokedex_manager.services.auth import hash_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
async def register(credentials: UserCredentials):
    user = {
        "email": credentials.email.lower(),
        "password_hash": hash_password(credentials.password),
    }
    try:
        result = await users_collection.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return UserPublic(id=str(result.inserted_id), email=user["email"])