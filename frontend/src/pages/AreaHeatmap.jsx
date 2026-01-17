import { useState } from "react";
import BoxSelectMap from "../components/AreaHeatmap/BoxSelectMap";
import AreaHeatmapMap from "../components/AreaHeatmap/AreaHeatmapMap";
import "../components/AreaHeatmap/AreaHeatmap.css";

export default function AreaHeatmap() {
  const [box, setBox] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="area-heatmap-container">
      <h2>🗺️ Area Flood Risk Heatmap</h2>
      <p>Drag to select an area (snipping-tool style)</p>

      <BoxSelectMap onBoxSelected={handleBoxSelected} />

      {loading && <p className="loading">Generating heatmap report...</p>}
      
      {error && (
        <div className="error-message" style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
          ❌ Error: {error}
        </div>
      )}

      {heatmapData.length > 0 && !loading && (
        <AreaHeatmapMap points={heatmapData} />
      )}
    </div>
  );
}
