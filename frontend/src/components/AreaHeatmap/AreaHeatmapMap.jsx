import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { useEffect } from "react";

function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // Fit map to the selected area points and keep it static
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [10, 10], animate: false });

    const heatPoints = points.map(p => [
      p.lat,
      p.lon,
      p.intensity ?? 0.5
    ]);

    const heat = L.heatLayer(heatPoints, {
      radius: 65,      // Significantly increased radius to ensure points overlap fully
      blur: 45,        // High blur to create smooth transitions between points
      max: 0.8,        // Slightly lower max to prevent harsh "hot spots"
      minOpacity: 0.1, // Lower min opacity for smoother edge blending
      gradient: {
        0.1: '#0000ff', // Blue (Low)
        0.3: '#00ffff', // Cyan
        0.5: '#00ff00', // Lime
        0.7: '#ffff00', // Yellow
        1.0: '#ff0000'  // Red (High)
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

export default function AreaHeatmapMap({ points }) {
  if (!points || points.length === 0) return null;

  return (
    <div className="heatmap-result-wrapper">
      <MapContainer
        center={[points[0].lat, points[0].lon]}
        zoom={13}
        style={{ height: "600px", marginTop: "20px" }}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
      </MapContainer>

      <div className="heatmap-legend">
        <h4>Flood Risk Probability</h4>
        <div className="legend-scale">
          <div className="gradient-bar"></div>
          <div className="legend-labels">
            <span>0% (Low)</span>
            <span>50%</span>
            <span>100% (High)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
