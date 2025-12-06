"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { bookings, trips, users, vehicles } from "@/lib/data";
import {
  Weight,
  DollarSign,
  Phone,
  Mail,
  ArrowLeft,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TripBookingsPage() {
  const { user } = useAuth();
  const params = useParams();
  const tripId = params.id as string;
  const trip = trips.find((t) => t.id === tripId && t.carrier_id === user?.id);
  const vehicle = trip ? vehicles.find((v) => v.id === trip.vehicle_id) : null;
  const tripBookings = bookings.filter((b) => b.trip_id === tripId);

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Trip not found or you don't have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/carrier/trips">Back to Trips</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/carrier/trips">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trip Bookings</h1>
          <p className="text-muted-foreground">
            Bookings for {trip.origin} → {trip.destination}
          </p>
        </div>
      </div>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Trip Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Route</p>
            <p className="font-medium">
              {trip.origin} → {trip.destination}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Departure</p>
            <p className="font-medium">
              {new Date(trip.departureDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vehicle</p>
            <p className="font-medium">
              {vehicle?.type} ({vehicle?.licensePlate})
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Capacity</p>
            <p className="font-medium">
              {trip.availableCapacity.toLocaleString()} kg
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bookings */}
      {tripBookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tripBookings.map((booking) => {
            const shipper = users.find((u) => u.id === booking.shipperId);
            if (!shipper) return null;

            return (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Booking #{booking.id}
                    </CardTitle>
                    <Badge
                      variant={
                        booking.status === "pending"
                          ? "secondary"
                          : booking.status === "accepted"
                          ? "default"
                          : booking.status === "fulfilled"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.loadSize.toLocaleString()} kg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        ${booking.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Shipper Info */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar>
                        <AvatarImage
                          src={shipper.avatar || "/placeholder.svg"}
                          alt={shipper.name}
                        />
                        <AvatarFallback>
                          {shipper.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{shipper.name}</p>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">
                            {shipper.rating} ⭐ ({shipper.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{shipper.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{shipper.email}</span>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm">
                        <strong>Special Instructions:</strong> {booking.notes}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Booked on{" "}
                    {new Date(booking.createdDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No bookings for this trip yet.
          </p>
        </div>
      )}
    </div>
  );
}
