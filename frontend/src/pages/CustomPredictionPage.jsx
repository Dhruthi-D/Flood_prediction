import { useState } from "react";
import { postPrediction, explainPrediction } from "../services/api";

export default function CustomPredictionPage() {
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
  const [customResult, setCustomResult] = useState(null);
  const [customShapExplanation, setCustomShapExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shapLoading, setShapLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFormChange = (field, value) => {
    setForm((s) => ({ ...s, [field]: value }));
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

  const runCustomPrediction = async () => {
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
      if (res.shap_explanation) {
        setCustomShapExplanation(res.shap_explanation);
      }
    } catch (err) {
      setError(err.message || "Failed to run custom prediction.");
    } finally {
      setLoading(false);
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
    return {
      all: contributions,
      top: contributions.slice(0, 3),
    };
  };

  return (
    <div className="dashboard-page">
      <div className="card">
        <div className="cardHeader">
          <p className="cardTitle">Custom Prediction</p>
        </div>
        <div className="cardBody">
          <div className="custom-grid">
            <div className="form-col">
              <label>Temperature (°C)</label>
              <input
                className="form-input input"
                value={form.temperature}
                onChange={(e) =>
                  handleFormChange("temperature", e.target.value)
                }
              />

              <label>Temp Max (°C)</label>
              <input
                className="form-input input"
                value={form.temperature_max}
                onChange={(e) =>
                  handleFormChange("temperature_max", e.target.value)
                }
              />

              <label>Temp Min (°C)</label>
              <input
                className="form-input input"
                value={form.temperature_min}
                onChange={(e) =>
                  handleFormChange("temperature_min", e.target.value)
                }
              />

              <label>Pressure (hPa)</label>
              <input
                className="form-input input"
                value={form.pressure}
                onChange={(e) => handleFormChange("pressure", e.target.value)}
              />
            </div>

            <div className="form-col">
              <label>Rainfall (mm)</label>
              <input
                className="form-input input"
                value={form.rainfall}
                onChange={(e) => handleFormChange("rainfall", e.target.value)}
              />

              <label>Humidity (%)</label>
              <input
                className="form-input input"
                value={form.humidity}
                onChange={(e) => handleFormChange("humidity", e.target.value)}
              />

              <label>Wind Speed (km/h)</label>
              <input
                className="form-input input"
                value={form.wind_speed}
                onChange={(e) =>
                  handleFormChange("wind_speed", e.target.value)
                }
              />

              <label>Rain Anomaly (optional)</label>
              <input
                className="form-input input"
                value={form.rain_anomaly}
                onChange={(e) =>
                  handleFormChange("rain_anomaly", e.target.value)
                }
              />

              <label>Temp Anomaly (optional)</label>
              <input
                className="form-input input"
                value={form.temp_anomaly}
                onChange={(e) =>
                  handleFormChange("temp_anomaly", e.target.value)
                }
              />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              className="action-button btn btnPrimary"
              onClick={runCustomPrediction}
              disabled={loading}
            >
              {loading ? "Running..." : "Run Custom Prediction"}
            </button>
          </div>

          {error && <div className="error-message alert">{error}</div>}

          {customResult && (
            <div style={{ marginTop: 20 }}>
              <div
                className="risk-card"
                style={{
                  borderLeftColor: getRiskColor(customResult.risk_level),
                }}
              >
                <div className="risk-item">
                  <span className="risk-label">Risk Level</span>
                  <span
                    className="risk-value"
                    style={{
                      color: getRiskColor(customResult.risk_level),
                    }}
                  >
                    {customResult.risk_level}
                  </span>
                </div>
                <div className="risk-item">
                  <span className="risk-label">Probability</span>
                  <span className="risk-value">
                    {(Number(customResult.probability) * 100).toFixed(2)}%
                    <span className="raw-value">
                      {Number(customResult.probability)}
                    </span>
                  </span>
                </div>
              </div>

              <button
                className="action-button btn btnPrimary"
                onClick={explainCustomPrediction}
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

              {customShapExplanation && (
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
                            customShapExplanation.prediction > 0.5
                              ? "#dc2626"
                              : "#16a34a",
                          marginLeft: "8px",
                        }}
                      >
                        {(customShapExplanation.prediction * 100).toFixed(2)}%
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
                      {(customShapExplanation.base_value * 100).toFixed(2)}%
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
                    {getShapSummary(customShapExplanation).all.map(
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
          )}
        </div>
      </div>
    </div>
  );
}


