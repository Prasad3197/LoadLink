"use client";

import api from "../lib/api";

export interface PaymentOut {
  id: string;
  booking_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number; // Numeric(12,2) → number
  status: string; // pending | completed | failed
  created_date: string;
  completed_date: string | null;
}

// Normally unused for your create route, but included for completeness
export interface PaymentCreate {
  booking_id: string;
}
// Create a payment for a booking
export const createPaymentApi = async (
  bookingId: string
): Promise<PaymentOut> => {
  const res = await api.post(`/payments/${bookingId}`);
  return res.data;
};

// Get all payments for logged-in user (sent + received)
export const getMyPaymentsApi = async (): Promise<PaymentOut[]> => {
  const res = await api.get("/payments/me");
  return res.data;
};
