from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import ReviewCreate, ReviewResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse, status_code=201)
def create_review(payload: ReviewCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    # Apenas consumidor da reserva pode avaliar
    reservation = db.reservations.find_one({
        "_id": ObjectId(payload.reservation_id),
        "consumer_id": user["_id"],
        "status": "collected",
    })
    if not reservation:
        raise HTTPException(status_code=403, detail="Avaliacao nao permitida")

    # Apenas uma avaliacao por reserva
    if db.reviews.find_one({"reservation_id": reservation["_id"]}):
        raise HTTPException(status_code=409, detail="Reserva ja avaliada")

    doc = {
        "consumer_id": user["_id"],
        "producer_id": reservation["producer_id"],
        "reservation_id": reservation["_id"],
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.reviews.insert_one(doc)
    created = db.reviews.find_one({"_id": result.inserted_id})

    consumer_name = user.get("name")
    return _to_response(created, consumer_name)


@router.get("/banca/{producer_id}", response_model=list[ReviewResponse])
def list_banca_reviews(producer_id: str):
    db = get_db()
    items = list(
        db.reviews.find({"producer_id": ObjectId(producer_id)})
        .sort("created_at", -1)
        .limit(50)
    )
    result = []
    for item in items:
        consumer = db.users.find_one({"_id": item["consumer_id"]}, {"name": 1})
        consumer_name = consumer.get("name") if consumer else None
        result.append(_to_response(item, consumer_name))
    return result


def _to_response(doc: dict, consumer_name: str | None) -> ReviewResponse:
    return ReviewResponse(
        id=str(doc["_id"]),
        consumer_id=str(doc["consumer_id"]),
        producer_id=str(doc["producer_id"]),
        reservation_id=str(doc["reservation_id"]),
        rating=doc["rating"],
        comment=doc.get("comment"),
        consumer_name=consumer_name,
        created_at=doc["created_at"],
    )
