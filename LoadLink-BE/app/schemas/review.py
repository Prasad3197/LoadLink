from pydantic import BaseModel, UUID4, Field, conint
from datetime import date
from typing import Optional

# ------------------
# Base / shared
# ------------------
class ReviewBase(BaseModel):
    booking_id: UUID4
    to_user_id: UUID4
    rating: conint(ge=1, le=5)  # Rating must be 1-5
    comment: Optional[str] = None

# ------------------
# Create / Update
# ------------------
class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[conint(ge=1, le=5)] = None
    comment: Optional[str] = None

# ------------------
# Response
# ------------------
class ReviewResponse(ReviewBase):
    id: UUID4
    from_user_id: UUID4
    created_date: date

    class Config:
        orm_mode = True

class ReviewOut(BaseModel):
    id: UUID4
    from_user_id: UUID4
    to_user_id: UUID4
    booking_id: UUID4
    rating: int
    comment: str | None
    created_date: date