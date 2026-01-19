import { useState } from "react";
import "./MultiCityScan.css";
import FloodMap from "../components/FloodMap";
import Simulation from "./Simulation";

const API_BASE = "http://127.0.0.1:8000";

export default function MultiCityScan() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [customCities, setCustomCities] = useState([]); // Array of {city: string, latitude?: number, longitude?: number}
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordinateError, setCoordinateError] = useState("");

  const validateCoordinates = (lat, lon) => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return { valid: false, error: "Please enter valid numbers for both coordinates" };
    }
    
    if (latNum < -90 || latNum > 90) {
      return { valid: false, error: "Latitude must be between -90 and 90" };
    }
    
    if (lonNum < -180 || lonNum > 180) {
      return { valid: false, error: "Longitude must be between -180 and 180" };
    }
    
    return { valid: true, lat: latNum, lon: lonNum };
  };

  const handleAddByCoordinates = async () => {
    if (!latitude.trim() || !longitude.trim()) {
      setCoordinateError("Please enter both latitude and longitude");
      return;
    }

    const validation = validateCoordinates(latitude, longitude);
    if (!validation.valid) {
      setCoordinateError(validation.error);
      return;
    }

    const lat = validation.lat;
    const lon = validation.lon;
    
    // Check if coordinates already exist
    const coordString = `${lat},${lon}`;
    const locationName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    
    if (customCities.some(c => 
      c.latitude === lat && c.longitude === lon
    )) {
      setCoordinateError("This location is already added");
      return;
    }

    setCoordinateError("");
    setLoading(true);

    const cityData = {
      city: locationName,
      latitude: lat,
      longitude: lon
    };

    setCustomCities([...customCities, cityData]);

    // Fetch prediction using coordinates format "lat,lon"
    try {
      const response = await fetch(`${API_BASE}/multi-city/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: [coordString] })
      });
      
      if (!response.ok) throw new Error("Failed to fetch prediction");
      const data = await response.json();
      
      // Update city data with coordinates and location name
      const cityPrediction = data.cities[0];
      cityPrediction.city = locationName;
      cityPrediction.latitude = lat;
      cityPrediction.longitude = lon;
      
      // Add to cities list
      setCities(prev => [...prev, cityPrediction]);
      
      // Clear coordinate inputs
      setLatitude("");
      setLongitude("");
    } catch (err) {
      console.error("Error fetching prediction for coordinates:", err);
      setCoordinateError("Failed to fetch prediction. Please try again.");
      // Remove from customCities if prediction failed
      setCustomCities(prev => prev.filter(c => c.city !== locationName));
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (city) => {
    setSelectedCity(city);
    setShowSimulation(true);
    // Scroll to simulation section
    setTimeout(() => {
      const element = document.getElementById("simulation-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const searchCities = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cities?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setSearchResults(data.cities || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchCities(query);
  };

  const handleAddCity = async (cityName, lat = null, lon = null) => {
    // Check if city already exists
    if (customCities.some(c => c.city === cityName)) return;

    const cityData = { city: cityName };
    if (lat !== null && lat !== "" && lon !== null && lon !== "") {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        cityData.latitude = latNum;
        cityData.longitude = lonNum;
      }
    }

    setCustomCities([...customCities, cityData]);
    setSearchQuery("");
    setSearchResults([]);
    setLatitude("");
    setLongitude("");
    setCoordinateError("");

    // Fetch prediction for this city
    try {
      const response = await fetch(`${API_BASE}/multi-city/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: [cityName] })
      });
      if (!response.ok) throw new Error("Failed to fetch prediction");
      const data = await response.json();
      
      // Update city data with user-provided coordinates if available
      const cityPrediction = data.cities[0];
      if (cityData.latitude !== undefined && cityData.longitude !== undefined) {
        cityPrediction.latitude = cityData.latitude;
        cityPrediction.longitude = cityData.longitude;
      }
      
      // Add to cities list
      setCities(prev => [...prev, cityPrediction]);
    } catch (err) {
      console.error("Error fetching city prediction:", err);
    }
  };

  const handleRemoveCity = (cityName) => {
    setCustomCities(customCities.filter(c => c.city !== cityName));
    setCities(cities.filter(c => c.city !== cityName));
    setCoordinateError("");
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "#22c55e";
      case "moderate":
        return "#facc15";
      case "high":
        return "#f97316";
      case "critical":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  // Stats for dashboard
  const stats = {
    total: cities.length,
    critical: cities.filter((c) => c.risk_level?.toLowerCase() === "critical").length,
    high: cities.filter((c) => c.risk_level?.toLowerCase() === "high").length,
    moderate: cities.filter((c) => c.risk_level?.toLowerCase() === "moderate").length,
    low: cities.filter((c) => c.risk_level?.toLowerCase() === "low").length,
  };

  return (
    <div className="multi-city-scan">
      {/* Header Section */}
      <div className="scan-header">
        <h1>🌍 Multi-Place Flood Scan</h1>
        <p>Real-time flood risk assessment across multiple cities</p>
      </div>

      {/* City Search and Add */}
      <div className="city-search-section">
        <h3>➕ Add Custom Places</h3>
        <div className="search-container">
          <input
            type="text"
            className="city-search-input"
            placeholder="Search for a city to add..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchLoading && <span className="search-loading">Searching...</span>}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((city) => (
                <div
                  key={city}
                  className="search-result-item"
                  onClick={() => handleAddCity(city, latitude, longitude)}
                >
                  {city}
                  {customCities.some(c => c.city === city) && <span className="added-badge">✓ Added</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="coordinates-input-group">
          <div className="coordinate-input">
            <label htmlFor="latitude-input">Latitude:</label>
            <input
              id="latitude-input"
              type="number"
              step="any"
              className="coordinate-field"
              placeholder="e.g., 12.9716"
              value={latitude}
              onChange={(e) => {
                setLatitude(e.target.value);
                setCoordinateError("");
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddByCoordinates();
                }
              }}
            />
          </div>
          <div className="coordinate-input">
            <label htmlFor="longitude-input">Longitude:</label>
            <input
              id="longitude-input"
              type="number"
              step="any"
              className="coordinate-field"
              placeholder="e.g., 77.5946"
              value={longitude}
              onChange={(e) => {
                setLongitude(e.target.value);
                setCoordinateError("");
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddByCoordinates();
                }
              }}
            />
          </div>
          <div className="coordinate-add-button">
            <button
              className="btn btn-primary"
              onClick={handleAddByCoordinates}
              disabled={loading || !latitude.trim() || !longitude.trim()}
            >
              {loading ? "Adding..." : "➕ Add Location"}
            </button>
          </div>
        </div>
        {coordinateError && (
          <div className="coordinate-error">{coordinateError}</div>
        )}
        {customCities.length > 0 && (
          <div className="custom-cities-list">
            <h4>Selected Places ({customCities.length}):</h4>
            <div className="custom-cities-tags">
              {customCities.map((cityData) => (
                <div key={cityData.city} className="city-tag">
                  <div className="city-tag-content">
                    <span className="city-name">{cityData.city}</span>
                    {cityData.latitude !== undefined && cityData.longitude !== undefined && (
                      <span className="city-coords">
                        ({cityData.latitude.toFixed(4)}, {cityData.longitude.toFixed(4)})
                      </span>
                    )}
                  </div>
                  <button
                    className="remove-city-btn"
                    onClick={() => handleRemoveCity(cityData.city)}
                    title="Remove city"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stats Section */}
      {cities.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Places Scanned</div>
          </div>
          <div className="stat-card critical">
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Critical Risk</div>
          </div>
          <div className="stat-card high">
            <div className="stat-value">{stats.high}</div>
            <div className="stat-label">High Risk</div>
          </div>
          <div className="stat-card moderate">
            <div className="stat-value">{stats.moderate}</div>
            <div className="stat-label">Moderate Risk</div>
          </div>
          <div className="stat-card low">
            <div className="stat-value">{stats.low}</div>
            <div className="stat-label">Low Risk</div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <FloodMap cities={cities} onCityClick={handleCityClick} isLoading={loading} />

      {/* Cities List Section */}
      {cities.length > 0 && (
        <div className="cities-list-section">
          <h2>📋 City Risk Summary</h2>
          <div className="cities-grid">
            {cities.map((city) => (
              <div
                key={city.city}
                className="city-card"
                style={{ borderLeftColor: getRiskColor(city.risk_level) }}
                onClick={() => handleCityClick(city)}
              >
                <h3>{city.city}</h3>
                <div className="city-info">
                  <div className="info-row">
                    <span className="label">Risk:</span>
                    <span
                      className="value"
                      style={{ color: getRiskColor(city.risk_level) }}
                    >
                      {city.risk_level}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Probability:</span>
                    <span className="value">{Math.round(city.probability * 100)}%</span>
                  </div>
                  {city.weather && (
                    <>
                      <div className="info-row">
                        <span className="label">Temp:</span>
                        <span className="value">{city.weather.temperature}°C</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Rain:</span>
                        <span className="value">{city.weather.rainfall}mm</span>
                      </div>
                    </>
                  )}
                </div>
                <button className="view-btn">View Simulation →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Section */}
      {showSimulation && selectedCity && (
        <div id="simulation-section" className="simulation-section">
          <div className="simulation-header">
            <h2>🌀 Simulation for {selectedCity.city}</h2>
            <button className="btn btn-secondary" onClick={() => setShowSimulation(false)}>
              ✕ Close
            </button>
          </div>
          <div className="simulation-container">
            <Simulation initialCity={selectedCity} />
          </div>
        </div>
      )}
    </div>
  );
}
