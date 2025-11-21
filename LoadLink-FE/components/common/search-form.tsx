"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Calendar } from "lucide-react";

import CityInput from "@/components/common/CityInput";
import type { City } from "@/types/city";

interface SearchFormProps {
  onSearch?: (searchData: {
    origin: string;
    destination: string;
    date: string;
  }) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [searchData, setSearchData] = useState({
    origin: "",
    destination: "",
    date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Origin */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>From</span>
              </Label>

              <CityInput
                placeholder="Select origin city"
                onSelect={(city: City) =>
                  setSearchData((prev) => ({
                    ...prev,
                    origin: city.place_name,
                  }))
                }
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>To</span>
              </Label>

              <CityInput
                placeholder="Select destination city"
                onSelect={(city: City) =>
                  setSearchData((prev) => ({
                    ...prev,
                    destination: city.place_name,
                  }))
                }
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={searchData.date}
                onChange={(e) =>
                  setSearchData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Search Trips
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
