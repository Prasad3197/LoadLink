"use client";

import api from "../lib/api";

// ------------------
// Types
// ------------------
export type UserRole = "shipper" | "carrier";

export interface UserOut {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  rating: number;
  review_count: number;
  joined_date: string; // ISO string from FastAPI
  avatar?: string;
  reviewCount: number;
  joinedDate: string;  
}

// ------------------
// API calls
// ------------------

// Get current user (from token/session)
export const getCurrentUserApi = async (): Promise<UserOut> => {
  const res = await api.get("/users/me");
  return res.data;
};

// Get user by ID
export const getUserByIdApi = async (userId: string): Promise<UserOut> => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};

// Get shipper by ID
export const getShipperByIdApi = async (
  shipperId: string
): Promise<UserOut> => {
  const res = await api.get(`/users/shipper/${shipperId}`);
  return res.data;
};

export const updateUserProfileApi = async (data: any) => {
  const res = await api.put("/users/me", data);
  return res.data;
};
