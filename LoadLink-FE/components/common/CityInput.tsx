"use client";

import { useState } from "react";
import type { City } from "@/types/city";

type CityInputProps = {
  placeholder?: string;
  initialValue?: string;
  onSelect: (city: City) => void;
};

export default function CityInput({
  placeholder = "Type city name...",
  initialValue = "",
  onSelect,
}: CityInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCities = async (value: string) => {
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?country=in&types=place&access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_KEY
        }`
      );
      const data = await res.json();

      const formatted: City[] = data.features.map((item: any) => ({
        id: item.id,
        place_name: item.place_name,
        center: item.center,
      }));

      setResults(formatted);
    } catch (err) {
      console.error("Error fetching cities", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => searchCities(e.target.value)}
        className="border p-2 w-full rounded bg-background"
        placeholder={placeholder}
      />

      {loading && (
        <div className="text-xs text-muted-foreground mt-1">Searching...</div>
      )}

      {results.length > 0 && (
        <ul className="absolute bg-popover border mt-1 rounded shadow w-full z-20 max-h-60 overflow-auto text-sm">
          {results.map((city) => (
            <li
              key={city.id}
              className="px-3 py-2 hover:bg-accent cursor-pointer"
              onClick={() => {
                onSelect(city);
                setQuery(city.place_name);
                setResults([]);
              }}
            >
              {city.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
