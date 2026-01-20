import { useState } from "react";
import BoxSelectMap from "../components/AreaHeatmap/BoxSelectMap";
import AreaHeatmapMap from "../components/AreaHeatmap/AreaHeatmapMap";
import "../components/AreaHeatmap/AreaHeatmap.css";

export default function AreaHeatmap() {
  const [box, setBox] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchHeatmap = async (bounds) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(bounds).toString();
      const res = await fetch(
        `http://127.0.0.1:8000/area/heatmap/box?${params}`
      );
      
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      
      const data = await res.json();
      
      if (data.points && Array.isArray(data.points)) {
        setHeatmapData(data.points);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Heatmap fetch failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBoxSelected = (bounds) => {
    setBox(bounds);
    fetchHeatmap(bounds);
  };

  const handleSelectToggle = () => {
    if (selectMode) {
      setSelectMode(false);
    } else {
      setHeatmapData([]);
      setBox(null);
      setSelectMode(true);
    }
  };

  const handleSelectComplete = () => {
    setSelectMode(false);
    setToast("Area selected successfully");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="area-heatmap-container card">
      <div className="cardHeader">
        <p className="cardTitle">Area Flood Risk Heatmap</p>
      </div>
      <div className="cardBody">
        <div className="area-map-wrapper">
          <button
            className={`select-area-btn ${selectMode ? "active" : ""}`}
            onClick={handleSelectToggle}
            title={selectMode ? "Cancel selection" : "Enable area selection"}
          >
            {selectMode ? "Cancel Selection" : "Select Area"}
          </button>

          {selectMode && (
            <div className="select-hint">
              Drag on the map to select a flood risk area
            </div>
          )}

          <BoxSelectMap
            onBoxSelected={handleBoxSelected}
            selectMode={selectMode}
            onSelectComplete={handleSelectComplete}
          />
        </div>

        {loading && (
          <p className="loading">
            <span className="spinner" /> Generating heatmap report...
          </p>
        )}

        {error && (
          <div className="error-message">
            ❌ Error: {error}
          </div>
        )}

        {heatmapData.length > 0 && !loading && (
          <AreaHeatmapMap points={heatmapData} />
        )}

        {toast && <div className="heatmap-toast">{toast}</div>}
      </div>
    </div>
  );
}
