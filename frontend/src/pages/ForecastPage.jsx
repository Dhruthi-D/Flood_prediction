import { useState } from "react";
import { get3DayForecast, validateLocation } from "../services/api";
import ForecastChart from "../components/ForecastChart";
import { useLayoutLocationSelection } from "../layout/AppLayout";

export default function ForecastPage() {
  const { locationSelection } = useLayoutLocationSelection() || {};
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPlaceString = () => {
    if (!locationSelection) return null;
    if (locationSelection.type === "city") return locationSelection.value;
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
      const data = await get3DayForecast(place);
      setForecast(data.forecast || []);
    } catch (err) {
      setError("Failed to fetch forecast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="card">
        <div className="cardHeader">
          <p className="cardTitle">3-Day Forecast</p>
        </div>
        <div className="cardBody">
          <button
            className="action-button btn btnPrimary"
            onClick={runForecast}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get 3-Day Forecast"}
          </button>

          {error && <div className="error-message alert">{error}</div>}

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
                      <span>Risk Level: </span>
                      <span
                        className="forecast-risk"
                        style={{ color: getRiskColor(f.risk) }}
                      >
                        {f.risk}
                      </span>
                    </div>
                    <div className="forecast-item">
                      <span>Probability: </span>
                      <span className="forecast-probability">
                        {(Number(f.probability) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


