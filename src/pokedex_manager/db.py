import os

from pymongo import AsyncMongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "pokedex")

client = AsyncMongoClient(MONGO_URL)
database = client[MONGO_DB_NAME]
users_collection = database["users"]