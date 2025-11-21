from sqlalchemy import (
    Column, String, Date, ForeignKey, Boolean,
    Numeric, Text, CheckConstraint,Integer,Float
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(20), nullable=False)  # shipper, carrier, guest
    phone = Column(String(20), nullable=False)
    rating = Column(Numeric(2, 1), default=0)
    review_count = Column(Integer, default=0)
    joined_date = Column(Date, nullable=False)
    avatar = Column(Text)
    password_hash = Column(String(255), nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('shipper','carrier')", name="check_user_role"),
    )

    vehicles = relationship("Vehicle", back_populates="carrier", cascade="all, delete")
    trips = relationship("Trip", back_populates="carrier", cascade="all, delete")
    bookings = relationship("Booking", back_populates="shipper", cascade="all, delete")
    payments_sent = relationship("Payment", foreign_keys="Payment.from_user_id", back_populates="payer")
    payments_received = relationship("Payment", foreign_keys="Payment.to_user_id", back_populates="receiver")
    reviews_written = relationship("Review", foreign_keys="Review.from_user_id", back_populates="author")
    reviews_received = relationship("Review", foreign_keys="Review.to_user_id", back_populates="recipient")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), nullable=False)  # truck, van, trailer, container
    capacity = Column(Integer, nullable=False)
    license_plate = Column(String(20), unique=True, nullable=False)
    rc_number = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)

    carrier = relationship("User", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle", cascade="all, delete")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    departure_date = Column(Date, nullable=False)
    arrival_date = Column(Date, nullable=False)
    price_per_kg = Column(Numeric(10, 2), nullable=False)
    available_capacity = Column(Integer, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)  # active, completed, cancelled
    description = Column(Text)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    distance_km = Column(Numeric(10, 2), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    route_geometry = Column(Text, nullable=True)

    carrier = relationship("User", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    shipper_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    load_size = Column(Integer, nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False)  # pending, accepted, rejected, completed, fulfilled, paid
    created_date = Column(Date, nullable=False)
    notes = Column(Text)
    fulfilled_date = Column(Date)
    paid_date = Column(Date)
    qr_generated = Column(Boolean, default=False)
    qr_generated_date = Column(Date)
    

    trip = relationship("Trip", back_populates="bookings")
    shipper = relationship("User", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    reviews = relationship("Review", back_populates="booking", cascade="all, delete")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False)  # pending, completed, failed
    created_date = Column(Date, nullable=False)
    completed_date = Column(Date)

    booking = relationship("Booking", back_populates="payment")
    payer = relationship("User", foreign_keys=[from_user_id], back_populates="payments_sent")
    receiver = relationship("User", foreign_keys=[to_user_id], back_populates="payments_received")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_date = Column(Date, nullable=False)

    author = relationship("User", foreign_keys=[from_user_id], back_populates="reviews_written")
    recipient = relationship("User", foreign_keys=[to_user_id], back_populates="reviews_received")
    booking = relationship("Booking", back_populates="reviews")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="check_rating_range"),
    )
