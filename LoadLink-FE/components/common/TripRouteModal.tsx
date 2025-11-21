"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RouteMap from "@/components/common/RouteMap";
import type { City } from "@/types/city";

type Props = {
  open: boolean;
  onClose: () => void;
  trip: any;
};

export function TripRouteModal({ open, onClose, trip }: Props) {
  if (!trip) return null;

  const fromCity: City = {
    id: "origin",
    place_name: trip.origin,
    center: [trip.origin_lng, trip.origin_lat],
  };

  const toCity: City = {
    id: "destination",
    place_name: trip.destination,
    center: [trip.destination_lng, trip.destination_lat],
  };

  const routeGeojson = trip.route_geometry
    ? {
        type: "Feature",
        geometry: JSON.parse(trip.route_geometry),
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            Route: {trip.origin} → {trip.destination}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <RouteMap from={fromCity} to={toCity} route={routeGeojson} />

          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>
              Distance:{" "}
              <b>{trip.distance_km ? trip.distance_km.toFixed(1) : "N/A"} km</b>
            </span>
            <span>
              Duration: <b>{trip.duration_minutes ?? "N/A"} mins</b>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
