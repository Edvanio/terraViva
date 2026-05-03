import asyncio
import base64
import io
import json
import re
import uuid
from typing import Any

import boto3
import httpx
from botocore.exceptions import ClientError
from fastapi import HTTPException
from openai import AsyncOpenAI
from PIL import Image, ImageChops, ImageEnhance, ImageStat

from config import get_settings

CATEGORIES = {
    "frutas",
    "verduras",
    "legumes",
    "ovos",
    "carnes",
    "queijos",
    "frios",
    "paes",
    "doces",
    "bebidas",
    "temperos",
    "conservas",
    "colonial",
    "artesanal",
    "outros",
}

HEX_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key nao configurada")
    return AsyncOpenAI(api_key=settings.openai_api_key)


def _get_s3_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        region_name=settings.do_spaces_region,
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
    )


def _upload_product_image(content: bytes, content_type: str = "image/png") -> str:
    settings = get_settings()
    s3 = _get_s3_client()

    ext = "png"
    if content_type == "image/jpeg":
        ext = "jpg"
    elif content_type == "image/webp":
        ext = "webp"

    filename = f"ai_{uuid.uuid4().hex[:16]}.{ext}"
    key = f"{settings.do_spaces_products_folder}/{filename}"

    try:
        s3.put_object(
            Bucket=settings.do_spaces_bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
            ACL="public-read",
        )
    except ClientError as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao enviar para storage: {exc}") from exc

    endpoint_host = settings.do_spaces_endpoint.replace("https://", "")
    return f"https://{settings.do_spaces_bucket}.{endpoint_host}/{key}"


def _normalize_hex(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not HEX_PATTERN.match(value):
        return None
    return value.upper()


def _normalize_category(value: Any) -> str:
    if not isinstance(value, str):
        return "outros"
    normalized = value.strip().lower()
    if normalized in CATEGORIES:
        return normalized
    return "outros"


def _normalize_price(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        parsed = float(value)
        return round(parsed, 2) if parsed > 0 else None

    if isinstance(value, str):
        clean = value.strip().replace("R$", "").replace(" ", "")
        clean = clean.replace(".", "").replace(",", ".")
        try:
            parsed = float(clean)
            return round(parsed, 2) if parsed > 0 else None
        except ValueError:
            return None

    return None


async def _download_image(photo_url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(photo_url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return response.content, content_type


def _to_png_bytes(content: bytes, content_type: str) -> tuple[bytes, str, str]:
    try:
        with Image.open(io.BytesIO(content)) as img:
            converted = io.BytesIO()
            # A API de image edits espera canais com alpha ou escala de cinza;
            # padronizamos para RGBA para evitar erro de formato (RGB invalido).
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            img.save(converted, format="PNG")
            return converted.getvalue(), "image/png", "product.png"
    except Exception:
        return content, content_type or "image/jpeg", "product.jpg"


def _image_delta_score(content_a: bytes, content_b: bytes) -> float:
    try:
        with Image.open(io.BytesIO(content_a)) as img_a, Image.open(io.BytesIO(content_b)) as img_b:
            img_a = img_a.convert("RGB")
            img_b = img_b.convert("RGB")
            if img_a.size != img_b.size:
                img_b = img_b.resize(img_a.size)
            diff = ImageChops.difference(img_a, img_b)
            stat = ImageStat.Stat(diff)
            means = stat.mean or [0.0, 0.0, 0.0]
            return float(sum(means) / len(means))
    except Exception:
        return 999.0


def _apply_local_boost(content: bytes) -> bytes:
    with Image.open(io.BytesIO(content)) as img:
        work = img.convert("RGB")
        work = ImageEnhance.Brightness(work).enhance(1.04)
        work = ImageEnhance.Contrast(work).enhance(1.14)
        work = ImageEnhance.Color(work).enhance(1.1)
        work = ImageEnhance.Sharpness(work).enhance(1.2)

        out = io.BytesIO()
        work.save(out, format="PNG")
        return out.getvalue()


async def analyze_with_vision(photo_url: str, city: str | None) -> dict[str, Any]:
    client = _get_openai_client()
    settings = get_settings()
    city_text = city.strip() if city else ""

    prompt = (
        "Analise esta foto de um produto de feira. "
        "Retorne SOMENTE JSON valido com os campos: "
        "name (string), description (string), category (string), "
        "unit (string), color_primary (hex), color_accent (hex), "
        "suggested_price (number ou null), suggested_price_note (string ou null). "
        "A categoria deve ser exatamente uma destas: "
        "frutas, verduras, legumes, ovos, carnes, queijos, frios, paes, doces, bebidas, temperos, conservas, colonial, artesanal, outros. "
        "A unidade (unit) deve ser exatamente uma destas: "
        "kg, g, litro, ml, unidade, duzia, pe, bandeja, pote, fatia, pacote, saco, maco. "
        "As cores devem ser naturais e legiveis. "
        "Sempre retorne suggested_price com um valor plausivel para feira local; "
        "se a cidade nao for informada, use referencia media de Santa Catarina. "
        f"Cidade: {city_text if city_text else 'nao informada'}."
    )

    completion = await client.chat.completions.create(
        model=settings.openai_vision_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "Voce e um assistente que retorna apenas JSON valido.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": photo_url}},
                ],
            },
        ],
        temperature=0.2,
    )

    raw = completion.choices[0].message.content or "{}"
    parsed = json.loads(raw)

    suggested_price = _normalize_price(parsed.get("suggested_price"))

    return {
        "name": (parsed.get("name") or "").strip() or None,
        "description": (parsed.get("description") or "").strip() or None,
        "category": _normalize_category(parsed.get("category")),
        "unit": (parsed.get("unit") or "").strip().lower() or None,
        "color_primary": _normalize_hex(parsed.get("color_primary")),
        "color_accent": _normalize_hex(parsed.get("color_accent")),
        "suggested_price": suggested_price,
        "suggested_price_note": (parsed.get("suggested_price_note") or "").strip() or None,
    }


