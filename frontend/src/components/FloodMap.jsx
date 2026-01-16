import { useState, useEffect } from "react";
import "./FloodMap.css";

export default function FloodMap({ cities, onCityClick, isLoading }) {
  const [mapReady, setMapReady] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    // Load CSS
    const cssLink = document.createElement("link");
    cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    cssLink.rel = "stylesheet";
    document.head.appendChild(cssLink);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (cssLink.parentNode) cssLink.parentNode.removeChild(cssLink);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded) return;

    const mapContainer = document.getElementById("flood-map");
    if (!mapContainer) return;

    // Initialize map centered on India
    const map = window.L.map("flood-map").setView([20, 78], 5);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    setMapReady({ map, L: window.L });

    return () => {
      if (map) {
        map.off();
        map.remove();
      }
    };
  }, [leafletLoaded]);

  // Add markers when cities data is available
  useEffect(() => {
    if (!mapReady || !cities || cities.length === 0) return;

    const { map, L } = mapReady;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    cities.forEach((city) => {
      if (city.latitude && city.longitude) {
        const color = getRiskColor(city.risk_level);
        const probability = Math.round(city.probability * 100);

        // Create custom HTML marker
        const html = `
          <div class="flood-marker" style="background-color: ${color}">
            <div class="marker-text">${probability}%</div>
          </div>
        `;

        const customIcon = L.divIcon({
          html,
          className: "flood-marker-container",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([city.latitude, city.longitude], {
          icon: customIcon,
          title: city.city,
        });

        marker.bindPopup(`
          <div class="marker-popup">
            <h4>${city.city}</h4>
            <p><strong>Risk:</strong> ${city.risk_level}</p>
            <p><strong>Probability:</strong> ${probability}%</p>
            <p><strong>Temperature:</strong> ${city.weather?.temperature || "N/A"}°C</p>
            <p><strong>Rainfall:</strong> ${city.weather?.rainfall || "N/A"}mm</p>
          </div>
        `);

        marker.on("click", () => onCityClick(city));
        marker.addTo(map);
      }
    });
  }, [mapReady, cities, onCityClick]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "#22c55e"; // green
      case "moderate":
        return "#facc15"; // yellow
      case "high":
        return "#f97316"; // orange
      case "critical":
        return "#ef4444"; // red
      default:
        return "#64748b"; // gray
    }
  };

  return (
    <div className="flood-map-container">
      <div className="flood-map-header">
        <h2>🗺️ Multi-City Flood Risk Map</h2>
        {isLoading && <span className="loading-indicator">Loading cities...</span>}
      </div>

      <div className="flood-map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#22c55e" }}></div>
          <span>LOW</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#facc15" }}></div>
          <span>MODERATE</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#f97316" }}></div>
          <span>HIGH</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#ef4444" }}></div>
          <span>CRITICAL</span>
        </div>
      </div>

      <div id="flood-map" className="flood-map"></div>
    </div>
  );
}
