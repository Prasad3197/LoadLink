"use client";
import { useState, useCallback } from "react";
import Head from "next/head";
import CityCombobox from "../../../components/shipper/CityCombobox";
import { City } from "../../../lib/cities";

const CitySelectionPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCitySelect = useCallback((city: City | null) => {
    setSelectedCity(city);
    console.log("Selected City Data:", city);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity) {
      alert(
        `Form Submitted! City ID: ${selectedCity.id}, Name: ${selectedCity.name}`
      );
    } else {
      alert("Please select a valid city before submitting.");
    }
  };

  return (
  
          <CityCombobox onCitySelect={handleCitySelect} />

        
  );
};

export default CitySelectionPage;
