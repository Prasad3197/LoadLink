import React, { useState, useMemo, useRef, useCallback } from "react";
import { CITIES, City } from "../../lib/cities";

interface CityComboboxProps {
  onCitySelect: (city: City | null) => void;
}

const CityCombobox: React.FC<CityComboboxProps> = ({ onCitySelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // 1. Filtering Logic
  const filteredCities = useMemo(() => {
    if (searchTerm.trim() === "") {
      return CITIES;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return CITIES.filter((city) =>
      city.name.toLowerCase().includes(lowerCaseSearch)
    ).slice(0, 10); // Limit results for performance
  }, [searchTerm]);

  // 2. Selection Handler
  const handleSelect = useCallback(
    (city: City) => {
      setSearchTerm(city.name);
      setSelectedCity(city);
      setIsOpen(false);
      onCitySelect(city);
    },
    [onCitySelect]
  );

  // 3. Input Change Handler
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    // Clear selection if the user starts typing again
    if (selectedCity && selectedCity.name !== value) {
      setSelectedCity(null);
      onCitySelect(null);
    }
  };

  // 4. Handle input focus/blur to control dropdown visibility
  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // A small delay to allow clicking on a result before the list disappears
    setTimeout(() => {
      // If no city was selected and the input is empty, clear the search term
      if (!selectedCity && searchTerm.trim() !== "") {
        // Optional: Revert input to the name of the last selected city if there was one
        // setSearchTerm(selectedCity?.name || '');
      }
      setIsOpen(false);
    }, 100);
  };

  return (
    <div className="relative w-full" ref={comboboxRef}>
      
      <input
        id="city-input"
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Type a city name..."
        autoComplete="off"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
      />

      {/* Dropdown/Results List */}
      {isOpen && searchTerm.trim() !== "" && filteredCities.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city) => (
            <li
              key={city.id}
              // Prevent the input's onBlur from firing when clicking a list item
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(city)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out text-gray-800"
            >
              {city.name}{" "}
              <span className="text-xs text-gray-500">({city.country})</span>
            </li>
          ))}
        </ul>
      )}

      {/* No Results Message */}
      {isOpen && searchTerm.trim() !== "" && filteredCities.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-500">
          No cities found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CityCombobox;
