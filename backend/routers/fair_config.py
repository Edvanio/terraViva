from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import FairConfigCreate, FairConfigResponse, FairConfigUpdate

router = APIRouter()


def _to_response(item: dict) -> FairConfigResponse:
    return FairConfigResponse(
        id=str(item["_id"]),
        name=item["name"],
        city=item["city"],
        logo_url=item.get("logo_url"),
        primary_color=item.get("primary_color", "#2A5C2E"),
        secondary_color=item.get("secondary_color", "#F7F3EC"),
        fair_day=item["fair_day"],
        fair_start_time=item["fair_start_time"],
        fair_end_time=item["fair_end_time"],
        fair_location=item["fair_location"],
        order_window_open=item["order_window_open"],
        order_window_close=item["order_window_close"],
        active=item.get("active", True),
    )


@router.get("", response_model=FairConfigResponse)
def get_fair_config(city: str):
    db = get_db()
    item = db.fair_configs.find_one({"city": city, "active": True})
    if not item:
        raise HTTPException(status_code=404, detail="Configuracao nao encontrada")
    return _to_response(item)


@router.post("", response_model=FairConfigResponse)
def create_fair_config(payload: FairConfigCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    document = payload.model_dump()
    result = db.fair_configs.insert_one(document)
    created = db.fair_configs.find_one({"_id": result.inserted_id})
    return _to_response(created)


@router.put("/{config_id}", response_model=FairConfigResponse)
def update_fair_config(
    config_id: str,
    payload: FairConfigUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    item = db.fair_configs.find_one({"_id": ObjectId(config_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Configuracao nao encontrada")

    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if data:
        db.fair_configs.update_one({"_id": item["_id"]}, {"$set": data})

    updated = db.fair_configs.find_one({"_id": item["_id"]})
    return _to_response(updated)
