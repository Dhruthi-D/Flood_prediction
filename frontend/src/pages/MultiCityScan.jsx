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
          <label htmlFor="city-limit">Number of Cities:</label>
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
