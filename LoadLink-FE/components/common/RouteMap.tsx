"use client";

import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { City } from "@/types/city";

type RouteMapProps = {
  from: City | null;
  to: City | null;
  route: any;
};

export default function RouteMap({ from, to, route }: RouteMapProps) {
  const initialView = {
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4,
  };

  return (
    <div className="w-full h-[350px] rounded-md overflow-hidden border">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_KEY}
        initialViewState={initialView}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {from && (
          <Marker
            longitude={from.center[0]}
            latitude={from.center[1]}
            anchor="bottom"
          />
        )}
        {to && (
          <Marker
            longitude={to.center[0]}
            latitude={to.center[1]}
            anchor="bottom"
          />
        )}

        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 4,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
