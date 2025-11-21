"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Trip } from "@/lib/data"
import { vehicles, bookings } from "@/lib/data"
import { MapPin, Calendar, Weight, DollarSign, Package, IndianRupee } from "lucide-react"
import { TripOut } from "@/services/trips"

interface TripManagementCardProps {
  trip: TripOut
  onViewBookings?: (tripId: string) => void
  onEdit?: (tripId: string) => void
  onCancel?: (tripId: string) => void
}

export function TripManagementCard({ trip, onViewBookings, onEdit, onCancel }: TripManagementCardProps) {
  const vehicle = vehicles.find((v) => v.id === trip.vehicle_id)
  const tripBookings = bookings.filter((b) => b.trip_id === trip.id)
  const pendingBookings = tripBookings.filter((b) => b.status === "pending")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trip #{trip.id}</CardTitle>
          <Badge className={getStatusColor(trip.status)}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{trip.origin}</span>
          </div>
          <div className="text-sm text-muted-foreground">→</div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{trip.destination}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(trip.departure_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span>{trip.available_capacity.toLocaleString()} kg available</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">₹{trip.price_per_kg}/kg</span>
          </div>
          {vehicle && (
            <span className="text-sm text-muted-foreground capitalize">
              {vehicle.type}
            </span>
          )}
        </div>

        {pendingBookings.length > 0 && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
            <Package className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {pendingBookings.length} pending booking(s)
            </span>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          {onViewBookings && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewBookings(trip.id)}
            >
              View Bookings ({tripBookings.length})
            </Button>
          )}
          {trip.status === "active" && onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(trip.id)}>
              Edit
            </Button>
          )}
          {trip.status === "active" && onCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(trip.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
