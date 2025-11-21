"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TripManagementCard } from "@/components/carrier/trip-management-card";
import { useAuth } from "@/contexts/auth-context";
import { trips, bookings, vehicles, payments } from "@/lib/data";
import {
  Truck,
  Package,
  DollarSign,
  Star,
  Plus,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { getMyVehiclesApi, VehicleOut } from "@/services/vehicles";
import { useEffect, useState } from "react";
import { getMyTripsApi, TripOut } from "@/services/trips";
import { getAllPaymentsApi, PaymentOut } from "@/services/payment";
import { getShipperByIdApi, UserOut } from "@/services/user";
import { set } from "date-fns";

export default function CarrierDashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripOut[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOut[]>([]);
  const [payments, setPayments] = useState<PaymentOut[]>([]);
  const [userData, setUserData] = useState<UserOut>();
  const [rating, setRating] = useState<number>(0); // Adjust type as needed
  useEffect(() => {
    async function fetchData() {
      try {
        const [tripsRes, vehiclesRes] = await Promise.all([
          getMyTripsApi(),
          getMyVehiclesApi(),
        ]);
        setTrips(tripsRes);
        setVehicles(vehiclesRes);

        // if payments exist
        const userres = await getShipperByIdApi(user?.id || "");
        setUserData(userres);
        setRating(userres.rating || 0);
        console.log(userres);
        const paymentsRes = await getAllPaymentsApi();
        setPayments(paymentsRes);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    }

    if (user) fetchData();
  }, [user]);
  const userTrips = trips.filter((t) => t.carrier_id === user?.id);
  const userVehicles = vehicles.filter((v) => v.carrier_id === user?.id);
  const userBookings = bookings.filter((b) => {
    const trip = trips.find((t) => t.id === b.trip_id);
    return trip?.carrier_id === userData?.id;
  });
  const recentTrips = userTrips.slice(0, 3);

  const userPayments = payments.filter((p) => p.to_user_id === user?.id);
  const recentPayments = userPayments.slice(0, 3);

  const stats = {
    activeTrips: userTrips.filter((t) => t.status === "active").length,
    totalEarnings: userPayments.reduce((sum, p) => sum + p.amount, 0),
    totalVehicles: userVehicles.length,
    avgRating: rating ,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Manage your trips and grow your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrips}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalEarnings.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/carrier/create-trip">
                <Plus className="h-4 w-4 mr-2" />
                Create New Trip
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/carrier/vehicles">
                <Truck className="h-4 w-4 mr-2" />
                Manage Vehicles
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/carrier/bookings">
                <Package className="h-4 w-4 mr-2" />
                View Booking Requests
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trips and Recent Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Trips</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/carrier/trips">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <TripManagementCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  No trips yet. Create your first trip!
                </p>
                <Button asChild>
                  <Link href="/carrier/create-trip">Create Trip</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Recent Earnings</span>
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/carrier/earnings">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => {
                  const booking = bookings.find(
                    (b) => b.id === payment.booking_id
                  );
                  const trip = booking
                    ? trips.find((t) => t.id === booking.trip_id)
                    : null;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors duration-200"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {trip
                            ? `${trip.origin} → ${trip.destination}`
                            : `Payment #${payment.id.slice(-4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking?.load_size.toLocaleString()} kg •{" "}
                          {new Date(
                            payment.completed_date || payment.created_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No earnings yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
