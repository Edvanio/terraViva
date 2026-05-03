from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends

from database import get_db
from dependencies import get_current_user

router = APIRouter()


@router.get("")
def list_notifications(user: dict = Depends(get_current_user)):
    db = get_db()
    items = list(
        db.notifications.find({"user_id": user["_id"], "read": False})
        .sort("created_at", -1)
        .limit(20)
    )
    return [
        {
            "id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "body": n.get("body"),
            "reservation_id": str(n["reservation_id"]) if n.get("reservation_id") else None,
            "read": n.get("read", False),
            "created_at": n["created_at"].isoformat(),
        }
        for n in items
    ]


@router.post("/read-all")
def mark_all_read(user: dict = Depends(get_current_user)):
    db = get_db()
    db.notifications.update_many(
        {"user_id": user["_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}},
    )
    return {"ok": True}


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user["_id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}},
    )
    return {"ok": True}
