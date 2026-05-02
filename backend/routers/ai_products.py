import asyncio
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from dependencies import get_current_user
from models import AIProductGenerateRequest, AIProductGenerateResponse
from services.openai_service import generate_ai_product

router = APIRouter()


def _is_valid_photo_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


@router.post("/ai-generate", response_model=AIProductGenerateResponse)
async def ai_generate_product(payload: AIProductGenerateRequest, user: dict = Depends(get_current_user)):
    if not _is_valid_photo_url(payload.photo_url):
        raise HTTPException(status_code=422, detail="photo_url invalida")

    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})

    city = payload.city
    if (not city) and producer:
        city = producer.get("city")

    try:
        result = await asyncio.wait_for(generate_ai_product(payload.photo_url, city), timeout=90)
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=503, detail="IA demorou demais, tente novamente") from exc
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[ai_products.ai_generate_product] erro interno: {exc}")
        raise HTTPException(status_code=503, detail="IA indisponivel no momento") from exc

    return AIProductGenerateResponse(**result)
