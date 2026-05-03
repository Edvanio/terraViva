from datetime import datetime, timezone
import threading

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import ReservationCreate, ReservationResponse, ReservationStatusUpdate
from utils import send_push_notification

router = APIRouter()


def _to_response(document: dict, db=None) -> ReservationResponse:
    if db is None:
        db = get_db()

    product_photo_url = None
    product_description = None
    product_category = None
    consumer_name = None
    consumer_phone = None
    producer_name = None
    producer_phone = None
    producer_photo_url = None

    # Dados do produto
    product = db.products.find_one({"_id": document["product_id"]})
    if product:
        product_photo_url = product.get("photo_url")
        product_description = product.get("description")
        product_category = product.get("category")

    # Dados do consumidor
    consumer = db.users.find_one({"_id": document["consumer_id"]})
    if consumer:
        consumer_name = consumer.get("name")
        consumer_phone = consumer.get("phone")

    # Dados do produtor (é um user)
    producer = db.users.find_one({"_id": document["producer_id"]})
    if producer:
        producer_name = producer.get("name")
        producer_phone = producer.get("phone")
        producer_photo_url = producer.get("photo_url")

    return ReservationResponse(
        id=str(document["_id"]),
        consumer_id=str(document["consumer_id"]),
        producer_id=str(document["producer_id"]),
        product_id=str(document["product_id"]),
        product_name=document["product_name"],
        product_photo_url=product_photo_url,
        product_description=product_description,
        product_category=product_category,
        consumer_name=consumer_name,
        consumer_phone=consumer_phone,
        producer_name=producer_name,
        producer_phone=producer_phone,
        producer_photo_url=producer_photo_url,
        quantity=document["quantity"],
        total_price=document["total_price"],
        pickup_location=document["pickup_location"],
        payment_intent=document["payment_intent"],
        status=document["status"],
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


@router.post("", response_model=ReservationResponse)
def create_reservation(payload: ReservationCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    product = db.products.find_one({"_id": ObjectId(payload.product_id), "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")

    reservation = {
        "consumer_id": user["_id"],
        "producer_id": product["user_id"],
        "product_id": product["_id"],
        "product_name": product["name"],
        "quantity": payload.quantity,
        "total_price": payload.quantity * product["price"],
        "pickup_location": payload.pickup_location,
        "payment_intent": payload.payment_intent,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = db.reservations.insert_one(reservation)
    created = db.reservations.find_one({"_id": result.inserted_id})

    # Push notification para o produtor (fire-and-forget)
    producer_user = db.users.find_one({"_id": product["user_id"]})
    if producer_user and producer_user.get("expo_push_token"):
        threading.Thread(
            target=send_push_notification,
            args=(
                producer_user["expo_push_token"],
                "Novo pedido!",
                f"{product['name']} (x{payload.quantity}) - {payload.pickup_location}",
            ),
            daemon=True,
        ).start()

    return _to_response(created)


@router.get("", response_model=list[ReservationResponse])
def list_my_reservations(user: dict = Depends(get_current_user)):
    db = get_db()
    items = list(db.reservations.find({"consumer_id": user["_id"]}).sort("created_at", -1))
    return [_to_response(item) for item in items]


@router.get("/producer", response_model=list[ReservationResponse])
def list_producer_reservations(user: dict = Depends(get_current_user)):
    """Pedidos recebidos pelo usuario (como vendedor)."""
    db = get_db()
    items = list(db.reservations.find({"producer_id": user["_id"]}).sort("created_at", -1))
    return [_to_response(item) for item in items]


@router.put("/{reservation_id}/status", response_model=ReservationResponse)
def update_reservation_status(
    reservation_id: str,
    payload: ReservationStatusUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    reservation = db.reservations.find_one({"_id": ObjectId(reservation_id), "producer_id": user["_id"]})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva nao encontrada")

    db.reservations.update_one(
        {"_id": reservation["_id"]},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = db.reservations.find_one({"_id": reservation["_id"]})
    return _to_response(updated)


@router.patch("/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_reservation(
    reservation_id: str,
    user: dict = Depends(get_current_user),
):
    """Consumidor cancela seu próprio pedido (somente se status == pending)."""
    db = get_db()
    reservation = db.reservations.find_one({"_id": ObjectId(reservation_id), "consumer_id": user["_id"]})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva nao encontrada")
    if reservation["status"] != "pending":
        raise HTTPException(status_code=400, detail="Somente pedidos pendentes podem ser cancelados")

    db.reservations.update_one(
        {"_id": reservation["_id"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}},
    )
    updated = db.reservations.find_one({"_id": reservation["_id"]})
    return _to_response(updated)
