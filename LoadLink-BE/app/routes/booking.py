from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from app import models
from app.schemas.booking import BookingOut, BookingResponse, BookingCreate, BookingUpdate
from app.dependencies import get_db, get_current_user


router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("/carriers", response_model=list[BookingOut])
def get_carrier_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "carrier":
        raise HTTPException(status_code=403, detail="Only carriers can view their bookings")

    # 1. get all trips owned by this carrier
    trip_ids = db.query(models.Trip.id).filter(models.Trip.carrier_id == current_user.id).subquery()

    # 2. get all bookings for those trips
    bookings = db.query(models.Booking).filter(models.Booking.trip_id.in_(trip_ids)).all()

    return bookings


@router.post("/", response_model=BookingResponse)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "shipper":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shippers can create bookings",
        )

    # Fetch the trip
    trip = db.query(models.Trip).filter_by(id=booking_in.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Check if enough capacity is available
    if booking_in.load_size > trip.available_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough capacity. Available: {trip.available_capacity} kg",
        )

    # Calculate total price
    total_price = trip.price_per_kg * booking_in.load_size

    # Create booking
    booking = models.Booking(
        trip_id=booking_in.trip_id,
        shipper_id=current_user.id,
        load_size=booking_in.load_size,
        total_price=total_price,
        status="pending",
        created_date=date.today(),
        notes=booking_in.notes,
    )

    # Deduct capacity
    trip.available_capacity -= booking_in.load_size

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking



# Get All Bookings (shipper sees own, admin can see all)
@router.get("/", response_model=list[BookingResponse])
def get_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "shipper":
        return db.query(models.Booking).filter_by(shipper_id=current_user.id).all()
    return db.query(models.Booking).all()


# Get Booking by ID
@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.query(models.Booking).filter_by(id=booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "shipper" and booking.shipper_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return booking


# Update Booking (shipper can only update notes, admin/carrier may change status)
@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: str,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.query(models.Booking).filter_by(id=booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Shipper can only update their own booking
    if current_user.role == "shipper":
        if booking.shipper_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Restrict shippers to updating only notes
        if booking_in.notes is not None:
            booking.notes = booking_in.notes
    else:
        # Admin/Carrier can update everything
        for key, value in booking_in.dict(exclude_unset=True).items():
            setattr(booking, key, value)

    db.commit()
    db.refresh(booking)
    return booking


# Delete Booking (shipper can delete only their own, admin can delete any)
@router.delete("/{booking_id}", status_code=204)
def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.query(models.Booking).filter_by(id=booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "shipper" and booking.shipper_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(booking)
    db.commit()
    return

# Get all bookings for a specific trip
@router.get("/trip/{trip_id}", response_model=list[BookingResponse])
def get_bookings_by_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Check if the trip exists
    trip = db.query(models.Trip).filter_by(id=trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Authorization: Carrier can only see their own trips
    if current_user.role == "carrier" and trip.carrier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Shipper can see their own bookings only
    if current_user.role == "shipper":
        return db.query(models.Booking).filter_by(trip_id=trip_id, shipper_id=current_user.id).all()

    # Admin can see all bookings for this trip
    return db.query(models.Booking).filter_by(trip_id=trip_id).all()


