"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { bookings, trips, users, dataActions, reviews } from "@/lib/data";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import { ReviewForm } from "@/components/ui/review-form";
import {
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  Phone,
  Mail,
  CheckCircle,
  Package,
  QrCode,
  IndianRupee,
} from "lucide-react";
import { TripOut } from "@/services/trips";
import { useEffect } from "react";
import { BookingOut, getBookingsByTripApi, updateBookingApi } from "@/services/booking";  
import { getMyTripsApi } from "@/services/trips";
import { tr } from "date-fns/locale";
import { getShipperByIdApi, UserOut } from "@/services/user";

export default function CarrierBookingsPage() {
  const { user } = useAuth();
  const [userTrips, setUserTrips] = useState<TripOut[]>([]);
  const [userBookings, setUserBookings] = useState<BookingOut[]>([]);
  const shipperMap: Record<string, UserOut> = {};
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  const [shippers, setShippers] = useState<UserOut[]>([]);



  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTrips = async () => {
      try {
        setLoading(true);
        const trips = await getMyTripsApi();
        setUserTrips(trips);

        if (!trips.length) return;

        const allBookings: BookingOut[] = [];
        for (const trip of trips) {
          const bookings = await getBookingsByTripApi(trip.id);
          console.log("bookkkkkkk",bookings)

           for (const booking of bookings) {
             const exists = shippers.find((s) => s.id === booking.shipper_id);
             if (!exists) {
               const user = await getShipperByIdApi(booking.shipper_id);
               setShippers((prev) => [...prev, user]);
             }
           }
   
          allBookings.push(...bookings);
        }
        setUserBookings(allBookings);
      } catch (error) {
        console.error("Error fetching my trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTrips();
  }, []); // runs once on mount

  if (loading) return <div>Loading...</div>;
 
  console.log(shippers,"ghsfhgiuhsfiuguhfujio")


  const pendingBookings = userBookings.filter((b) => b.status === "pending");
  const acceptedBookings = userBookings.filter((b) => b.status === "accepted");
  const fulfilledBookings = userBookings.filter(
    (b) => b.status === "fulfilled"
  );
  const paidBookings = userBookings.filter((b) => b.status === "paid");

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      // Call backend to update booking status
      const updatedBooking = await updateBookingApi(bookingId, {
        status: "accepted",
      });

      // Optionally, update local state so UI reflects change immediately
      setUserBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );

      // Trigger re-render (if needed for other UI updates)
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to accept booking:", error);
      alert("Failed to accept booking. Please try again.");
    }
  };

  const handleRejectBooking = (bookingId: string) => {
    dataActions.updateBooking(bookingId, { status: "rejected" });
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMarkFulfilled = async (bookingId: string) => {
    const confirmFulfill = confirm(
      "Mark this booking as fulfilled? This will notify the shipper that delivery is complete."
    );
    if (!confirmFulfill) return;

    try {
      const fulfilledDate = new Date().toISOString().split("T")[0];

      // Call backend API
      const updatedBooking = await updateBookingApi(bookingId, {
        status: "fulfilled",
        fulfilled_date: fulfilledDate,
      });

      // Update local state so UI reflects change immediately
      setUserBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to mark booking as fulfilled:", error);
      alert("Failed to mark booking as fulfilled. Please try again.");
    }
  };

  const handleGenerateQR = async (bookingId: string) => {
    try {
      const qrGeneratedDate = new Date().toISOString().split("T")[0];

      // Call backend API to update the booking
      const updatedBooking = await updateBookingApi(bookingId, {
        qr_generated: true,
        qr_generated_date: qrGeneratedDate,
      });

      // Update local state so UI shows QR immediately
      setUserBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );

      // Show QR modal
      setShowQR(bookingId);

      // Trigger refresh if needed
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to generate QR:", error);
      alert("Failed to generate QR. Please try again.");
    }
  };
  const handleShowReviewForm = (bookingId: string) => {
    setShowReviewForm(bookingId);
  };

  const handleReviewSubmit = () => {
    setShowReviewForm(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const renderBookingCard = (
    booking: any,
    showActions = false,
    showFulfillAction = false,
    showQRAction = false
  ) => {
    console.log(booking.shipper_id)
    const trip = userTrips.find((t) => t.id === booking.trip_id);
    const shipper = shippers.find((s) => s.id === booking.shipper_id);
    console.log("ganpati bappa morya",shipper)
    if (!shipper) return null;


    if (!trip || !shipper) return null;

    const existingReview = reviews.find(
      (r) => r.fromUserId === user?.id && r.bookingId === booking.id
    );
    const canReview = booking.status === "paid" && !existingReview;

    return (
      <Card key={`${booking.id}-${refreshTrigger}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
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
              <span className="font-semibold text-accent">
                ₹{booking.load_size * trip.price_per_kg}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ₹{trip.price_per_kg}/kg × {booking.load_size} kg
            </span>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar>
                <AvatarImage
                  src={shipper.avatar || "/placeholder.svg"}
                  alt={shipper.name}
                />
                <AvatarFallback>{shipper.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{shipper.name}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-muted-foreground">
                    {shipper.rating} ⭐ ({shipper.review_count} reviews)
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

          {booking.fulfilledDate && (
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-sm text-green-800">
                <strong>Fulfilled on:</strong>{" "}
                {new Date(booking.fulfilledDate).toLocaleDateString()}
              </p>
              {booking.paidDate && (
                <p className="text-sm text-green-800">
                  <strong>Paid on:</strong>{" "}
                  {new Date(booking.paidDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => handleAcceptBooking(booking.id)}
                className="flex-1"
              >
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRejectBooking(booking.id)}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}

          {showFulfillAction && (
            <div className="pt-2">
              <Button
                onClick={() => handleMarkFulfilled(booking.id)}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Fulfilled
              </Button>
            </div>
          )}

          {showQRAction && (
            <div className="pt-2 space-y-2">
              {!booking.qr_generated ? (
                <Button
                  onClick={() => handleGenerateQR(booking.id)}
                  className="w-full"
                  variant="outline"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Payment QR
                </Button>
              ) : (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Payment QR Generated:</strong>{" "}
                    {new Date(booking.qr_generated_date!).toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => setShowQR(booking.id)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    View QR Code
                  </Button>
                </div>
              )}
            </div>
          )}

          {canReview && (
            <div className="pt-2">
              <Button
                onClick={() => handleShowReviewForm(booking.id)}
                variant="outline"
                className="w-full"
              >
                Review Shipper
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Booking Management
        </h1>
        <p className="text-muted-foreground">
          Review and manage booking requests for your trips.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="fulfilled">
            Fulfilled ({fulfilledBookings.length})
          </TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBookings.length})</TabsTrigger>
          <TabsTrigger value="all">All ({userBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingBookings.map((booking) =>
                renderBookingCard(booking, true)
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No pending booking requests.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {acceptedBookings.map((booking) =>
                renderBookingCard(booking, false, true)
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No accepted bookings.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fulfilled" className="space-y-4">
          {fulfilledBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fulfilledBookings.map((booking) =>
                renderBookingCard(booking, false, false, true)
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No fulfilled bookings yet.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paidBookings.map((booking) => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No paid bookings yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userBookings.map((booking) =>
              renderBookingCard(
                booking,
                booking.status === "pending",
                booking.status === "accepted",
                booking.status === "fulfilled"
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!showQR} onOpenChange={() => setShowQR(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
          </DialogHeader>
          {showQR && (
            <QRCodeDisplay
              amount={showQR ? (userBookings.find((b) => b.id === showQR)?.load_size || 0) * (userTrips.find((t) => t.id === userBookings.find((b) => b.id === showQR)?.trip_id)?.price_per_kg || 0) : 0}
              bookingId={showQR}
              onClose={() => setShowQR(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!showReviewForm}
        onOpenChange={() => setShowReviewForm(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Shipper</DialogTitle>
          </DialogHeader>
          {showReviewForm && (
            <ReviewForm
              fromUserId={user?.id || ""}
              toUserId={
                userBookings.find((b) => b.id === showReviewForm)?.shipper_id || ""
              }
              toUserName={
                users.find(
                  (u) =>
                    u.id ===
                    bookings.find((b) => b.id === showReviewForm)?.shipper_id
                )?.name || ""
              }
              bookingId={showReviewForm}
              userRole="carrier"
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
