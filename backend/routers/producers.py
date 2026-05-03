import uuid
import json
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import AsyncOpenAI

from config import get_settings
from database import get_db
from dependencies import get_current_user
from models import ProducerProfileCreate, ProducerProfileResponse, ProducerProfileUpdate

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5

router = APIRouter()


def _normalize_city(city: str | None) -> str:
    return (city or "").strip()


def _get_s3_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        region_name=settings.do_spaces_region,
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
    )


def _upload_to_spaces(content: bytes, filename: str, content_type: str) -> str:
    """Faz upload para DigitalOcean Spaces e retorna a URL pública."""
    settings = get_settings()
    s3 = _get_s3_client()
    key = f"{settings.do_spaces_folder}/{filename}"
    try:
        s3.put_object(
            Bucket=settings.do_spaces_bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
            ACL="public-read",
        )
    except ClientError as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao enviar para o storage: {exc}") from exc

    # URL pública: https://{bucket}.{endpoint_host}/{key}
    endpoint_host = settings.do_spaces_endpoint.replace("https://", "")
    return f"https://{settings.do_spaces_bucket}.{endpoint_host}/{key}"


def _to_response(item: dict) -> ProducerProfileResponse:
    return ProducerProfileResponse(
        id=str(item["_id"]),
        user_id=str(item["user_id"]),
        bio=item.get("bio", ""),
        city=item.get("city", ""),
        phone=item.get("phone", ""),
        payment_methods=item.get("payment_methods", ["cash"]),
        photo_url=item.get("photo_url"),
        cover_url=item.get("cover_url"),
        gallery=item.get("gallery", []),
        pix_key=item.get("pix_key"),
        address=item.get("address"),
    )


@router.get("/profile", response_model=ProducerProfileResponse)
def get_profile(user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        raise HTTPException(status_code=404, detail="Perfil de produtor nao encontrado")
    return _to_response(producer)


@router.post("/profile", response_model=ProducerProfileResponse)
def create_profile(payload: ProducerProfileCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    existing = db.producers.find_one({"user_id": user["_id"]})
    if existing:
        raise HTTPException(status_code=409, detail="Perfil ja existe")
    if not _normalize_city(payload.city):
        raise HTTPException(status_code=422, detail="Cidade e obrigatoria")

    document = payload.model_dump()
    document["user_id"] = user["_id"]
    document["created_at"] = datetime.now(timezone.utc)
    result = db.producers.insert_one(document)
    created = db.producers.find_one({"_id": result.inserted_id})
    return _to_response(created)


@router.put("/profile", response_model=ProducerProfileResponse)
def update_profile(payload: ProducerProfileUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    producer = db.producers.find_one({"user_id": user["_id"]})
    if not producer:
        raise HTTPException(status_code=404, detail="Perfil de produtor nao encontrado")

    if payload.city is not None and not _normalize_city(payload.city):
        raise HTTPException(status_code=422, detail="Cidade e obrigatoria")

    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if data:
        db.producers.update_one({"_id": producer["_id"]}, {"$set": data})

    updated = db.producers.find_one({"_id": producer["_id"]})
    return _to_response(updated)


@router.post("/geocode")
async def geocode_address(payload: dict, user: dict = Depends(get_current_user)):
    _ = user
    address = (payload or {}).get("address", "")
    if not isinstance(address, str) or not address.strip():
        raise HTTPException(status_code=422, detail="address e obrigatorio")

    settings = get_settings()
    if not settings.openai_api_key:
        return {"city": None, "state": None}

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Retorne apenas JSON valido."},
                {
                    "role": "user",
                    "content": (
                        "Extraia cidade e estado brasileiros a partir do endereco abaixo. "
                        "Retorne JSON com city e state (UF quando possivel). "
                        f"Endereco: {address.strip()}"
                    ),
                },
            ],
            temperature=0,
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        city = (data.get("city") or "").strip() or None
        state = (data.get("state") or "").strip() or None
        return {"city": city, "state": state}
    except Exception:
        return {"city": None, "state": None}


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Faz upload de uma imagem para o DigitalOcean Spaces e retorna a URL pública."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Imagem muito grande. Máximo {MAX_SIZE_MB}MB.")

    ext = (file.filename or "photo").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"

    filename = f"{user['_id']}_{uuid.uuid4().hex[:8]}.{ext}"
    public_url = _upload_to_spaces(content, filename, file.content_type or "image/jpeg")

    return {"url": public_url}



