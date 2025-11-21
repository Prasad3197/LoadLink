from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.models import Trip, Vehicle, User
from app.schemas.trip import TripUpdate
from app.schemas.trip import TripCreate, TripOut
from app.dependencies import get_current_user, get_db

trip_router = APIRouter(
    prefix="/trips",
    tags=["trips"]
)

# ---------------------------
# Create Trip
# ---------------------------
@trip_router.post("/", response_model=TripOut)
def create_trip(
    trip_in: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only carriers can create trips
    if current_user.role != "carrier":
        raise HTTPException(status_code=403, detail="Only carriers can create trips")
    
    # Check vehicle existence and ownership
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.carrier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vehicle does not belong to you")
    
    # Determine capacities
    total_capacity = vehicle.capacity
    available_capacity = trip_in.available_capacity or total_capacity
    if available_capacity > total_capacity:
        raise HTTPException(status_code=400, detail="Available capacity cannot exceed vehicle capacity")

    # Create trip (NOW including route fields)
    trip = Trip(
        carrier_id=current_user.id,
        vehicle_id=trip_in.vehicle_id,
        origin=trip_in.origin,
        destination=trip_in.destination,
        departure_date=trip_in.departure_date,
        arrival_date=trip_in.arrival_date,
        price_per_kg=trip_in.price_per_kg,
        total_capacity=total_capacity,
        available_capacity=available_capacity,
        status=trip_in.status,
        description=trip_in.description,

        # NEW FIELDS
        origin_lat=trip_in.origin_lat,
        origin_lng=trip_in.origin_lng,
        destination_lat=trip_in.destination_lat,
        destination_lng=trip_in.destination_lng,
        distance_km=trip_in.distance_km,
        duration_minutes=trip_in.duration_minutes,
        route_geometry=trip_in.route_geometry
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


# ---------------------------
# 1. View all active trips (for shippers)
# ---------------------------
@trip_router.get("/all", response_model=list[TripOut])
def get_all_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trips = db.query(Trip).filter(Trip.status == "active").all()
    return trips


# ---------------------------
# 2. View carrier's own trips (for carriers)
# ---------------------------
@trip_router.get("/my", response_model=list[TripOut])
def get_my_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "carrier":
        raise HTTPException(status_code=403, detail="Only carriers can view their own trips")
    
    trips = db.query(Trip).filter(Trip.carrier_id == current_user.id).all()
    return trips


# ---------------------------
# Get Trip by ID
# ---------------------------
@trip_router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip

# ---------------------------
# Update Trip
# ---------------------------
@trip_router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: UUID,
    trip_in: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print ("here")
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.carrier_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this trip")

    # If vehicle_id is being updated, check ownership
    if trip_in.vehicle_id and trip_in.vehicle_id != trip.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip_in.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if vehicle.carrier_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vehicle does not belong to you")
        trip.vehicle_id = trip_in.vehicle_id
    
    # Update optional fields
    update_data = trip_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    # If available_capacity not provided, keep current or validate against vehicle capacity
    if trip.available_capacity > trip.total_capacity:
        trip.available_capacity = trip.total_capacity

    db.commit()
    db.refresh(trip)
    return trip


# ---------------------------
# Delete Trip
# ---------------------------
@trip_router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.carrier_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this trip")
    
    db.delete(trip)
    db.commit()
    return
