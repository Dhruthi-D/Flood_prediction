import { useState, useEffect } from "react";
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
  const [cityLimit, setCityLimit] = useState(15);
  const [customCities, setCustomCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load sample cities on mount
  useEffect(() => {
    loadSampleCities();
  }, []);

  const loadSampleCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/multi-city/sample?limit=${cityLimit}`);
      if (!response.ok) {
        throw new Error(`Failed to load cities: ${response.statusText}`);
      }
      const data = await response.json();
      setCities(data.cities || []);
    } catch (err) {
      setError(err.message || "Failed to load cities");
      console.error("Error loading cities:", err);
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

  const handleRefresh = () => {
    loadSampleCities();
  };

  const handleLimitChange = (e) => {
    const newLimit = Math.max(5, Math.min(50, parseInt(e.target.value) || 15));
    setCityLimit(newLimit);
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

  const handleAddCity = async (cityName) => {
    if (customCities.includes(cityName)) return;

    setCustomCities([...customCities, cityName]);
    setSearchQuery("");
    setSearchResults([]);

    // Fetch prediction for this city
    try {
      const response = await fetch(`${API_BASE}/multi-city/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: [cityName] })
      });
      if (!response.ok) throw new Error("Failed to fetch prediction");
      const data = await response.json();
      
      // Add to cities list
      setCities(prev => [...prev, ...data.cities]);
    } catch (err) {
      console.error("Error fetching city prediction:", err);
    }
  };

  const handleRemoveCity = (cityName) => {
    setCustomCities(customCities.filter(c => c !== cityName));
    setCities(cities.filter(c => c.city !== cityName));
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
        <h1>🌍 Multi-City Flood Scan</h1>
        <p>Real-time flood risk assessment across multiple cities</p>
      </div>

      {/* Controls Section */}
      <div className="scan-controls">
        <div className="control-group">
          <label htmlFor="city-limit">Default Cities:</label>
          <input
            id="city-limit"
            type="number"
            min="5"
            max="50"
            value={cityLimit}
            onChange={handleLimitChange}
            disabled={loading}
          />
        </div>
        <button className="btn btn-primary" onClick={handleRefresh} disabled={loading}>
          {loading ? "Loading..." : "🔄 Refresh Scan"}
        </button>
      </div>

      {/* City Search and Add */}
      <div className="city-search-section">
        <h3>➕ Add Custom Cities</h3>
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
                  onClick={() => handleAddCity(city)}
                >
                  {city}
                  {customCities.includes(city) && <span className="added-badge">✓ Added</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {customCities.length > 0 && (
          <div className="custom-cities-list">
            <h4>Custom Cities ({customCities.length}):</h4>
            <div className="custom-cities-tags">
              {customCities.map((city) => (
                <div key={city} className="city-tag">
                  {city}
                  <button
                    className="remove-city-btn"
                    onClick={() => handleRemoveCity(city)}
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
            <div className="stat-label">Cities Scanned</div>
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
