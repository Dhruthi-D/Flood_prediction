import { useEffect, useState } from "react";
import { explainPrediction } from "../services/api.js";
import "./Explainability.css";

export default function Explainability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanation, setExplanation] = useState(null);
  
  const [form, setForm] = useState({
    temperature: "25",
    temperature_max: "30",
    temperature_min: "20",
    pressure: "1013",
    rainfall: "0",
    humidity: "65",
    wind_speed: "5",
    rain_anomaly: "0.0",
    temp_anomaly: "0.0",
  });

  const handleForm = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const runExplanation = async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
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
      setExplanation(result);
    } catch (e) {
      setError(e.message || "Explanation failed");
    } finally {
      setLoading(false);
    }
  };

  // Calculate feature contributions and summary
  const getFeatureSummary = () => {
    if (!explanation) return null;

    const features = explanation.feature_names || [];
    const shap_values = explanation.shap_values || [];
    
    // Create array of {feature, shap_value, abs_shap}
    const contributions = features.map((name, idx) => ({
      feature: name,
      shap_value: shap_values[idx] || 0,
      abs_shap: Math.abs(shap_values[idx] || 0),
    }));

    // Sort by absolute SHAP value (importance)
    contributions.sort((a, b) => b.abs_shap - a.abs_shap);

    // Get top 3 contributors
    const topContributors = contributions.slice(0, 3);

    return {
      all: contributions,
      top: topContributors,
    };
  };

  const summary = getFeatureSummary();

  // Find max absolute value for scaling bar width
  const maxAbsValue = summary
    ? Math.max(...summary.all.map((c) => c.abs_shap))
    : 1;

  return (
    <div className="explainability-container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "30px", borderRadius: "12px", marginBottom: "30px", color: "white" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>🔍 SHAP Explainability Analysis</h1>
        <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
          Understand exactly which weather features drive flood predictions
        </p>
      </div>

      {/* Input Form */}
      <div className="explanation-section" style={{ background: "#f8f9ff", padding: "24px", borderRadius: "12px", border: "2px solid #e0e7ff", marginBottom: "30px" }}>
        <h3 style={{ color: "#1e3a8a", marginTop: 0 }}>📋 Weather Input Parameters</h3>
        <div className="input-grid">
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Temperature (°C)</label>
            <input
              type="number"
              value={form.temperature}
              onChange={(e) => handleForm("temperature", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Max Temp (°C)</label>
            <input
              type="number"
              value={form.temperature_max}
              onChange={(e) => handleForm("temperature_max", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Min Temp (°C)</label>
            <input
              type="number"
              value={form.temperature_min}
              onChange={(e) => handleForm("temperature_min", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Pressure (hPa)</label>
            <input
              type="number"
              value={form.pressure}
              onChange={(e) => handleForm("pressure", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Rainfall (mm)</label>
            <input
              type="number"
              value={form.rainfall}
              onChange={(e) => handleForm("rainfall", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Humidity (%)</label>
            <input
              type="number"
              value={form.humidity}
              onChange={(e) => handleForm("humidity", e.target.value)}
              step="0.1"
              min="0"
              max="100"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Wind Speed (m/s)</label>
            <input
              type="number"
              value={form.wind_speed}
              onChange={(e) => handleForm("wind_speed", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Rain Anomaly</label>
            <input
              type="number"
              value={form.rain_anomaly}
              onChange={(e) => handleForm("rain_anomaly", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontWeight: "600", color: "#374151" }}>Temp Anomaly</label>
            <input
              type="number"
              value={form.temp_anomaly}
              onChange={(e) => handleForm("temp_anomaly", e.target.value)}
              step="0.1"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
        </div>

        <button
          className="action-button"
          onClick={runExplanation}
          disabled={loading}
          style={{ marginTop: "24px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "12px 32px", fontSize: "16px", fontWeight: "600" }}
        >
          {loading ? "⏳ Generating Explanation..." : "🚀 Generate SHAP Explanation"}
        </button>

        {error && (
          <div style={{ marginTop: "16px", color: "#991b1b", padding: "12px 16px", background: "#fee2e2", borderRadius: "8px", border: "1px solid #fecaca", fontWeight: "500" }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* SHAP Results */}
      {explanation && (
        <div style={{ background: "#f0f9ff", padding: "24px", borderRadius: "12px", border: "2px solid #0284c7" }}>
          <h2 style={{ color: "#0c4a6e", marginTop: 0 }}>📊 SHAP Analysis Results</h2>
          
          <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", padding: "24px", borderRadius: "10px", marginBottom: "24px", border: "2px solid #7dd3fc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
              <span style={{ fontSize: "18px", color: "#1e40af", fontWeight: "600" }}>Flood Risk Probability:</span>
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: explanation.prediction > 0.5 ? "#dc2626" : "#16a34a",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                {(explanation.prediction * 100).toFixed(2)}%
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "#475569", background: "#e0f2fe", padding: "8px 12px", borderRadius: "6px", display: "inline-block" }}>
              📌 Base model probability: {(explanation.base_value * 100).toFixed(2)}%
            </div>
          </div>

          {/* Feature Contributions Bar Chart */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ color: "#0c4a6e", marginBottom: "16px" }}>🎯 All Feature Contributions (SHAP Values)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {summary.all.map((contrib, idx) => {
                const isPositive = contrib.shap_value >= 0;
                const width = (contrib.abs_shap / maxAbsValue) * 100;
                return (
                  <div key={idx} style={{ 
                    background: "#fff", 
                    padding: "14px", 
                    borderRadius: "8px", 
                    border: "1px solid #cbd5e1",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div style={{ minWidth: "140px", fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>
                        {contrib.feature}
                      </div>
                      <div style={{ flex: 1, height: "32px", background: "#e5e7eb", borderRadius: "6px", position: "relative", overflow: "hidden", border: "1px solid #d1d5db" }}>
                        <div style={{ 
                          height: "100%",
                          width: `${width}%`,
                          background: isPositive ? "linear-gradient(90deg, #3b82f6, #1d4ed8)" : "linear-gradient(90deg, #ef4444, #b91c1c)",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <div style={{ minWidth: "160px", textAlign: "right" }}>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: isPositive ? "#1d4ed8" : "#b91c1c" }}>
                          {contrib.shap_value.toFixed(4)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>
                          {isPositive ? "📈 increases risk" : "📉 decreases risk"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Statistics */}
          {summary.top.length > 0 && (
            <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "2px solid #7dd3fc" }}>
              <h3 style={{ color: "#0c4a6e", marginTop: 0 }}>⭐ Key Risk Drivers (Top 3)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {summary.top.map((contrib, idx) => (
                  <div key={idx} style={{ 
                    background: "#f8f9ff", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    borderLeft: `4px solid ${contrib.shap_value > 0 ? "#3b82f6" : "#ef4444"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>
                        {contrib.feature}
                      </div>
                      <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                        {contrib.shap_value > 0 ? "📈 Increases flood risk" : "📉 Decreases flood risk"}
                      </div>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: contrib.shap_value > 0 ? "#1d4ed8" : "#b91c1c" }}>
                      {contrib.shap_value.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
