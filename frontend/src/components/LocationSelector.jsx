import { useState, useEffect, useRef } from "react";
import "./LocationSelector.css";

export default function LocationSelector({ onLocationSelect, selectedLocation }) {
  // Initialize state from selectedLocation prop
  const isCityMode = selectedLocation?.type === "city";
  const initialCity = isCityMode ? selectedLocation.value : "";
  const initialCoords = selectedLocation?.type === "coordinates" 
    ? `${selectedLocation.value.latitude}, ${selectedLocation.value.longitude}` 
    : "";
  
  const [cityQuery, setCityQuery] = useState(initialCity);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  
  // Manual coordinate input state
  const [useCoordinates, setUseCoordinates] = useState(!isCityMode && selectedLocation?.type === "coordinates");
  const [coordinates, setCoordinates] = useState(initialCoords);
  const [coordinateError, setCoordinateError] = useState("");
  const [showCoordinateHelp, setShowCoordinateHelp] = useState(false);
  
  const debounceTimerRef = useRef(null);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Coordinate format regex: latitude, longitude (e.g., 12.922, 77.505)
  const coordinateRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;

  // Sync with selectedLocation prop changes
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.type === "city") {
        setCityQuery(selectedLocation.value);
        setSelectedCity(selectedLocation.value);
        setUseCoordinates(false);
        setCoordinates("");
      } else if (selectedLocation.type === "coordinates") {
        setCoordinates(`${selectedLocation.value.latitude}, ${selectedLocation.value.longitude}`);
        setUseCoordinates(true);
        setCityQuery("");
        setSelectedCity("");
      }
    }
  }, [selectedLocation]);

  // Debounced city search
  useEffect(() => {
    if (useCoordinates) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (cityQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/cities?query=${encodeURIComponent(cityQuery)}`
        );
        const data = await response.json();
        setSuggestions(data.cities || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cityQuery, useCoordinates]);

  // Handle city selection
  const handleCitySelect = (city) => {
    setCityQuery(city);
    setSelectedCity(city);
    setShowSuggestions(false);
    setUseCoordinates(false);
    setCoordinates("");
    setCoordinateError("");
    
    if (onLocationSelect) {
      onLocationSelect({ type: "city", value: city });
    }
  };

  // Handle coordinate input change
  const handleCoordinateChange = (value) => {
    setCoordinates(value);
    setCoordinateError("");
    
    if (value.trim() === "") {
      if (onLocationSelect) {
        onLocationSelect(null);
      }
      return;
    }

    // Validate format
    if (!coordinateRegex.test(value.trim())) {
      setCoordinateError("Invalid format. Use: latitude, longitude (e.g., 12.922, 77.505)");
      return;
    }

    // Parse and validate ranges
    const parts = value.split(",").map((s) => s.trim());
    if (parts.length !== 2) {
      setCoordinateError("Invalid format. Use: latitude, longitude");
      return;
    }

    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lon)) {
      setCoordinateError("Invalid numbers. Use: latitude, longitude");
      return;
    }

    if (lat < -90 || lat > 90) {
      setCoordinateError("Latitude must be between -90 and 90");
      return;
    }

    if (lon < -180 || lon > 180) {
      setCoordinateError("Longitude must be between -180 and 180");
      return;
    }

    setCoordinateError("");
    if (onLocationSelect) {
      onLocationSelect({ type: "coordinates", value: { latitude: lat, longitude: lon } });
    }
  };

  // Toggle between city and coordinate input
  const toggleInputMode = () => {
    const newMode = !useCoordinates;
    setUseCoordinates(newMode);
    
    if (newMode) {
      // Switching to coordinates
      setCityQuery("");
      setSelectedCity("");
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Switching to city
      setCoordinates("");
      setCoordinateError("");
      if (onLocationSelect) {
        onLocationSelect(null);
      }
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="location-selector">
      {/* City Search Input */}
      {!useCoordinates && (
        <div className="location-input-group">
          <label htmlFor="city-search" className="location-label">
            Search City (Type to Select)
          </label>
          <div className="city-input-wrapper">
            <input
              ref={inputRef}
              id="city-search"
              type="text"
              className="location-input"
              placeholder="Search city (Example: Hassan, Bengaluru)"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity("");
                if (onLocationSelect) {
                  onLocationSelect(null);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={useCoordinates}
            />
            {loading && (
              <span className="loading-indicator">⏳</span>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              {suggestions.map((city, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleCitySelect(city)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {city}
                </div>
              ))}
            </div>
          )}

          {showSuggestions && suggestions.length === 0 && cityQuery.length >= 2 && !loading && (
            <div className="no-results">No results found</div>
          )}

          {selectedCity && (
            <div className="selected-city">
              ✓ Selected: <strong>{selectedCity}</strong>
            </div>
          )}
        </div>
      )}

      {/* Manual Coordinate Input */}
      {useCoordinates && (
  <div className="location-input-group">
    <label htmlFor="coordinate-input" className="location-label">
      Enter Coordinates (Latitude, Longitude)
    </label>

    <div className="coordinate-input-wrapper">

      {/* INPUT */}

      <input
        id="coordinate-input"
        type="text"
        className={`location-input ${coordinateError ? "error" : ""}`}
        placeholder="12.922, 77.505"
        value={coordinates}
        onChange={(e) => handleCoordinateChange(e.target.value)}
      />

      {/* INFO BUTTON + POPUP WRAPPER */}

      <div
        className="info-wrapper"
        onMouseEnter={() => setShowCoordinateHelp(true)}
        onMouseLeave={() => setShowCoordinateHelp(false)}
      >
        <button
          type="button"
          className="info-button"
          onClick={() =>
            setShowCoordinateHelp((prev) => !prev)
          }
          aria-label="How to get coordinates"
        >
          ℹ
        </button>

        {/* POPUP */}

        {showCoordinateHelp && (
          <div className="coordinate-help">
            <h4>How to get coordinates from Google Maps:</h4>

            <ol>
              <li>
                Open{" "}
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://maps.google.com
                </a>
              </li>
              <li>Search or long-press your location.</li>
              <li>Right-click (desktop) or long-press (mobile).</li>
              <li>Click the displayed coordinates.</li>
              <li>Copy and paste them here.</li>
            </ol>

            <p className="format-example">
              <strong>Format Example:</strong> 12.922, 77.505
            </p>
          </div>
        )}

      </div>
    </div>

    {/* ERROR MESSAGE */}

    {coordinateError && (
      <div className="error-message">
        {coordinateError}
      </div>
    )}
  </div>
)}


      {/* Toggle Button */}
      <div className="toggle-mode">
        <button
          type="button"
          className="toggle-button"
          onClick={toggleInputMode}
        >
          {useCoordinates
            ? "Switch to City Search"
            : "Can't find your city? Enter coordinates manually"}
        </button>
      </div>
    </div>
  );
}

