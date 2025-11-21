"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/common/search-form";
import { BookingCard } from "@/components/shipper/booking-card";
import { FadeIn } from "@/components/ui/fade-in";
import { SlideIn } from "@/components/ui/slide-in";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/stagger-container";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { Package, Search, Clock, CheckCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingOut, getBookingsApi } from "@/services/booking";
import { getAllPaymentsApi, PaymentOut } from "@/services/payment";

export default function ShipperDashboard() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingOut[]>([]);
  const [payments, setPayments] = useState<PaymentOut[]>([]);

  if (loading) return <div>Loading...</div>;
  const router = useRouter();
  // if (!user || user.role !== "shipper") {
  //   router.push("/login")
  //   return null
  // }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingData = await getBookingsApi();
        const paymentData = await getAllPaymentsApi();
        console.log("first,", paymentData);
        // filter only current user’s data
        setBookings(bookingData.filter((b) => b.shipper_id === user?.id));
        setPayments(paymentData.filter((p) => p.from_user_id === user?.id));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const recentBookings = bookings.slice(0, 3);
  const recentPayments = payments.slice(0, 3);
  console.log(recentBookings.length, recentPayments.length);
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    completedBookings: bookings.filter(
      (b) => b.status === "fulfilled" || b.status === "paid"
    ).length,
    totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
  };

  const handleQuickSearch = (searchData: {
    origin: string;
    destination: string;
    date: string;
  }) => {
    const params = new URLSearchParams();
    if (searchData.origin) params.set("origin", searchData.origin);
    if (searchData.destination)
      params.set("destination", searchData.destination);
    if (searchData.date) params.set("date", searchData.date);

    router.push(`/shipper/search?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your shipments and find new carriers.
          </p>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bookings
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedBookings}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground transition-transform duration-300 hover:scale-110" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalSpent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Quick Search */}
      <SlideIn direction="up" delay={0.4}>
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Quick Search</span>
            </CardTitle>
            <CardDescription>
              Find carriers for your next shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm onSearch={handleQuickSearch} />
          </CardContent>
        </Card>
      </SlideIn>

      {/* Recent Bookings and Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SlideIn direction="left" delay={0.6}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transform hover:scale-105 transition-all duration-200 bg-transparent"
                >
                  <Link href="/shipper/bookings">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBookings.length > 0 ? (
                <StaggerContainer>
                  {recentBookings.map((booking) => (
                    <StaggerItem key={booking.id}>
                      <BookingCard booking={booking} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    No bookings yet. Start by searching for trips!
                  </p>
                  <Button
                    asChild
                    className="transform hover:scale-105 transition-all duration-200"
                  >
                    <Link href="/trips">Search Trips</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn direction="right" delay={0.8}>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Recent Payments</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transform hover:scale-105 transition-all duration-200 bg-transparent"
                >
                  <Link href="/shipper/spending">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPayments.length > 0 ? (
                <StaggerContainer>
                  {recentPayments.map((payment) => {
                    const booking = bookings.find(
                      (b) => b.id === payment.booking_id
                    );
                    return (
                      <StaggerItem key={payment.id}>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors duration-200">
                          <div>
                            <p className="text-sm font-medium">
                              Payment #{payment.id.slice(-4)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Booking #{booking?.id} •{" "}
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
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No payments yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </SlideIn>
      </div>
    </div>
  );
}
