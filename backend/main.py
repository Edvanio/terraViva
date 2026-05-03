from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import get_db
from routers import ai_products, auth, bancas, fair_config, producers, products, reservations

settings = get_settings()

app = FastAPI(title="Terra Viva API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bancas.router, prefix="/bancas", tags=["bancas"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(ai_products.router, prefix="/products", tags=["products-ai"])
app.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
app.include_router(producers.router, prefix="/producer", tags=["profile"])
app.include_router(fair_config.router, prefix="/fair-config", tags=["fair-config"])


@app.on_event("startup")
def startup_indexes():
    from utils import generate_short_code
    db = get_db()
    db.otp_codes.create_index("created_at", expireAfterSeconds=300)
    db.users.create_index("phone", unique=True)
    db.users.create_index("short_code", unique=True, sparse=True)
    # Migração: gera short_code para usuários que ainda não possuem
    for user in db.users.find({"short_code": {"$exists": False}}):
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"short_code": generate_short_code(db)}},
        )


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}