async def enhance_photo(photo_url: str) -> str | None:
    try:
        settings = get_settings()
        original_bytes, content_type = await _download_image(photo_url)
        image_bytes, image_content_type, image_filename = _to_png_bytes(original_bytes, content_type)

        # Multipart direto evita incompatibilidade de serializacao do SDK em image edit.
        endpoint = "https://api.openai.com/v1/images/edits"
        data = {
            "model": settings.openai_image_model,
            "prompt": (
                "Enhance this food/product photo for a local farmers market listing. "
                "Preserve product identity. Improve lighting, color balance and clarity naturally. "
                "No text, logos or artificial backgrounds."
            ),
            "size": "1024x1024",
            "response_format": "b64_json",
        }

        files = {
            "image": (image_filename, image_bytes, image_content_type),
        }

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                data=data,
                files=files,
            )

            # Em algumas contas/rotas, image edits aceita apenas dall-e-2.
            if response.status_code == 400:
                body_text = response.text or ""
                if "Value must be 'dall-e-2'" in body_text and data["model"] != "dall-e-2":
                    data["model"] = "dall-e-2"
                    response = await client.post(
                        endpoint,
                        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                        data=data,
                        files=files,
                    )

            response.raise_for_status()
            payload = response.json()

        b64_data = (payload.get("data") or [{}])[0].get("b64_json")
        if not b64_data:
            return None

        enhanced_content = base64.b64decode(b64_data)

        # Se vier praticamente igual, aplica boost local para garantir melhoria visivel.
        if _image_delta_score(image_bytes, enhanced_content) < 2.0:
            enhanced_content = _apply_local_boost(enhanced_content)

        return _upload_product_image(enhanced_content, "image/png")
    except httpx.HTTPStatusError as exc:
        body = ""
        try:
            body = exc.response.text
        except Exception:
            body = "<sem body>"
        print(f"[openai_service.enhance_photo] erro HTTP {exc.response.status_code}: {body}")
        return None
    except Exception as exc:
        print(f"[openai_service.enhance_photo] falha ao melhorar foto: {exc}")
        return None


async def generate_ai_product(photo_url: str, city: str | None) -> dict[str, Any]:
    vision_task = analyze_with_vision(photo_url, city)
    enhance_task = enhance_photo(photo_url)

    vision_result, enhanced_photo_url = await asyncio.gather(
        vision_task,
        enhance_task,
        return_exceptions=True,
    )

    if isinstance(vision_result, Exception):
        raise vision_result

    if isinstance(enhanced_photo_url, Exception):
        enhanced_photo_url = None

    return {
        "name": vision_result.get("name"),
        "description": vision_result.get("description"),
        "category": vision_result.get("category"),
        "unit": vision_result.get("unit"),
        "color_primary": vision_result.get("color_primary"),
        "color_accent": vision_result.get("color_accent"),
        "suggested_price": vision_result.get("suggested_price"),
        "suggested_price_note": vision_result.get("suggested_price_note"),
        "original_photo_url": photo_url,
        "enhanced_photo_url": enhanced_photo_url,
    }
