"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import CityCombobox from "../shipper/CityCombobox";
import { City } from "@/lib/cities";

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

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
    const handleCitySelect = useCallback((city: City | null) => {
      setSelectedCity(city);
      console.log("Selected City Data:", city);
    }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Origin Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="origin" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>From</span>
              </Label>
              <CityCombobox onCitySelect={handleCitySelect} />
            </div>

            {/* Destination Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="destination"
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>To</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setSearchData({ ...searchData, destination: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={searchData.date}
                onChange={(e) =>
                  setSearchData({ ...searchData, date: e.target.value })
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
