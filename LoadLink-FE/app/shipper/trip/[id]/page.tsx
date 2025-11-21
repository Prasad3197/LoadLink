"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { trips, users, vehicles, bookings } from "@/lib/data"
import { MapPin, Calendar, Truck, Star, Weight, DollarSign, User, Phone, Mail, IndianRupee } from "lucide-react"
import { getTripByIdApi, TripOut } from "@/services/trips"
import { getUserByIdApi, UserOut } from "@/services/user"
import { getVehicleByIdApi, VehicleOut } from "@/services/vehicles"
import { BookingCreate, BookingOut, createBookingApi } from "@/services/booking"

export default function TripDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loadSize, setLoadSize] = useState("")
  const [notes, setNotes] = useState("")
  const [isBooking, setIsBooking] = useState(false)

  const tripId = params.id as string
 const [trip, setTrip] = useState<TripOut | null>(null);
 const [carrier, setCarrier] = useState<UserOut | null>(null);
 const [vehicle, setVehicle] = useState<VehicleOut | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
   if (!tripId) return;

   setLoading(true);
   setError(null);

   // Fetch trip -> then fetch carrier and vehicle
   getTripByIdApi(tripId)
     .then(async (tripData) => {
       setTrip(tripData);

       const [carrierData, vehicleData] = await Promise.all([
         getUserByIdApi(tripData.carrier_id),
         getVehicleByIdApi(tripData.vehicle_id),
       ]);

       setCarrier(carrierData);
       setVehicle(vehicleData);
     })
     .catch((err) => {
       console.error(err);
       setError("Failed to load trip details");
     })
     .finally(() => setLoading(false));
 }, [tripId]);

 if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!trip || !carrier || !vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const totalPrice = loadSize ? Number.parseFloat(loadSize) * trip.price_per_kg : 0

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !loadSize) return;

    setIsBooking(true);

    try {
      const bookingData: BookingCreate = {
        trip_id: trip!.id,
        load_size: Number.parseFloat(loadSize),
        notes,
      };

      const newBooking: BookingOut = await createBookingApi(bookingData);

      // Optionally, show a toast or confirmation message here
      console.log("Booking successful:", newBooking);

      // Redirect to bookings page
      router.push("/shipper/bookings");
    } catch (err: any) {
      console.error("Booking failed:", err);
      alert(err.response?.data?.detail || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Search
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Trip Details</h1>
        <p className="text-muted-foreground">
          Review trip information and book your shipment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trip Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{trip.origin}</p>
                    <p className="text-sm text-muted-foreground">Origin</p>
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{trip.destination}</p>
                    <p className="text-sm text-muted-foreground">Destination</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(trip.departure_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Departure</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(trip.arrival_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Arrival</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {trip.available_capacity.toLocaleString()} kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available Capacity
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">₹{trip.price_per_kg}/kg</p>
                    <p className="text-sm text-muted-foreground">
                      Price per kg
                    </p>
                  </div>
                </div>
              </div>

              {trip.description && (
                <div>
                  <p className="font-medium mb-2">Additional Information</p>
                  <p className="text-muted-foreground">{trip.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">{vehicle.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.capacity.toLocaleString()} kg capacity
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{vehicle.license_plate}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Carrier Information */}
          <Card>
            <CardHeader>
              <CardTitle>Carrier Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={carrier.avatar || "/placeholder.svg"}
                    alt={carrier.name}
                  />
                  <AvatarFallback>{carrier.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{carrier.name}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{carrier.rating}</span>
                    <span className="text-muted-foreground">
                      ({carrier.review_count} reviews)
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{carrier.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{carrier.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>
                        Member since{" "}
                        {new Date(carrier.joined_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Book This Trip</CardTitle>
              <CardDescription>
                Enter your shipment details to book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loadSize">Load Size (kg)</Label>
                  <Input
                    id="loadSize"
                    type="number"
                    placeholder="Enter weight in kg"
                    value={loadSize}
                    onChange={(e) => setLoadSize(e.target.value)}
                    max={trip.available_capacity}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {trip.available_capacity.toLocaleString()} kg
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special handling requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {loadSize && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Price:</span>
                      <span className="text-2xl font-bold text-accent">
                        ₹{totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {loadSize} kg × ₹{trip.price_per_kg}/kg
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!loadSize || isBooking}
                >
                  {isBooking ? "Booking..." : "Book Now"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
