"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { DollarSign, TrendingUp, Calendar, Package } from "lucide-react";

import { getMyPaymentsApi, PaymentOut } from "@/services/payments";
import { getMyTripsApi, TripOut } from "@/services/trips";
import { getCarrierBookingsApi, BookingOut } from "@/services/booking";
import { getUserByIdApi, UserOut } from "@/services/user";

export default function CarrierEarningsPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<PaymentOut[]>([]);
  const [trips, setTrips] = useState<TripOut[]>([]);
  const [bookings, setBookings] = useState<BookingOut[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserOut>>({});

  // ----------------------------
  // Fetch backend data
  // ----------------------------
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [pRes, tRes, bRes] = await Promise.all([
          getMyPaymentsApi(),
          getMyTripsApi(),
          getCarrierBookingsApi(),
        ]);

        setPayments(pRes);
        setTrips(tRes);
        setBookings(bRes);

        // Load shipper details → create map
        const shipperIds = [...new Set(bRes.map((b) => b.shipper_id))];
        const users = await Promise.all(
          shipperIds.map((id) => getUserByIdApi(id))
        );

        const map: Record<string, UserOut> = {};
        users.forEach((u) => {
          map[u.id] = u;
        });
        setUserMap(map);
      } catch (error) {
        console.error("Earnings fetch error:", error);
      }
    };

    fetchData();
  }, [user]);

  // ----------------------------
  // Filter: Only payments received by the carrier
  // ----------------------------
  const userPayments = payments.filter((p) => p.to_user_id === user?.id);

  // Carrier’s trips
  const myTripIds = new Set(trips.map((t) => t.id));

  // Bookings tied to my trips
  const userBookings = bookings.filter((b) => myTripIds.has(b.trip_id));

  // ----------------------------
  // Earnings calculations
  // ----------------------------
  const totalEarnings = userPayments.reduce((sum, p) => sum + p.amount, 0);

  const thisMonthEarnings = userPayments
    .filter((p) => {
      const d = new Date(p.completed_date ?? p.created_date);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

const completedBookings = userBookings.filter(
  (b) => b.status === "paid"
);

  const avgEarningsPerTrip =
    completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0;

  // Precomputed rows for Recent Earnings
  const earningRows = userPayments
    .map((payment) => {
      const booking = bookings.find((b) => b.id === payment.booking_id);
      if (!booking) return null;

      const trip = trips.find((t) => t.id === booking.trip_id);
      if (!trip) return null;

      const shipper = userMap[booking.shipper_id];

      return { payment, booking, trip, shipper };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground">
          Track your income and completed trips.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹{totalEarnings.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹{thisMonthEarnings.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Trips
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {completedBookings.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg per Trip</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹{avgEarningsPerTrip.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your completed trips and payments</CardDescription>
        </CardHeader>

        <CardContent>
          {earningRows.length > 0 ? (
            <div className="space-y-4">
              {earningRows
                .slice(0, 20)
                .map(({ payment, booking, trip, shipper }) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {trip.origin} → {trip.destination}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {booking.load_size.toLocaleString()} kg • Shipper:{" "}
                        {shipper ? shipper.name : "Unknown"}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Received on{" "}
                        {new Date(
                          payment.completed_date ?? payment.created_date
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-accent">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ₹{trip.price_per_kg}/kg
                      </p>
                      <p className="text-xs text-green-600 capitalize">
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No earnings yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
