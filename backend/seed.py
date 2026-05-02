from datetime import datetime, timezone

from database import get_db


def upsert_user(db, phone: str, role: str, name: str):
    existing = db.users.find_one({"phone": phone})
    if existing:
        return existing
    result = db.users.insert_one(
        {
            "phone": phone,
            "role": role,
            "name": name,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return db.users.find_one({"_id": result.inserted_id})


def ensure_producer_profile(db, user_id, bio: str, city: str, phone: str):
    existing = db.producers.find_one({"user_id": user_id})
    if existing:
        return existing
    result = db.producers.insert_one(
        {
            "user_id": user_id,
            "bio": bio,
            "city": city,
            "phone": phone,
            "payment_methods": ["cash", "pix", "card"],
            "photo_url": None,
            "gallery": [],
            "pix_key": None,
            "address": None,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return db.producers.find_one({"_id": result.inserted_id})


def ensure_products(db, producer_id, prefix: str):
    existing = db.products.count_documents({"producer_id": producer_id})
    if existing >= 5:
        return

    for i in range(1, 6):
        db.products.insert_one(
            {
                "producer_id": producer_id,
                "name": f"{prefix} Produto {i}",
                "price": float(6 + i),
                "description": f"Descricao do produto {i}",
                "photo_url": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
            }
        )


def ensure_fair_config(db):
    existing = db.fair_configs.find_one({"city": "Sao Ludgero", "active": True})
    if existing:
        return

    db.fair_configs.insert_one(
        {
            "name": "Feira Terra Viva Sao Ludgero",
            "city": "Sao Ludgero",
            "logo_url": None,
            "primary_color": "#2A5C2E",
            "secondary_color": "#F7F3EC",
            "fair_day": "saturday",
            "fair_start_time": "08:00",
            "fair_end_time": "12:00",
            "fair_location": "Praca Central",
            "order_window_open": "monday 07:00",
            "order_window_close": "friday 18:00",
            "active": True,
        }
    )


def main():
    db = get_db()

    producer1 = upsert_user(db, "48999110001", "producer", "Joao da Horta")
    producer2 = upsert_user(db, "48999110002", "producer", "Maria da Colonia")

    upsert_user(db, "48999110011", "consumer", "Carlos")
    upsert_user(db, "48999110012", "consumer", "Ana")
    upsert_user(db, "48999110013", "consumer", "Paulo")

    profile1 = ensure_producer_profile(db, producer1["_id"], "Banca de verduras frescas", "Sao Ludgero", producer1["phone"])
    profile2 = ensure_producer_profile(db, producer2["_id"], "Produtos coloniais artesanais", "Sao Ludgero", producer2["phone"])

    ensure_products(db, profile1["_id"], "Horta")
    ensure_products(db, profile2["_id"], "Colonia")
    ensure_fair_config(db)

    print("Seed executado com sucesso")


if __name__ == "__main__":
    main()
