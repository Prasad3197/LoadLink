"use client";

import api from "../lib/api";

// ------------------
// Types
// ------------------
export type TripStatus = "active" | "completed" | "cancelled";

export interface TripCreate {
  vehicle_id: string;
  origin: string;
  destination: string;
  departure_date: string; // ISO date string
  arrival_date: string; // ISO date string
  price_per_kg: number;
  available_capacity?: number;
  status: TripStatus;
  description?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  route_geometry?: string | null;
}

export interface TripUpdate {
  vehicle_id?: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  arrival_date?: string;
  price_per_kg?: number;
  available_capacity?: number;
  status?: TripStatus;
  description?: string;
}

export interface TripOut {
  id: string;
  carrier_id: string;
  vehicle_id: string;
  origin: string;
  destination: string;
  departure_date: string; // ISO string returned from FastAPI
  arrival_date: string;
  price_per_kg: number;
  available_capacity: number;
  total_capacity: number;
  status: TripStatus;
  description?: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  route_geometry?: string | null;
}

// ------------------
// API calls
// ------------------

// Create trip (carriers only)
export const createTripApi = async (tripData: TripCreate): Promise<TripOut> => {
  const res = await api.post("/trips/", tripData);
  return res.data;
};

// View all active trips (shippers)
export const getAllTripsApi = async (): Promise<TripOut[]> => {
  const res = await api.get("/trips/all");
  return res.data;
};

// View carrier's own trips
export const getMyTripsApi = async (): Promise<TripOut[]> => {
  const res = await api.get("/trips/my");
  return res.data;
};

// Get trip by ID
export const getTripByIdApi = async (tripId: string): Promise<TripOut> => {
  const res = await api.get(`/trips/${tripId}`);
  return res.data;
};

// Update trip
export const updateTripApi = async (
  tripId: string,
  tripData: TripUpdate
): Promise<TripOut> => {
  const res = await api.put(`/trips/${tripId}`, tripData);
  return res.data;
};

// Delete trip
export const deleteTripApi = async (tripId: string): Promise<void> => {
  await api.delete(`/trips/${tripId}`);
};
