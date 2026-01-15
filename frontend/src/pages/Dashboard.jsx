import { useState } from "react";
import { getLivePrediction, get3DayForecast, postPrediction, validateLocation } from "../services/api";
import "./Dashboard.css";
import ForecastChart from "../components/ForecastChart";
import LocationSelector from "../components/LocationSelector";

export default function Dashboard() {
  const [location, setLocation] = useState(null); // { type: "city"|"coordinates", value: string|{latitude, longitude} }
  const [activeTab, setActiveTab] = useState("live");
  const [live, setLive] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customResult, setCustomResult] = useState(null);

  // form state for custom prediction
  const [form, setForm] = useState({
    temperature: "",
    temperature_max: "",
    temperature_min: "",
    pressure: "",
    rainfall: "",
    humidity: "",
    wind_speed: "",
    rain_anomaly: "0.0",
    temp_anomaly: "0.0",
  });

  // Convert location to place string for API calls
  const getPlaceString = () => {
    if (!location) return null;
    
    if (location.type === "city") {
      return location.value;
    } else if (location.type === "coordinates") {
      // For coordinates, format as "lat,lon" for the existing API (no spaces)
      return `${location.value.latitude},${location.value.longitude}`;
    }
    return null;
  };

  const runLive = async () => {
    if (!location) {
      setError("Please select a location");
      return;
    }
    
    // Validate location first
    try {
      let validationData;
      if (location.type === "city") {
        validationData = { city: location.value };
      } else {
        validationData = {
          latitude: location.value.latitude,
          longitude: location.value.longitude
        };
      }
      
      const validation = await validateLocation(validationData);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    } catch (err) {
      setError(err.message || "Location validation failed");
      return;
    }
    
    const place = getPlaceString();
    if (!place) {
      setError("Invalid location format");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await getLivePrediction(place);
      setLive(data);
    } catch (err) {
      setError("Failed to fetch prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const runForecast = async () => {
    if (!location) {
      setError("Please select a location");
      return;
    }
    
    // Validate location first
    try {
      let validationData;
      if (location.type === "city") {
        validationData = { city: location.value };
      } else {
        validationData = {
          latitude: location.value.latitude,
          longitude: location.value.longitude
        };
      }
      
      const validation = await validateLocation(validationData);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    } catch (err) {
      setError(err.message || "Location validation failed");
      return;
    }
    
    const place = getPlaceString();
    if (!place) {
      setError("Invalid location format");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await get3DayForecast(place);
      setForecast(data.forecast);
    } catch (err) {
      setError("Failed to fetch forecast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm((s) => ({ ...s, [field]: value }));
  };

  const runCustomPrediction = async () => {
    // validate required numeric fields
    const required = [
      "temperature",
      "temperature_max",
      "temperature_min",
      "pressure",
      "rainfall",
      "humidity",
      "wind_speed",
    ];

    for (const k of required) {
      if (form[k] === "" || form[k] === null) {
        setError("Please fill all required fields for custom prediction.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setCustomResult(null);
    try {
      const payload = {
        temperature: parseFloat(form.temperature),
        temperature_max: parseFloat(form.temperature_max),
        temperature_min: parseFloat(form.temperature_min),
        pressure: parseFloat(form.pressure),
        rainfall: parseFloat(form.rainfall),
        humidity: parseFloat(form.humidity),
        wind_speed: parseFloat(form.wind_speed),
        rain_anomaly: parseFloat(form.rain_anomaly) || 0.0,
        temp_anomaly: parseFloat(form.temp_anomaly) || 0.0,
      };

      const res = await postPrediction(payload);
      setCustomResult(res);
    } catch (err) {
      // show server-provided message when possible
      setError(err.message || "Failed to run custom prediction.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#f97316";
      case "low":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Location Selector Section */}
        <div className="search-section">
          <LocationSelector
            onLocationSelect={setLocation}
            selectedLocation={location}
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "live" ? "active" : ""}`}
              onClick={() => setActiveTab("live")}
            >
              📊 Live Prediction
            </button>
            <button
              className={`tab ${activeTab === "forecast" ? "active" : ""}`}
              onClick={() => setActiveTab("forecast")}
            >
              📈 3-Day Forecast
            </button>
            <button
              className={`tab ${activeTab === "simulation" ? "active" : ""}`}
              onClick={() => setActiveTab("simulation")}
            >
              🌀 Simulation
            </button>
              <button
                className={`tab ${activeTab === "custom" ? "active" : ""}`}
                onClick={() => setActiveTab("custom")}
              >
                ✏️ Custom
              </button>
          </div>
        </div>

        {/* Live Prediction Tab */}
        {activeTab === "live" && (
          <div className="tab-content">
            <button 
              className="action-button" 
              onClick={runLive}
              disabled={loading}
            >
              {loading ? "Loading..." : "Run Live Prediction"}
            </button>

            {live && (
              <div className="results">
                <div className="location-header">
                  <h2>📍 {live.location}</h2>
                </div>

                {live.weather && (
                  <div className="weather-section">
                    <h3>Weather Conditions</h3>
                    <div className="weather-grid">
                      <div className="weather-card">
                        <span className="weather-label">Temperature</span>
                        <span className="weather-value">{live.weather.temperature}°C</span>
                      </div>
                      <div className="weather-card">
                        <span className="weather-label">Humidity</span>
                        <span className="weather-value">{live.weather.humidity}%</span>
                      </div>
                      <div className="weather-card">
                        <span className="weather-label">Rainfall</span>
                        <span className="weather-value">{live.weather.rainfall}mm</span>
                      </div>
                      <div className="weather-card">
                        <span className="weather-label">Wind Speed</span>
                        <span className="weather-value">{live.weather.wind_speed} km/h</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="prediction-section">
                  <h3>Flood Risk Analysis</h3>
                  <div className="risk-card" style={{ borderLeftColor: getRiskColor(live.risk_level) }}>
                    <div className="risk-item">
                      <span className="risk-label">Risk Level</span>
                      <span 
                        className="risk-value" 
                        style={{ color: getRiskColor(live.risk_level) }}
                      >
                        {live.risk_level}
                      </span>
                    </div>
                    <div className="risk-item">
                      <span className="risk-label">Probability</span>
                      <span className="risk-value">{live.probability}%</span>
                    </div>
                  </div>

                  <div className="recommendation-card">
                    <h4>💡 Recommendation</h4>
                    <p>{live.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === "forecast" && (
          <div className="tab-content">
            <button 
              className="action-button" 
              onClick={runForecast}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get 3-Day Forecast"}
            </button>

            {forecast.length > 0 && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <ForecastChart data={forecast} />
                </div>

                <div className="forecast-grid">
                  {forecast.map((f, idx) => (
                    <div 
                      key={idx} 
                      className="forecast-card"
                      style={{ borderTopColor: getRiskColor(f.risk) }}
                    >
                      <h4>{f.day}</h4>
                      <div className="forecast-item">
                        <span>Risk Level:</span>
                        <span 
                          className="forecast-risk" 
                          style={{ color: getRiskColor(f.risk) }}
                        >
                          {f.risk}
                        </span>
                      </div>
                      <div className="forecast-item">
                        <span>Probability:</span>
                        <span className="forecast-probability">{(Number(f.probability) * 100).toFixed(2)}%<span className="raw-value">{Number(f.probability)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === "simulation" && (
          <div className="tab-content">
            <div className="coming-soon">
              <h3>🌀 Flood Simulation Module</h3>
              <p>Coming Soon - Advanced 3D flood simulation visualization</p>
            </div>
          </div>
        )}

        {/* Custom Tab */}
        {activeTab === "custom" && (
          <div className="tab-content">
            <h3>Custom Prediction</h3>

            <div className="custom-grid">
              <div className="form-col">
                <label>Temperature (°C)</label>
                <input className="form-input" value={form.temperature} onChange={(e) => handleFormChange("temperature", e.target.value)} />

                <label>Temp Max (°C)</label>
                <input className="form-input" value={form.temperature_max} onChange={(e) => handleFormChange("temperature_max", e.target.value)} />

                <label>Temp Min (°C)</label>
                <input className="form-input" value={form.temperature_min} onChange={(e) => handleFormChange("temperature_min", e.target.value)} />

                <label>Pressure (hPa)</label>
                <input className="form-input" value={form.pressure} onChange={(e) => handleFormChange("pressure", e.target.value)} />
              </div>

              <div className="form-col">
                <label>Rainfall (mm)</label>
                <input className="form-input" value={form.rainfall} onChange={(e) => handleFormChange("rainfall", e.target.value)} />

                <label>Humidity (%)</label>
                <input className="form-input" value={form.humidity} onChange={(e) => handleFormChange("humidity", e.target.value)} />

                <label>Wind Speed (km/h)</label>
                <input className="form-input" value={form.wind_speed} onChange={(e) => handleFormChange("wind_speed", e.target.value)} />

                <label>Rain Anomaly (optional)</label>
                <input className="form-input" value={form.rain_anomaly} onChange={(e) => handleFormChange("rain_anomaly", e.target.value)} />

                <label>Temp Anomaly (optional)</label>
                <input className="form-input" value={form.temp_anomaly} onChange={(e) => handleFormChange("temp_anomaly", e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="action-button" onClick={runCustomPrediction} disabled={loading}>
                {loading ? "Running..." : "Run Custom Prediction"}
              </button>
            </div>

            {customResult && (
              <div style={{ marginTop: 20 }}>
                <div className="risk-card" style={{ borderLeftColor: getRiskColor(customResult.risk_level) }}>
                  <div className="risk-item">
                    <span className="risk-label">Risk Level</span>
                    <span className="risk-value" style={{ color: getRiskColor(customResult.risk_level) }}>{customResult.risk_level}</span>
                  </div>
                  <div className="risk-item">
                    <span className="risk-label">Probability</span>
                    <span className="risk-value">{(Number(customResult.probability) * 100).toFixed(2)}%<span className="raw-value">{Number(customResult.probability)}</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
