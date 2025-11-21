"use client";

import api from "../lib/api";

// ------------------
// Types
// ------------------
export interface ReviewBase {
  booking_id: string;
  to_user_id: string;
  rating: number; // 1-5
  comment?: string;
}

export interface ReviewCreate extends ReviewBase {}

export interface ReviewUpdate {
  rating?: number;
  comment?: string;
}

export interface ReviewOut extends ReviewBase {
  id: string;
  from_user_id: string;
  created_date: string;
  to_user_id: string;
  booking_id: string;
  rating: number;
  comment?: string; // ISO string
}




// ------------------
// API calls
// ------------------

// Create a review
export const createReviewApi = async (
  reviewData: ReviewCreate
): Promise<ReviewOut> => {
  const res = await api.post("/reviews/", reviewData);
  return res.data;
};

// Get all reviews
export const getReviewsApi = async (): Promise<ReviewOut[]> => {
  const res = await api.get("/reviews/");
  return res.data;
};

// Get review by ID
export const getReviewByIdApi = async (
  reviewId: string
): Promise<ReviewOut> => {
  const res = await api.get(`/reviews/${reviewId}`);
  return res.data;
};

// Update review
export const updateReviewApi = async (
  reviewId: string,
  reviewData: ReviewUpdate
): Promise<ReviewOut> => {
  const res = await api.put(`/reviews/${reviewId}`, reviewData);
  return res.data;
};

// Delete review
export const deleteReviewApi = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};



export const getMyReviewsApi = async () => {
  const res = await api.get("/reviews/me");
  return res.data; // list of ReviewOut
};