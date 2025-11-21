from pydantic import BaseModel, constr, conint, validator
from uuid import UUID
from datetime import date
from enum import Enum
from typing import Optional

class TripStatus(str, Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"



# Input schema
class TripCreate(BaseModel):
    vehicle_id: UUID
    origin: str
    destination: str
    departure_date: date
    arrival_date: date
    price_per_kg: float
    available_capacity: Optional[int] = None  # optional, default to vehicle capacity
    status: TripStatus
    description: Optional[str] = None
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    route_geometry: Optional[str] = None

    @validator("arrival_date")
    def check_dates(cls, v, values):
        dep = values.get("departure_date")
        if dep and v <= dep:
            raise ValueError("Arrival date must be after departure date")
        return v

class TripUpdate(BaseModel):
    vehicle_id: Optional[UUID] = None
    origin: Optional[constr(max_length=255)] = None
    destination: Optional[constr(max_length=255)] = None
    departure_date: Optional[date] = None
    arrival_date: Optional[date] = None
    price_per_kg: Optional[float] = None
    available_capacity: Optional[conint(ge=0)] = None
    status: Optional[constr(max_length=20)] = None
    description: Optional[str] = None

    @validator("arrival_date")
    def check_dates(cls, v, values):
        dep = values.get("departure_date")
        if dep and v and v <= dep:
            raise ValueError("Arrival date must be after departure date")
        return v

    @validator("available_capacity")
    def check_capacity(cls, v, values):
        total = values.get("total_capacity")
        if total is not None and v > total:
            raise ValueError("Available capacity cannot exceed total capacity")
        return v

# Response schema
class TripOut(BaseModel):
    id: UUID
    carrier_id: UUID
    vehicle_id: UUID
    origin: str
    destination: str
    departure_date: date
    arrival_date: date
    price_per_kg: float
    available_capacity: int
    total_capacity: int
    status: TripStatus
    description: Optional[str]
    origin_lat: Optional[float]
    origin_lng: Optional[float]
    destination_lat: Optional[float]
    destination_lng: Optional[float]
    distance_km: Optional[float]
    duration_minutes: Optional[int]
    route_geometry: Optional[str]

    class Config:
        orm_mode = True


