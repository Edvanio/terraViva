import uuid
import json

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import AsyncOpenAI

from config import get_settings
from database import get_db
from dependencies import get_current_user
from models import UserProfileResponse, UserProfileUpdate

from utils import generate_short_code

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5

router = APIRouter()


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
    """Faz upload para DigitalOcean Spaces e retorna a URL publica."""
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

    endpoint_host = settings.do_spaces_endpoint.replace("https://", "")
    return f"https://{settings.do_spaces_bucket}.{endpoint_host}/{key}"


def _to_response(user: dict) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user["_id"]),
        short_code=user.get("short_code"),
        phone=user.get("phone", ""),
        name=user.get("name"),
        bio=user.get("bio"),
        city=user.get("city"),
        payment_methods=user.get("payment_methods", ["cash", "pix"]),
        photo_url=user.get("photo_url"),
        cover_url=user.get("cover_url"),
        gallery=user.get("gallery", []),
        pix_key=user.get("pix_key"),
        address=user.get("address"),
    )


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(user: dict = Depends(get_current_user)):
    db = get_db()
    if not user.get("short_code"):
        code = generate_short_code(db)
        db.users.update_one({"_id": user["_id"]}, {"$set": {"short_code": code}})
        user["short_code"] = code
    return _to_response(user)


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(payload: UserProfileUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    data.pop("phone", None)  # phone é imutável (vem do login)
    if data:
        db.users.update_one({"_id": user["_id"]}, {"$set": data})
    updated = db.users.find_one({"_id": user["_id"]})
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
    """Faz upload de uma imagem para o DigitalOcean Spaces e retorna a URL publica."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Formato invalido. Use JPG, PNG ou WebP.")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Imagem muito grande. Maximo {MAX_SIZE_MB}MB.")

    ext = (file.filename or "photo").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"

    filename = f"{user['_id']}_{uuid.uuid4().hex[:8]}.{ext}"
    public_url = _upload_to_spaces(content, filename, file.content_type or "image/jpeg")

    return {"url": public_url}


@router.post("/migrate-from-users")
def migrate_producers_from_users():
    """
    Migração única: cria entradas em `producers` para todos os usuários com
    role='producer' que ainda não têm perfil. Seguro chamar múltiplas vezes (idempotente).
    """
    db = get_db()
    producer_users = list(db.users.find({"role": "producer"}))
    created = 0
    skipped = 0
    for u in producer_users:
        existing = db.producers.find_one({"user_id": u["_id"]})
        if existing:
            skipped += 1
            continue
        db.producers.insert_one({
            "user_id": u["_id"],
            "bio": "",
            "city": "",
            "phone": u.get("phone", ""),
            "payment_methods": ["cash", "pix"],
            "photo_url": None,
            "cover_url": None,
            "gallery": [],
            "pix_key": None,
            "address": None,
            "created_at": datetime.now(timezone.utc),
        })
        created += 1
    return {"migrated": created, "already_existed": skipped, "total_producer_users": len(producer_users)}
