from datetime import datetime, timedelta, timezone
import random
import re
import logging
import secrets
import string

import httpx
from jose import JWTError, jwt

from config import get_settings


PHONE_DIGITS_RE = re.compile(r"\D+")
DEFAULT_DDD = "48"
logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """
    Normaliza telefone brasileiro para 11 dígitos puros: DD9XXXXXXXX.
    - Remove tudo que não é dígito
    - Remove código país (55) e zero inicial
    - Se não tem DDD (8-9 dígitos), assume DDD 48
    - Se tem 10 dígitos (DDD + 8), adiciona o 9
    Resultado: sempre 11 dígitos (ex: 48991696588)
    """
    digits = PHONE_DIGITS_RE.sub("", phone)

    # Remove código país 55
    if digits.startswith("55") and len(digits) >= 12:
        digits = digits[2:]

    # Remove zero de discagem
    if digits.startswith("0") and len(digits) >= 11:
        digits = digits[1:]

    # Sem DDD: assume DEFAULT_DDD
    if len(digits) <= 9:
        digits = DEFAULT_DDD + digits

    # 10 dígitos (DD + 8 sem o 9): adiciona o 9 após DDD
    if len(digits) == 10:
        digits = digits[:2] + "9" + digits[2:]

    if len(digits) != 11:
        raise ValueError(f"Telefone invalido: esperado 11 digitos, recebeu {len(digits)}")

    return digits


def generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def generate_short_code(db) -> str:
    """Gera um código curto único de 5 caracteres (letras minúsculas + dígitos)."""
    chars = string.ascii_lowercase + string.digits
    while True:
        code = "".join(secrets.choice(chars) for _ in range(5))
        if not db.users.find_one({"short_code": code}):
            return code


def create_access_token(subject: str, phone: str = "") -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "phone": phone, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Token invalido") from exc


def send_push_notification(expo_push_token: str, title: str, body: str) -> None:
    """Envia push notification via Expo Push API (fire-and-forget)."""
    if not expo_push_token or not expo_push_token.startswith("ExponentPushToken"):
        return
    try:
        with httpx.Client(timeout=5) as client:
            client.post(
                "https://exp.host/--/api/v2/push/send",
                json={"to": expo_push_token, "title": title, "body": body, "sound": "default"},
            )
    except Exception as exc:
        logger.warning("Push notification falhou: %s", exc)


def send_whatsapp(phone: str, message: str) -> None:
    """Envia mensagem WhatsApp via z-api (fire-and-forget)."""
    settings = get_settings()
    if not settings.zapi_instance_id or not settings.zapi_token:
        return
    try:
        normalized = normalize_phone(phone)
        url = (
            f"https://api.z-api.io/instances/{settings.zapi_instance_id}"
            f"/token/{settings.zapi_token}/send-text"
        )
        headers = {}
        if settings.zapi_client_token:
            headers["Client-Token"] = settings.zapi_client_token
        with httpx.Client(timeout=8) as client:
            resp = client.post(url, json={"phone": f"55{normalized}", "message": message}, headers=headers)
            if not resp.is_success:
                logger.warning("WhatsApp z-api falhou: %s %s", resp.status_code, resp.text)
    except ValueError as exc:
        logger.warning("Telefone invalido para WhatsApp: %s", exc)
    except Exception as exc:
        logger.warning("WhatsApp z-api erro: %s", exc)
