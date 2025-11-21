"use client";
import { useEffect, useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { ArrowRight, MapPin, Calendar, DollarSign, IndianRupee } from "lucide-react";
import { getMyVehiclesApi, VehicleOut } from "@/services/vehicles";
import { createTripApi, TripCreate } from "@/services/trips";
import CityInput from "@/components/common/CityInput";
import RouteMap from "@/components/common/RouteMap";
import type { City } from "@/types/city";

export default function CreateTripPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleOut[]>([]);

  const [formData, setFormData] = useState({
    vehicleId: "",
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    pricePerKg: "",
    description: "",
  });

  // new: route-related state
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);

  // Fetch vehicles from API
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await getMyVehiclesApi();
        setVehicles(res);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const userVehicles = vehicles.filter(
    (v) => v.carrier_id === user?.id && v.is_active
  );
  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // helper: fetch route from Mapbox & update state
  const fetchRoute = async (from: City, to: City) => {
    try {
      setLoadingRoute(true);
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.center[0]},${from.center[1]};${to.center[0]},${to.center[1]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        console.warn("No route found");
        setRoute(null);
        setRouteInfo(null);
        return null;
      }

      const routeData = data.routes[0];

      setRoute({
        type: "Feature",
        geometry: routeData.geometry,
      });

      setRouteInfo({
        distanceKm: routeData.distance / 1000,
        durationMin: Math.round(routeData.duration / 60),
      });

      return routeData;
    } catch (error) {
      console.error("Error fetching route:", error);
      return null;
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    // ensure we have route info before saving
    let routeData = null;
    if (fromCity && toCity) {
      // if not already fetched via "Preview route", fetch now
      if (!routeInfo) {
        routeData = await fetchRoute(fromCity, toCity);
      }
    }

    try {
      const newTrip: TripCreate = {
        vehicle_id: formData.vehicleId,
        origin: formData.origin,
        destination: formData.destination,
        departure_date: formData.departureDate,
        arrival_date: formData.arrivalDate,
        price_per_kg: Number(formData.pricePerKg),
        available_capacity: selectedVehicle.capacity,
        status: "active",
        description: formData.description || null,

        // NEW FIELDS (make them optional in your TripCreate type)
        origin_lat: fromCity ? fromCity.center[1] : null,
        origin_lng: fromCity ? fromCity.center[0] : null,
        destination_lat: toCity ? toCity.center[1] : null,
        destination_lng: toCity ? toCity.center[0] : null,
        distance_km:
          routeInfo?.distanceKm ??
          (routeData ? routeData.distance / 1000 : null),
        duration_minutes:
          routeInfo?.durationMin ??
          (routeData ? Math.round(routeData.duration / 60) : null),
        route_geometry: route ? JSON.stringify(route.geometry) : null,
      };
      console.log("neww trip",newTrip)
      const createdTrip = await createTripApi(newTrip);
      console.log("Trip created successfully:", createdTrip);
      router.push("/carrier/trips");
    } catch (error) {
      console.error("Error creating trip:", error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.vehicleId !== "";
      case 2:
        return (
          formData.origin &&
          formData.destination &&
          formData.departureDate &&
          formData.arrivalDate
        );
      case 3:
        return formData.pricePerKg !== "";
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Trip</h1>
        <p className="text-muted-foreground">
          Set up a new trip to find shippers.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Select Vehicle"}
            {currentStep === 2 && "Route & Schedule"}
            {currentStep === 3 && "Pricing & Details"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 &&
              "Choose which vehicle you'll use for this trip"}
            {currentStep === 2 &&
              "Set your origin, destination, and travel dates"}
            {currentStep === 3 && "Set your pricing and add trip details"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Vehicle Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Vehicle</Label>
                  {userVehicles.length > 0 ? (
                    <div className="grid gap-3">
                      {userVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            formData.vehicleId === vehicle.id
                              ? "border-secondary bg-secondary/10"
                              : "border-border hover:border-secondary/50"
                          }`}
                          onClick={() =>
                            setFormData({ ...formData, vehicleId: vehicle.id })
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">
                                {vehicle.type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.license_plate}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {vehicle.capacity.toLocaleString()} kg
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Capacity
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No vehicles available.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/carrier/vehicles")}
                      >
                        Add Vehicle First
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Route & Schedule */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Origin</span>
                    </Label>
                    <CityInput
                      placeholder="Starting city"
                      onSelect={(city) => {
                        setFromCity(city);
                        setFormData((prev) => ({
                          ...prev,
                          origin: city.place_name,
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Destination</span>
                    </Label>
                    <CityInput
                      placeholder="Destination city"
                      onSelect={(city) => {
                        setToCity(city);
                        setFormData((prev) => ({
                          ...prev,
                          destination: city.place_name,
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Departure Date</span>
                    </Label>
                    <Input
                      id="departureDate"
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departureDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Arrival Date</span>
                    </Label>
                    <Input
                      id="arrivalDate"
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          arrivalDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {fromCity && toCity && (
                  <>
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRoute(fromCity, toCity)}
                        disabled={loadingRoute}
                      >
                        {loadingRoute
                          ? "Loading route..."
                          : "Preview route on map"}
                      </Button>
                      {routeInfo && (
                        <div className="text-xs text-muted-foreground">
                          Distance:{" "}
                          <span className="font-medium">
                            {routeInfo.distanceKm.toFixed(1)} km
                          </span>{" "}
                          · Duration:{" "}
                          <span className="font-medium">
                            {routeInfo.durationMin} min
                          </span>
                        </div>
                      )}
                    </div>

                    {route && (
                      <div className="mt-3">
                        <RouteMap from={fromCity} to={toCity} route={route} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Pricing & Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4" />
                    <span>Price per kg (₹)</span>
                  </Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    step="0.01"
                    placeholder="Enter price per kg"
                    value={formData.pricePerKg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerKg: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {selectedVehicle && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Available Capacity:
                      </span>
                      <span className="font-medium">
                        {selectedVehicle.capacity.toLocaleString()} kg
                      </span>
                    </div>
                    {formData.pricePerKg && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          Max Potential Earnings:
                        </span>
                        <span className="font-medium text-accent">
                          ₹
                          {(
                            selectedVehicle.capacity *
                            Number.parseFloat(formData.pricePerKg)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any special notes about this trip..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={!canProceed()}>
                  Create Trip
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
