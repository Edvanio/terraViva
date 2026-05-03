from datetime import datetime, timezone

from database import get_db


def upsert_user(db, phone: str, name: str, city: str = ""):
    existing = db.users.find_one({"phone": phone})
    if existing:
        return existing
    result = db.users.insert_one(
        {
            "phone": phone,
            "name": name,
            "city": city,
            "bio": "",
            "payment_methods": ["cash", "pix", "card"],
            "photo_url": None,
            "cover_url": None,
            "gallery": [],
            "pix_key": None,
            "address": None,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return db.users.find_one({"_id": result.inserted_id})


def ensure_products(db, user_id, prefix: str):
    existing = db.products.count_documents({"user_id": user_id})
    if existing >= 5:
        return

    for i in range(1, 6):
        db.products.insert_one(
            {
                "user_id": user_id,
                "name": f"{prefix} Produto {i}",
                "price": float(6 + i),
                "description": f"Descricao do produto {i}",
                "photo_url": None,
                "category": "hortalica" if "Horta" in prefix else "colonial",
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

    user1 = upsert_user(db, "48999110001", "Joao da Horta", "Sao Ludgero")
    user2 = upsert_user(db, "48999110002", "Maria da Colonia", "Sao Ludgero")

    upsert_user(db, "48999110011", "Carlos", "Sao Ludgero")
    upsert_user(db, "48999110012", "Ana", "Sao Ludgero")
    upsert_user(db, "48999110013", "Paulo", "Sao Ludgero")

    ensure_products(db, user1["_id"], "Horta")
    ensure_products(db, user2["_id"], "Colonia")
    ensure_fair_config(db)

    print("Seed executado com sucesso")


if __name__ == "__main__":
    main()
