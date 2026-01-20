import { useState } from "react";
import { getLivePrediction, validateLocation, explainPrediction } from "../services/api";
import ForecastChart from "../components/ForecastChart";
import { useLayoutLocationSelection } from "../layout/AppLayout";

export default function LivePredictionPage() {
  const { locationSelection } = useLayoutLocationSelection() || {};
  const [live, setLive] = useState(null);
  const [liveShapExplanation, setLiveShapExplanation] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shapLoading, setShapLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPlaceString = () => {
    if (!locationSelection) return null;
    if (locationSelection.type === "city") {
      return locationSelection.value;
    }
    if (locationSelection.type === "coordinates") {
      return `${locationSelection.value.latitude},${locationSelection.value.longitude}`;
    }
    return null;
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

  const runLive = async () => {
    if (!locationSelection) {
      setError("Please select a location");
      return;
    }

    try {
      let validationData;
      if (locationSelection.type === "city") {
        validationData = { city: locationSelection.value };
      } else {
        validationData = {
          latitude: locationSelection.value.latitude,
          longitude: locationSelection.value.longitude,
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
    if (!locationSelection) {
      setError("Please select a location");
      return;
    }

    try {
      let validationData;
      if (locationSelection.type === "city") {
        validationData = { city: locationSelection.value };
      } else {
        validationData = {
          latitude: locationSelection.value.latitude,
          longitude: locationSelection.value.longitude,
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
      if (data.forecast) {
        setForecast(data.forecast);
      }
    } catch (err) {
      setError("Failed to fetch forecast. Please try again.");
    } finally {
      setLoading(false);
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
    return {
      all: contributions,
      top: contributions.slice(0, 3),
    };
  };

  return (
    <div className="dashboard-page">
      <div className="card">
        <div className="cardHeader">
          <p className="cardTitle">Live Prediction</p>
        </div>
        <div className="cardBody">
          <button
            className="action-button btn btnPrimary"
            onClick={runLive}
            disabled={loading}
          >
            {loading ? "Loading..." : "Run Live Prediction"}
          </button>

          {error && <div className="error-message alert">{error}</div>}

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
                      <span className="weather-value">
                        {live.weather.temperature}°C
                      </span>
                    </div>
                    <div className="weather-card">
                      <span className="weather-label">Humidity</span>
                      <span className="weather-value">
                        {live.weather.humidity}%
                      </span>
                    </div>
                    <div className="weather-card">
                      <span className="weather-label">Rainfall</span>
                      <span className="weather-value">
                        {live.weather.rainfall}mm
                      </span>
                    </div>
                    <div className="weather-card">
                      <span className="weather-label">Wind Speed</span>
                      <span className="weather-value">
                        {live.weather.wind_speed} km/h
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="prediction-section">
                <h3>Flood Risk Analysis</h3>
                <div
                  className="risk-card"
                  style={{ borderLeftColor: getRiskColor(live.risk_level) }}
                >
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
                  className="action-button btn btnPrimary"
                  onClick={explainLivePrediction}
                  disabled={shapLoading}
                  style={{
                    marginTop: "16px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {shapLoading
                    ? "Generating Explanation..."
                    : "🔍 Explain This Prediction"}
                </button>

                {liveShapExplanation && (
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "20px",
                      background: "#f8f9ff",
                      borderRadius: "12px",
                      border: "2px solid #667eea",
                    }}
                  >
                    <h3
                      style={{
                        color: "#1e3a8a",
                        marginBottom: "16px",
                      }}
                    >
                      SHAP Feature Impact Analysis
                    </h3>
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <strong
                          style={{
                            fontSize: "16px",
                            color: "#1e40af",
                          }}
                        >
                          Prediction:
                        </strong>
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color:
                              liveShapExplanation.prediction > 0.5
                                ? "#dc2626"
                                : "#16a34a",
                            marginLeft: "8px",
                          }}
                        >
                          {(liveShapExplanation.prediction * 100).toFixed(2)}%
                          flood risk
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        Base model probability:{" "}
                        {(liveShapExplanation.base_value * 100).toFixed(2)}%
                      </div>
                    </div>

                    <h4
                      style={{
                        marginBottom: "14px",
                        color: "#1e3a8a",
                      }}
                    >
                      All Feature Contributions
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {getShapSummary(liveShapExplanation).all.map(
                        (contrib, idx, all) => {
                          const isPositive = contrib.shap_value >= 0;
                          const maxAbs = Math.max(
                            ...all.map((c) => c.abs_shap || 0)
                          );
                          const barWidth = maxAbs
                            ? (contrib.abs_shap / maxAbs) * 100
                            : 0;
                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px",
                                background: "#fff",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  minWidth: "100px",
                                  fontWeight: "600",
                                  fontSize: "14px",
                                  color: "#1f2937",
                                }}
                              >
                                {contrib.feature}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  height: "24px",
                                  background: "#e5e7eb",
                                  borderRadius: "4px",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${barWidth}%`,
                                    background: isPositive
                                      ? "linear-gradient(90deg, #3b82f6, #1d4ed8)"
                                      : "linear-gradient(90deg, #ef4444, #b91c1c)",
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  minWidth: "120px",
                                  textAlign: "right",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                }}
                              >
                                <span
                                  style={{
                                    color: isPositive ? "#3b82f6" : "#ef4444",
                                  }}
                                >
                                  {contrib.shap_value.toFixed(4)}
                                </span>
                                <span
                                  style={{
                                    color: "#666",
                                    marginLeft: "8px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {isPositive ? "↑ increases" : "↓ decreases"}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="cardHeader">
            <p className="cardTitle">3-Day Forecast</p>
          </div>
          <div className="cardBody">
            <div style={{ marginBottom: 20 }}>
              <ForecastChart data={forecast} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


