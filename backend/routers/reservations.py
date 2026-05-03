from datetime import datetime, timezone
import threading

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import ReservationCreate, ReservationResponse, ReservationStatusUpdate
from utils import send_push_notification, send_whatsapp

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper: dispara notificação DB + push + WhatsApp em background
# ---------------------------------------------------------------------------
def _notify(db, user_id, notif_type: str, title: str, body: str, reservation_id, push_token: str | None = None, phone: str | None = None):
    """Cria registro no DB e dispara push/WhatsApp de forma fire-and-forget."""
    db.notifications.insert_one({
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "body": body,
        "reservation_id": reservation_id,
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })
    if push_token:
        threading.Thread(target=send_push_notification, args=(push_token, title, body), daemon=True).start()
    if phone:
        whatsapp_msg = f"*{title}*\n{body}"
        threading.Thread(target=send_whatsapp, args=(phone, whatsapp_msg), daemon=True).start()



def _to_response(document: dict, db=None) -> ReservationResponse:
    if db is None:
        db = get_db()

    product_photo_url = None
    product_description = None
    product_category = None
    product_unit = None
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
        product_unit = product.get("unit")

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
        product_unit=product_unit,
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

    # Notifica o produtor: DB + push + WhatsApp
    producer_user = db.users.find_one({"_id": product["user_id"]})
    consumer_name = user.get("name") or "Cliente"
    title = "📦 Novo pedido!"
    body = f"{consumer_name} pediu {product['name']} (x{payload.quantity}) — {payload.pickup_location}"
    _notify(
        db,
        user_id=product["user_id"],
        notif_type="new_order",
        title=title,
        body=body,
        reservation_id=result.inserted_id,
        push_token=producer_user.get("expo_push_token") if producer_user else None,
        phone=producer_user.get("phone") if producer_user else None,
    )

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

    consumer = db.users.find_one({"_id": reservation["consumer_id"]})
    producer_name = user.get("name") or "Produtor"
    product_name = reservation.get("product_name", "produto")
    consumer_push = consumer.get("expo_push_token") if consumer else None
    consumer_phone = consumer.get("phone") if consumer else None

    if payload.status == "confirmed":
        _notify(
            db,
            user_id=reservation["consumer_id"],
            notif_type="order_confirmed",
            title="🎉 Pedido confirmado!",
            body=f"{producer_name} confirmou seu pedido de {product_name}.",
            reservation_id=reservation["_id"],
            push_token=consumer_push,
            phone=consumer_phone,
        )
    elif payload.status == "collected":
        _notify(
            db,
            user_id=reservation["consumer_id"],
            notif_type="order_collected",
            title="✅ Pedido coletado!",
            body=f"Seu pedido de {product_name} foi marcado como coletado por {producer_name}.",
            reservation_id=reservation["_id"],
            push_token=consumer_push,
            phone=consumer_phone,
        )
    elif payload.status == "cancelled":
        _notify(
            db,
            user_id=reservation["consumer_id"],
            notif_type="order_cancelled_by_producer",
            title="❌ Pedido cancelado",
            body=f"{producer_name} cancelou seu pedido de {product_name}.",
            reservation_id=reservation["_id"],
            push_token=consumer_push,
            phone=consumer_phone,
        )

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

    # Notifica o produtor que o consumidor cancelou
    producer = db.users.find_one({"_id": reservation["producer_id"]})
    consumer_name = user.get("name") or "Cliente"
    product_name = reservation.get("product_name", "produto")
    _notify(
        db,
        user_id=reservation["producer_id"],
        notif_type="order_cancelled_by_consumer",
        title="❌ Pedido cancelado",
        body=f"{consumer_name} cancelou o pedido de {product_name}.",
        reservation_id=reservation["_id"],
        push_token=producer.get("expo_push_token") if producer else None,
        phone=producer.get("phone") if producer else None,
    )

    return _to_response(updated)
