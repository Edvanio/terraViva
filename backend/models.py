from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


class OtpRequest(BaseModel):
    phone: str


class OtpVerify(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    payment_methods: Optional[list[Literal["cash", "pix", "card"]]] = None
    photo_url: Optional[str] = None
    cover_url: Optional[str] = None
    gallery: Optional[list[str]] = None
    pix_key: Optional[str] = None
    address: Optional[str] = None
    expo_push_token: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    payment_methods: list[str] = ["cash"]
    photo_url: Optional[str] = None
    cover_url: Optional[str] = None
    gallery: list[str] = []
    pix_key: Optional[str] = None
    address: Optional[str] = None


class BancaResponse(BaseModel):
    id: str
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    payment_methods: list[str] = ["cash"]
    photo_url: Optional[str] = None
    cover_url: Optional[str] = None
    categories: list[str] = []
    products_count: int = 0


class ProductCreate(BaseModel):
    name: str
    price: float = Field(gt=0)
    description: Optional[str] = None
    photo_url: Optional[str] = None
    category: Optional[str] = None
    color_primary: Optional[str] = None
    color_accent: Optional[str] = None
    is_active: bool = True
    stock: int = 1


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None
    photo_url: Optional[str] = None
    category: Optional[str] = None
    color_primary: Optional[str] = None
    color_accent: Optional[str] = None
    is_active: Optional[bool] = None
    stock: Optional[int] = None


class ProductResponse(BaseModel):
    id: str
    user_id: str
    name: str
    price: float
    description: Optional[str] = None
    photo_url: Optional[str] = None
    category: Optional[str] = None
    color_primary: Optional[str] = None
    color_accent: Optional[str] = None
    is_active: bool = True
    stock: Optional[int] = None


class AIProductGenerateRequest(BaseModel):
    photo_url: str
    city: Optional[str] = None


class AIProductGenerateResponse(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    color_primary: Optional[str] = None
    color_accent: Optional[str] = None
    suggested_price: Optional[float] = None
    suggested_price_note: Optional[str] = None
    original_photo_url: str
    enhanced_photo_url: Optional[str] = None


class ReservationCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    pickup_location: Literal["feira", "produtor", "entrega"]
    payment_intent: Literal["cash", "pix", "card"]


class ReservationStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "collected", "cancelled"]


class ReservationResponse(BaseModel):
    id: str
    consumer_id: str
    producer_id: str
    product_id: str
    product_name: str
    product_photo_url: Optional[str] = None
    product_description: Optional[str] = None
    product_category: Optional[str] = None
    consumer_name: Optional[str] = None
    consumer_phone: Optional[str] = None
    producer_name: Optional[str] = None
    producer_phone: Optional[str] = None
    producer_photo_url: Optional[str] = None
    quantity: int
    total_price: float
    pickup_location: Literal["feira", "produtor", "entrega"]
    payment_intent: Literal["cash", "pix", "card"]
    status: Literal["pending", "confirmed", "collected", "cancelled"]
    created_at: datetime
    updated_at: datetime


class FairConfigCreate(BaseModel):
    name: str
    city: str
    logo_url: Optional[str] = None
    primary_color: str = "#2A5C2E"
    secondary_color: str = "#F7F3EC"
    fair_day: str
    fair_start_time: str
    fair_end_time: str
    fair_location: str
    order_window_open: str
    order_window_close: str
    active: bool = True


class FairConfigUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    fair_day: Optional[str] = None
    fair_start_time: Optional[str] = None
    fair_end_time: Optional[str] = None
    fair_location: Optional[str] = None
    order_window_open: Optional[str] = None
    order_window_close: Optional[str] = None
    active: Optional[bool] = None


class FairConfigResponse(BaseModel):
    id: str
    name: str
    city: str
    logo_url: Optional[str] = None
    primary_color: str
    secondary_color: str
    fair_day: str
    fair_start_time: str
    fair_end_time: str
    fair_location: str
    order_window_open: str
    order_window_close: str
    active: bool
