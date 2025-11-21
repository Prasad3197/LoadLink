"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Booking } from "@/lib/data"
import { trips, users, dataActions, reviews } from "@/lib/data"
import { ReviewForm } from "@/components/ui/review-form"
import { MapPin, Calendar, Weight, DollarSign, CreditCard, IndianRupee } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { BookingOut } from "@/services/booking"
import { getTripByIdApi, TripOut } from "@/services/trips"
import { getShipperByIdApi, getUserByIdApi, UserOut } from "@/services/user"
import { createPaymentApi } from "@/services/payment"

interface BookingCardProps {
  booking: BookingOut
  onReview?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onRefresh?: () => void
}

export function BookingCard({ booking, onReview, onCancel, onRefresh }: BookingCardProps) {
  const { user } = useAuth()
  const [trip, setTrip] = useState<TripOut | null>(null);
  const [carrier, setCarrier] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const tripData = await getTripByIdApi(booking.trip_id);
        if (!isMounted) return;
        setTrip(tripData);

        const carrierData = await getShipperByIdApi(tripData.carrier_id);
        console.log(carrierData)
        if (!isMounted) return;
        setCarrier(carrierData);
      } catch (err) {
        console.error("Failed to fetch trip or carrier:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [booking.trip_id]);

  if (loading)
    return <div className="text-center py-4">Loading booking details...</div>;

  if (!trip || !carrier) return null

  const existingReview = reviews.find((r) => r.fromUserId === user?.id && r.bookingId === booking.id)
  const canReview = booking.status === "paid" && !existingReview

  const handlePayNow = async () => {
    if (!trip) return;
    const total = booking.load_size * trip.price_per_kg;

    if (
      confirm(`Confirm payment of ₹${total.toLocaleString()} for this booking?`)
    ) {
      setIsProcessingPayment(true);

      try {
        // Call the backend API to create payment and mark booking as paid
        await createPaymentApi(booking.id);

        // Optionally show a success message
        alert("Payment successful! Booking is now marked as paid.");

        // Refresh parent or state
        onRefresh?.();
      } catch (err) {
        console.error("Payment failed:", err);
        alert("Payment failed. Please try again.");
      } finally {
        setIsProcessingPayment(false);
      }
    }
  };

  const handleReviewSubmit = () => {
    setShowReviewForm(false)
    onRefresh?.()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "fulfilled":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
              <span>{booking.load_size.toLocaleString()} kg</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{booking.load_size * (trip?.price_per_kg || 0)}</span>
            </div>
            <span className="text-sm text-muted-foreground">Carrier: {carrier.name}</span>
          </div>

          {booking.notes && <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{booking.notes}</p>}

          {booking.fulfilled_date && (
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-sm text-green-800">
                <strong>Fulfilled on:</strong> {new Date(booking.fulfilled_date).toLocaleDateString()}
              </p>
              {booking.paid_date && (
                <p className="text-sm text-green-800">
                  <strong>Paid on:</strong> {new Date(booking.paid_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            {booking.status === "fulfilled" && (
              <Button size="sm" onClick={handlePayNow} disabled={isProcessingPayment} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessingPayment ? "Processing..." : "Pay Now"}
              </Button>
            )}

            {canReview && (
              <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)} className="flex-1">
                Review Carrier
              </Button>
            )}

            {booking.status === "fulfilled" && onReview && (
              <Button size="sm" onClick={() => onReview(booking.id)}>
                Leave Review
              </Button>
            )}

            {booking.status === "pending" && onCancel && (
              <Button size="sm" variant="outline" onClick={() => onCancel(booking.id)}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Carrier</DialogTitle>
          </DialogHeader>
          <ReviewForm
            fromUserId={user?.id || ""}
            toUserId={carrier.id}
            toUserName={carrier.name}
            bookingId={booking.id}
            userRole="shipper"
            onSuccess={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
