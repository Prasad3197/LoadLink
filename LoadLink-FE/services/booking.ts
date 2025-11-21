"use client";

import api from "../lib/api";

// ------------------
// Types
// ------------------
export type BookingStatus =
  | "pending"
  | "accepted"
  | "fulfilled"
  | "cancelled"
  | "paid";

export interface BookingCreate {
  trip_id: string;
  load_size: number;
  notes?: string;
}

export interface BookingUpdate {
  status?: BookingStatus;
  fulfilled_date?: string; // ISO string
  paid_date?: string;
  qr_generated?: boolean;
  qr_generated_date?: string;
  notes?: string;
}

export interface BookingOut {
  id: string;
  trip_id: string;
  shipper_id: string;
  load_size: number;
  status: BookingStatus;
  total_price: number;
  created_date: string;
  fulfilled_date?: string;
  paid_date?: string;
  qr_generated?: boolean;
  qr_generated_date?: string;
  notes?: string;
}

// ------------------
// API calls
// ------------------

// Create a booking (shippers only)
export const createBookingApi = async (
  bookingData: BookingCreate
): Promise<BookingOut> => {
  const res = await api.post("/bookings/", bookingData);
  return res.data;
};

// Get all bookings (shippers see their own, admin sees all)
export const getBookingsApi = async (): Promise<BookingOut[]> => {
  const res = await api.get("/bookings/");
  return res.data;
};

// Get booking by ID
export const getBookingByIdApi = async (
  bookingId: string
): Promise<BookingOut> => {
  const res = await api.get(`/bookings/${bookingId}`);
  return res.data;
};

// Update booking
export const updateBookingApi = async (
  bookingId: string,
  bookingData: BookingUpdate
): Promise<BookingOut> => {
  const res = await api.put(`/bookings/${bookingId}`, bookingData);
  return res.data;
};

// Delete booking
export const deleteBookingApi = async (bookingId: string): Promise<void> => {
  await api.delete(`/bookings/${bookingId}`);
};

// ------------------
// Get bookings by Trip ID
// ------------------
export const getBookingsByTripApi = async (
  tripId: string
): Promise<BookingOut[]> => {
  const res = await api.get(`/bookings/trip/${tripId}`);
  return res.data;
};

export const getCarrierBookingsApi = async (): Promise<BookingOut[]> => {
  const res = await api.get("/bookings/carriers");
  return res.data;
};
