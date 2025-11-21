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
import { IndianRupee, TrendingDown, Calendar, Package } from "lucide-react";

import { getMyPaymentsApi, PaymentOut } from "@/services/payments";
import { getBookingsApi, BookingOut } from "@/services/booking";
import { getAllTripsApi, TripOut } from "@/services/trips";
import { getUserByIdApi, UserOut } from "@/services/user";

export default function ShipperSpendingPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<PaymentOut[]>([]);
  const [bookings, setBookings] = useState<BookingOut[]>([]);
  const [trips, setTrips] = useState<TripOut[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserOut>>({});

  // ----------------------------
  // Fetch backend data
  // ----------------------------
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [pRes, bRes, tRes] = await Promise.all([
          getMyPaymentsApi(), // /payments/me (sent + received)
          getBookingsApi(), // /bookings/ (shipper’s own bookings)
          getAllTripsApi(), // /trips/all (active trips)
        ]);

        setPayments(pRes);
        setBookings(bRes);
        setTrips(tRes);

        // Build carrier user map from trips involved in these bookings
        const carrierIds = new Set<string>();
        bRes.forEach((b) => {
          const trip = tRes.find((t) => t.id === b.trip_id);
          if (trip) carrierIds.add(trip.carrier_id);
        });

        const carrierUsers = await Promise.all(
          Array.from(carrierIds).map((id) => getUserByIdApi(id))
        );

        const map: Record<string, UserOut> = {};
        carrierUsers.forEach((u) => {
          map[u.id] = u;
        });
        setUserMap(map);
      } catch (err) {
        console.error("Shipper spending fetch error:", err);
      }
    };

    fetchData();
  }, [user]);

  // ----------------------------
  // Filter: only payments SENT by this shipper
  // ----------------------------
  const shipperPayments = payments.filter((p) => p.from_user_id === user?.id);

  // Bookings belonging to this shipper (defensive, though /bookings/ already does this)
  const shipperBookings = bookings.filter((b) => b.shipper_id === user?.id);

  // Only count bookings that are PAID for spending stats
  const paidBookings = shipperBookings.filter((b) => b.status === "paid");

  // ----------------------------
  // Spending calculations
  // ----------------------------
  const totalSpent = shipperPayments.reduce((sum, p) => sum + p.amount, 0);

  const thisMonthSpent = shipperPayments
    .filter((p) => {
      const d = new Date(p.completed_date ?? p.created_date);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const avgSpendingPerShipment =
    paidBookings.length > 0 ? totalSpent / paidBookings.length : 0;

  // ----------------------------
  // Precompute rows for Payment History
  // ----------------------------
  const spendingRows = shipperPayments
    .map((payment) => {
      const booking = bookings.find((b) => b.id === payment.booking_id);
      if (!booking) return null;

      const trip = trips.find((t) => t.id === booking.trip_id);
      if (!trip) return null;

      const carrier = userMap[trip.carrier_id];

      return { payment, booking, trip, carrier };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Spending History</h1>
        <p className="text-muted-foreground">
          Track your payments and completed shipments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{thisMonthSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Shipments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg per Shipment
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{avgSpendingPerShipment.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Your completed payments and shipments
          </CardDescription>
        </CardHeader>

        <CardContent>
          {spendingRows.length > 0 ? (
            <div className="space-y-4">
              {spendingRows
                .slice(0, 20)
                .map(({ payment, booking, trip, carrier }) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {trip.origin} → {trip.destination}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.load_size.toLocaleString()} kg • Carrier:{" "}
                        {carrier ? carrier.name : "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid on{" "}
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
              <p className="text-muted-foreground">No payments yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
