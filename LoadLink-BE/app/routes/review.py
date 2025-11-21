from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from app import models
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUpdate, ReviewResponse
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# ------------------
# Create Review
# ------------------
@router.post("/", response_model=ReviewResponse)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if booking exists
    booking = db.query(models.Booking).filter_by(id=review_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Prevent user from reviewing themselves
    if review_in.to_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    # Create review entry
    review = models.Review(
        booking_id=review_in.booking_id,
        from_user_id=current_user.id,
        to_user_id=review_in.to_user_id,
        rating=review_in.rating,
        comment=review_in.comment,
        created_date=date.today()
    )

    db.add(review)

    # --- ⭐ Update the reviewed user's rating ---
    user_being_reviewed = db.query(models.User).filter(
        models.User.id == review_in.to_user_id
    ).first()

    if not user_being_reviewed:
        raise HTTPException(status_code=404, detail="User not found for rating update")

    # Ensure current rating and count are safe
    old_rating = float(user_being_reviewed.rating or 0)
    old_count = user_being_reviewed.review_count or 0

    # New rating calculation
    new_rating = (old_rating * old_count + review_in.rating) / (old_count + 1)

    # Update user fields
    user_being_reviewed.rating = round(new_rating, 1)  # store one decimal
    user_being_reviewed.review_count = old_count + 1

    db.commit()
    db.refresh(review)

    return review


    # ------------------
    # Update booking review flags
    # ------------------
    if current_user.id == booking.shipper_id:
        booking.shipper_reviewed = True
    elif current_user.id == booking.trip.carrier_id:  # Assuming trip has carrier_id
        booking.carrier_reviewed = True

    db.commit()
    db.refresh(review)
    return review


# ------------------
# Get All Reviews
# ------------------
@router.get("/", response_model=list[ReviewResponse])
def get_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Review).all()

# ------------------
# Get Review by ID
# ------------------
@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    review = db.query(models.Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

# ------------------
# Update Review
# ------------------
@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: str,
    review_in: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    review = db.query(models.Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Only author can update
    if review.from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, value in review_in.dict(exclude_unset=True).items():
        setattr(review, key, value)

    db.commit()
    db.refresh(review)
    return review

# ------------------
# Delete Review
# ------------------
@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    review = db.query(models.Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Only author can delete
    if review.from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(review)
    db.commit()
    return

@router.get("/reviews/me", response_model=list[ReviewOut])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reviews = (
        db.query(models.Review)
        .filter(models.Review.to_user_id == current_user.id)
        .order_by(models.Review.created_date.desc())
        .all()
    )

    return reviews
