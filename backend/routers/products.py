from datetime import datetime, timezone
import re

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

HEX_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _validate_colors(data: dict):
    for key in ("color_primary", "color_accent"):
        value = data.get(key)
        if value is None:
            continue
        if not isinstance(value, str) or not HEX_PATTERN.match(value.strip()):
            raise HTTPException(status_code=422, detail=f"{key} invalido")


@router.get("/mine", response_model=list[ProductResponse])
def list_mine(user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        return []
    items = db.products.find({"producer_id": producer["_id"]})
    return [
        ProductResponse(
            id=str(p["_id"]),
            producer_id=str(p["producer_id"]),
            name=p["name"],
            price=p["price"],
            description=p.get("description"),
            photo_url=p.get("photo_url"),
            category=p.get("category"),
            color_primary=p.get("color_primary"),
            color_accent=p.get("color_accent"),
            is_active=p.get("is_active", True),
            stock=p.get("stock"),
        )
        for p in items
    ]


@router.post("", response_model=ProductResponse)
def create_product(payload: ProductCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        # Auto-cria perfil de produtor na primeira vez
        result = db.producers.insert_one({
            "user_id": user["_id"],
            "bio": "",
            "city": "",
            "phone": user.get("phone", ""),
            "payment_methods": ["cash"],
            "photo_url": None,
            "cover_url": None,
            "gallery": [],
            "pix_key": None,
            "address": None,
        })
        producer = db.producers.find_one({"_id": result.inserted_id})

    document = payload.model_dump()
    _validate_colors(document)
    document["producer_id"] = producer["_id"]
    document["created_at"] = datetime.now(timezone.utc)
    result = db.products.insert_one(document)
    created = db.products.find_one({"_id": result.inserted_id})

    return ProductResponse(
        id=str(created["_id"]),
        producer_id=str(created["producer_id"]),
        name=created["name"],
        price=created["price"],
        description=created.get("description"),
        photo_url=created.get("photo_url"),
        category=created.get("category"),
        color_primary=created.get("color_primary"),
        color_accent=created.get("color_accent"),
        is_active=created.get("is_active", True),
        stock=created.get("stock"),
    )


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, payload: ProductUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        raise HTTPException(status_code=404, detail="Perfil de produtor nao encontrado")

    product = db.products.find_one({"_id": ObjectId(product_id), "producer_id": producer["_id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")

    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if data:
        _validate_colors(data)
        db.products.update_one({"_id": product["_id"]}, {"$set": data})

    updated = db.products.find_one({"_id": product["_id"]})
    return ProductResponse(
        id=str(updated["_id"]),
        producer_id=str(updated["producer_id"]),
        name=updated["name"],
        price=updated["price"],
        description=updated.get("description"),
        photo_url=updated.get("photo_url"),
        category=updated.get("category"),
        color_primary=updated.get("color_primary"),
        color_accent=updated.get("color_accent"),
        is_active=updated.get("is_active", True),
        stock=updated.get("stock"),
    )


@router.delete("/{product_id}")
def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        raise HTTPException(status_code=404, detail="Perfil de produtor nao encontrado")

    result = db.products.delete_one({"_id": ObjectId(product_id), "producer_id": producer["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    return {"deleted": True}
