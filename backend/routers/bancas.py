from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database import get_db
from models import BancaResponse

router = APIRouter()


@router.get("", response_model=list[BancaResponse])
def list_bancas():
    db = get_db()
    bancas = list(db.producers.find())
    result = []
    for item in bancas:
        products = list(db.products.find({"producer_id": item["_id"], "is_active": True}))
        if not products:
            continue  # só aparece quem tem produto ativo
        categories = list({p.get("category") for p in products if p.get("category")})
        result.append(BancaResponse(
            id=str(item["_id"]),
            user_id=str(item["user_id"]),
            bio=item.get("bio", ""),
            city=item.get("city", ""),
            payment_methods=item.get("payment_methods", ["cash"]),
            photo_url=item.get("photo_url"),
            cover_url=item.get("cover_url"),
            categories=categories,
            products_count=len(products),
        ))
    return result


@router.get("/{banca_id}")
def get_banca(banca_id: str):
    db = get_db()
    banca = db.producers.find_one({"_id": ObjectId(banca_id)})
    if not banca:
        raise HTTPException(status_code=404, detail="Banca nao encontrada")

    products = list(db.products.find({"producer_id": banca["_id"], "is_active": True}))
    return {
        "id": str(banca["_id"]),
        "user_id": str(banca["user_id"]),
        "bio": banca.get("bio", ""),
        "city": banca.get("city", ""),
        "payment_methods": banca.get("payment_methods", ["cash"]),
        "photo_url": banca.get("photo_url"),
        "cover_url": banca.get("cover_url"),
        "gallery": banca.get("gallery", []),
        "address": banca.get("address"),
        "pix_key": banca.get("pix_key"),
        "products": [
            {
                "id": str(item["_id"]),
                "producer_id": str(item["producer_id"]),
                "name": item["name"],
                "price": item["price"],
                "description": item.get("description"),
                "photo_url": item.get("photo_url"),
                "category": item.get("category"),
                "is_active": item.get("is_active", True),
            }
            for item in products
        ],
    }
