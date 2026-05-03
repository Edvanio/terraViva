from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_db
from models import BancaResponse

router = APIRouter()


@router.get("", response_model=list[BancaResponse])
def list_bancas():
    """Lista usuarios que possuem pelo menos um produto ativo."""
    db = get_db()
    # Distinct user_ids com produtos ativos
    user_ids = db.products.distinct("user_id", {"is_active": True})
    if not user_ids:
        return []

    users = list(db.users.find({"_id": {"$in": user_ids}}))
    result = []
    for user in users:
        products = list(db.products.find({"user_id": user["_id"], "is_active": True}))
        categories = list({p.get("category") for p in products if p.get("category")})
        result.append(BancaResponse(
            id=str(user["_id"]),
            name=user.get("name"),
            bio=user.get("bio"),
            city=user.get("city"),
            phone=user.get("phone"),
            payment_methods=user.get("payment_methods", ["cash"]),
            photo_url=user.get("photo_url"),
            cover_url=user.get("cover_url"),
            categories=categories,
            products_count=len(products),
        ))
    return result


@router.get("/{banca_id}")
def get_banca(banca_id: str):
    """Detalhe de uma banca (usuario) com seus produtos ativos."""
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(banca_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Banca nao encontrada")

    products = list(db.products.find({"user_id": user["_id"], "is_active": True}))
    if not products:
        raise HTTPException(status_code=404, detail="Banca nao encontrada")

    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "bio": user.get("bio"),
        "city": user.get("city"),
        "phone": user.get("phone"),
        "payment_methods": user.get("payment_methods", ["cash"]),
        "photo_url": user.get("photo_url"),
        "cover_url": user.get("cover_url"),
        "gallery": user.get("gallery", []),
        "address": user.get("address"),
        "pix_key": user.get("pix_key"),
        "products": [
            {
                "id": str(p["_id"]),
                "user_id": str(p["user_id"]),
                "name": p["name"],
                "price": p["price"],
                "description": p.get("description"),
                "photo_url": p.get("photo_url"),
                "category": p.get("category"),
                "is_active": p.get("is_active", True),
            }
            for p in products
        ],
    }
