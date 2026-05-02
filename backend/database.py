from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from config import get_settings


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    settings = get_settings()
    return MongoClient(settings.mongodb_url)


def get_db() -> Database:
    settings = get_settings()
    return get_client()[settings.mongodb_db_name]
