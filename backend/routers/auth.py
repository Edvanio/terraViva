from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from config import get_settings
from database import get_db
from dependencies import get_current_user
from models import OtpRequest, OtpVerify, TokenResponse, UserResponse
from utils import create_access_token, generate_otp, generate_short_code, normalize_phone

router = APIRouter()


@router.post("/request-otp")
def request_otp(payload: OtpRequest):
    db = get_db()
    settings = get_settings()
    phone = normalize_phone(payload.phone)
    code = settings.dev_otp_default if settings.dev_otp_default else generate_otp()

    db.otp_codes.delete_many({"phone": phone})
    db.otp_codes.insert_one(
        {
            "phone": phone,
            "code": code,
            "created_at": datetime.now(timezone.utc),
        }
    )

    return {
        "message": "OTP gerado com sucesso",
        "phone": phone,
        "dev_code": code if settings.dev_otp_default else None,
    }


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OtpVerify):
    db = get_db()
    phone = normalize_phone(payload.phone)
    otp = db.otp_codes.find_one({"phone": phone, "code": payload.code})

    if not otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP invalido")

    db.otp_codes.delete_one({"_id": otp["_id"]})

    user = db.users.find_one({"phone": phone})
    if not user:
        result = db.users.insert_one(
            {
                "phone": phone,
                "name": None,
                "created_at": datetime.now(timezone.utc),
                "short_code": generate_short_code(db),
            }
        )
        user = db.users.find_one({"_id": result.inserted_id})

    token = create_access_token(str(user["_id"]), phone=user["phone"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(user["_id"]),
        phone=user["phone"],
        name=user.get("name"),
        bio=user.get("bio"),
        city=user.get("city"),
        photo_url=user.get("photo_url"),
        created_at=user["created_at"],
    )
