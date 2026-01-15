import { useEffect, useState } from "react";
import "./Explainability.css";

export default function Explainability() {
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [instanceContrib, setInstanceContrib] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [activeTab, setActiveTab] = useState("global");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/explainability")
      .then((r) => r.json())
      .then((j) => setGlobalFeatures(j.features || []))
      .catch((e) => console.error(e));
  }, []);

  const handleForm = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const runInstanceExplain = async () => {
    setLoading(true);
    setError(null);
    setInstanceContrib(null);
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

      const res = await fetch("http://127.0.0.1:8000/explainability/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Explain failed");
      setInstanceContrib(json);
    } catch (e) {
      setError(e.message || "Explain failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="explainability-container">
      <div className="feature-coming-soon">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Explainability</h2>
          <div className="explain-tabs">
            <button
              className={"tab-btn " + (activeTab === "global" ? "active" : "")}
              onClick={() => setActiveTab("global")}
            >
              Global
            </button>
            <button
              className={"tab-btn " + (activeTab === "instance" ? "active" : "")}
              onClick={() => setActiveTab("instance")}
            >
              Instance
            </button>
          </div>
        </div>

        {activeTab === "global" && (
          <div style={{ marginTop: 8 }}>
            <h3>Global Feature Importances</h3>
            <div style={{ marginTop: 12 }}>
              {globalFeatures.length === 0 && <p>No data</p>}
              {globalFeatures.map((f) => (
                <div key={f.feature} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <div style={{ color: "#1f2937" }}>{f.feature}</div>
                  <div style={{ color: "#334155", fontWeight: 700 }}>{(f.importance * 100).toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "instance" && (
          <div style={{ marginTop: 8 }}>
            <h3>Instance Explainability</h3>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Temperature" value={form.temperature} onChange={(e) => handleForm("temperature", e.target.value)} />
                <input placeholder="Temp Max" value={form.temperature_max} onChange={(e) => handleForm("temperature_max", e.target.value)} />
                <input placeholder="Temp Min" value={form.temperature_min} onChange={(e) => handleForm("temperature_min", e.target.value)} />
                <input placeholder="Pressure" value={form.pressure} onChange={(e) => handleForm("pressure", e.target.value)} />
                <input placeholder="Rainfall" value={form.rainfall} onChange={(e) => handleForm("rainfall", e.target.value)} />
                <input placeholder="Humidity" value={form.humidity} onChange={(e) => handleForm("humidity", e.target.value)} />
                <input placeholder="Wind Speed" value={form.wind_speed} onChange={(e) => handleForm("wind_speed", e.target.value)} />
                <input placeholder="Rain Anomaly" value={form.rain_anomaly} onChange={(e) => handleForm("rain_anomaly", e.target.value)} />
                <input placeholder="Temp Anomaly" value={form.temp_anomaly} onChange={(e) => handleForm("temp_anomaly", e.target.value)} />
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="action-button" onClick={runInstanceExplain} disabled={loading}>
                  {loading ? "Running..." : "Explain Instance"}
                </button>
              </div>

              {error && <div style={{ marginTop: 8, color: "#ffb4b4" }}>{error}</div>}

              {instanceContrib && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: "#1f2937", marginBottom: 8 }}>Predicted probability: {(Number(instanceContrib.probability) * 100).toFixed(4)}%</div>
                  <div>
                    {instanceContrib.contributions.map((c) => (
                      <div key={c.feature} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                        <div style={{ color: "#1f2937" }}>{c.feature} ({c.value})</div>
                        <div style={{ color: c.contribution >= 0 ? "#2563eb" : "#ef4444", fontWeight: 700 }}>{c.contribution.toFixed(6)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
