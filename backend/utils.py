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
logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    normalized = PHONE_DIGITS_RE.sub("", phone)
    if len(normalized) < 10:
        raise ValueError("Telefone invalido")
    return normalized


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
