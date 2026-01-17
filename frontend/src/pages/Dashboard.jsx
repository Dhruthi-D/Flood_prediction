import { useState } from "react";
import { getLivePrediction, get3DayForecast, postPrediction, validateLocation, explainPrediction } from "../services/api";
import "./Dashboard.css";
import ForecastChart from "../components/ForecastChart";
import LocationSelector from "../components/LocationSelector";
import Simulation from "./Simulation";
import MultiCityScan from "./MultiCityScan";
import Explainability from "./Explainability";
import ChatAssistant from "./ChatAssistant";

export default function Dashboard() {
  const [location, setLocation] = useState(null); // { type: "city"|"coordinates", value: string|{latitude, longitude} }
  const [activeTab, setActiveTab] = useState("live");
  const [live, setLive] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customResult, setCustomResult] = useState(null);
  const [liveShapExplanation, setLiveShapExplanation] = useState(null);
  const [customShapExplanation, setCustomShapExplanation] = useState(null);
  const [shapLoading, setShapLoading] = useState(false);

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
      // Extract SHAP explanation from response if available
      if (data.shap_explanation) {
        setLiveShapExplanation(data.shap_explanation);
      }
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

      localStorage.setItem("latestSimulationInput", JSON.stringify(payload));

      const res = await postPrediction(payload);
      setCustomResult(res);
      // Extract SHAP explanation from response if available
      if (res.shap_explanation) {
        setCustomShapExplanation(res.shap_explanation);
      }
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

  const explainLivePrediction = async () => {
    if (!live || !live.weather) {
      setError("No live prediction data to explain");
      return;
    }

    setShapLoading(true);
    setLiveShapExplanation(null);
    setError(null);
    
    try {
      // Use actual values from live weather data (model already calculated these)
      const payload = {
        temperature: live.weather.temperature,
        temperature_max: live.weather.temperature_max,
        temperature_min: live.weather.temperature_min,
        pressure: live.weather.pressure,
        rainfall: live.weather.rainfall,
        humidity: live.weather.humidity,
        wind_speed: live.weather.wind_speed,
        rain_anomaly: 0.0,
        temp_anomaly: 0.0,
      };

      const result = await explainPrediction(payload);
      setLiveShapExplanation(result);
    } catch (err) {
      setError(err.message || "Failed to generate explanation");
    } finally {
      setShapLoading(false);
    }
  };

  const explainCustomPrediction = async () => {
    if (!customResult) {
      setError("No custom prediction to explain");
      return;
    }

    setShapLoading(true);
    setCustomShapExplanation(null);
    setError(null);
    
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

      const result = await explainPrediction(payload);
      setCustomShapExplanation(result);
    } catch (err) {
      setError(err.message || "Failed to generate explanation");
    } finally {
      setShapLoading(false);
    }
  };

  const getShapSummary = (explanation) => {
    if (!explanation) return null;

    const features = explanation.feature_names || [];
    const shap_values = explanation.shap_values || [];
    
    const contributions = features.map((name, idx) => ({
      feature: name,
      shap_value: shap_values[idx] || 0,
      abs_shap: Math.abs(shap_values[idx] || 0),
    }));

    contributions.sort((a, b) => b.abs_shap - a.abs_shap);
    const topContributors = contributions.slice(0, 3);

    return {
      all: contributions,
      top: topContributors,
    };
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
              className={`tab ${activeTab === "multi-city" ? "active" : ""}`}
              onClick={() => setActiveTab("multi-city")}
            >
              🌍 Multi-City Scan
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
              <button
                className={`tab ${activeTab === "explainability" ? "active" : ""}`}
                onClick={() => setActiveTab("explainability")}
              >
                🔍 Explainability
              </button>
              <button
                className={`tab ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                💬 Chat Assistant
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

                  <button 
                    className="action-button" 
                    onClick={explainLivePrediction}
                    disabled={shapLoading}
                    style={{ marginTop: "16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                  >
                    {shapLoading ? "Generating Explanation..." : "🔍 Explain This Prediction"}
                  </button>

                  {liveShapExplanation && (
                    <div style={{ marginTop: "24px", padding: "20px", background: "#f8f9ff", borderRadius: "12px", border: "2px solid #667eea" }}>
                      <h3 style={{ color: "#1e3a8a", marginBottom: "16px" }}>SHAP Feature Impact Analysis</h3>
                      <div style={{ 
                        background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", 
                        padding: "16px", 
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "1px solid #bfdbfe"
                      }}>
                        <div style={{ marginBottom: "8px" }}>
                          <strong style={{ fontSize: "16px", color: "#1e40af" }}>Prediction:</strong> 
                          <span style={{ fontSize: "20px", fontWeight: "bold", color: liveShapExplanation.prediction > 0.5 ? "#dc2626" : "#16a34a", marginLeft: "8px" }}>
                            {(liveShapExplanation.prediction * 100).toFixed(2)}% flood risk
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                          Base model probability: {(liveShapExplanation.base_value * 100).toFixed(2)}%
                        </div>
                      </div>
                      
                      <h4 style={{ marginBottom: "14px", color: "#1e3a8a" }}>All Feature Contributions</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {getShapSummary(liveShapExplanation).all.map((contrib, idx) => {
                          const isPositive = contrib.shap_value >= 0;
                          const barWidth = (contrib.abs_shap / Math.max(...getShapSummary(liveShapExplanation).all.map(c => c.abs_shap))) * 100;
                          return (
                            <div key={idx} style={{ 
                              display: "flex", 
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px",
                              background: "#fff",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb"
                            }}>
                              <div style={{ minWidth: "100px", fontWeight: "600", fontSize: "14px", color: "#1f2937" }}>
                                {contrib.feature}
                              </div>
                              <div style={{ flex: 1, height: "24px", background: "#e5e7eb", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
                                <div style={{ 
                                  height: "100%",
                                  width: `${barWidth}%`,
                                  background: isPositive ? "linear-gradient(90deg, #3b82f6, #1d4ed8)" : "linear-gradient(90deg, #ef4444, #b91c1c)",
                                  transition: "width 0.3s ease"
                                }} />
                              </div>
                              <div style={{ minWidth: "120px", textAlign: "right", fontSize: "13px", fontWeight: "700" }}>
                                <span style={{ color: isPositive ? "#3b82f6" : "#ef4444" }}>
                                  {contrib.shap_value.toFixed(4)}
                                </span>
                                <span style={{ color: "#666", marginLeft: "8px", fontWeight: "500" }}>
                                  {isPositive ? "↑ increases" : "↓ decreases"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

        {/* Multi-City Scan Tab */}
        {activeTab === "multi-city" && (
          <div className="tab-content">
            <MultiCityScan />
          </div>
        )}

        {/* Simulation Tab */}
        {activeTab === "simulation" && (
          <div className="tab-content">
            <Simulation />
          </div>
        )}

        {/* Explainability Tab */}
        {activeTab === "explainability" && (
          <div className="tab-content">
            <Explainability />
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

                <button 
                  className="action-button" 
                  onClick={explainCustomPrediction}
                  disabled={shapLoading}
                  style={{ marginTop: "16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                >
                  {shapLoading ? "Generating Explanation..." : "🔍 Explain This Prediction"}
                </button>

                {customShapExplanation && (
                  <div style={{ marginTop: "24px", padding: "20px", background: "#f8f9ff", borderRadius: "12px", border: "2px solid #667eea" }}>
                    <h3 style={{ color: "#1e3a8a", marginBottom: "16px" }}>SHAP Feature Impact Analysis</h3>
                    <div style={{ 
                      background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", 
                      padding: "16px", 
                      borderRadius: "8px",
                      marginBottom: "20px",
                      border: "1px solid #bfdbfe"
                    }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ fontSize: "16px", color: "#1e40af" }}>Prediction:</strong> 
                        <span style={{ fontSize: "20px", fontWeight: "bold", color: customShapExplanation.prediction > 0.5 ? "#dc2626" : "#16a34a", marginLeft: "8px" }}>
                          {(customShapExplanation.prediction * 100).toFixed(2)}% flood risk
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                        Base model probability: {(customShapExplanation.base_value * 100).toFixed(2)}%
                      </div>
                    </div>
                    
                    <h4 style={{ marginBottom: "14px", color: "#1e3a8a" }}>All Feature Contributions</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {getShapSummary(customShapExplanation).all.map((contrib, idx) => {
                        const isPositive = contrib.shap_value >= 0;
                        const barWidth = (contrib.abs_shap / Math.max(...getShapSummary(customShapExplanation).all.map(c => c.abs_shap))) * 100;
                        return (
                          <div key={idx} style={{ 
                            display: "flex", 
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            background: "#fff",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb"
                          }}>
                            <div style={{ minWidth: "100px", fontWeight: "600", fontSize: "14px", color: "#1f2937" }}>
                              {contrib.feature}
                            </div>
                            <div style={{ flex: 1, height: "24px", background: "#e5e7eb", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
                              <div style={{ 
                                height: "100%",
                                width: `${barWidth}%`,
                                background: isPositive ? "linear-gradient(90deg, #3b82f6, #1d4ed8)" : "linear-gradient(90deg, #ef4444, #b91c1c)",
                                transition: "width 0.3s ease"
                              }} />
                            </div>
                            <div style={{ minWidth: "120px", textAlign: "right", fontSize: "13px", fontWeight: "700" }}>
                              <span style={{ color: isPositive ? "#3b82f6" : "#ef4444" }}>
                                {contrib.shap_value.toFixed(4)}
                              </span>
                              <span style={{ color: "#666", marginLeft: "8px", fontWeight: "500" }}>
                                {isPositive ? "↑ increases" : "↓ decreases"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Assistant Tab */}
        {activeTab === "chat" && (
          <div className="tab-content" style={{ height: "calc(100vh - 250px)" }}>
            <ChatAssistant 
              prediction={live}
              shapExplanation={liveShapExplanation}
              simulation={null}
              location={location ? getPlaceString() : null}
            />
          </div>
        )}
      </div>
    </div>
  );
}
