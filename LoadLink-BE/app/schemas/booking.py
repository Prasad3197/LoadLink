from pydantic import BaseModel, UUID4, Field
from datetime import date
from typing import Optional
from decimal import Decimal

from sqlalchemy import UUID


class BookingBase(BaseModel):
    trip_id: UUID4
    load_size: int
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    fulfilled_date: Optional[date] = None
    paid_date: Optional[date] = None
    qr_generated: Optional[bool] = None
    qr_generated_date: Optional[date] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: UUID4
    shipper_id: UUID4
    status: str
    created_date: date
    fulfilled_date: Optional[date] = None
    paid_date: Optional[date] = None
    qr_generated: bool
    qr_generated_date: Optional[date] = None

class BookingOut(BaseModel):
    id: UUID4
    trip_id: UUID4
    shipper_id: UUID4
    load_size: int
    status: str
    total_price: float
    created_date: date
    notes: Optional[str] = None
    fulfilled_date: Optional[date] = None
    paid_date: Optional[date] = None
    qr_generated: Optional[bool] = None
    qr_generated_date: Optional[date] = None

    class Config:
        orm_mode = True
