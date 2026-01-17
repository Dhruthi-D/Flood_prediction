import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function BoxSelector({ onBoxSelected }) {
  const map = useMap();
  const start = useRef(null);
  const rect = useRef(null);

  useEffect(() => {
    if (!map) return;

    const onMouseDown = (e) => {
      start.current = e.latlng;
      map.dragging.disable();

      if (rect.current) {
        map.removeLayer(rect.current);
        rect.current = null;
      }
    };

    const onMouseMove = (e) => {
      if (!start.current) return;

      const bounds = L.latLngBounds(start.current, e.latlng);

      if (!rect.current) {
        rect.current = L.rectangle(bounds, {
          color: "#2563eb",
          weight: 2,
          fillOpacity: 0.15,
          dashArray: "4",
        }).addTo(map);
      } else {
        rect.current.setBounds(bounds);
      }
    };

    const onMouseUp = (e) => {
      if (!start.current) return;

      const bounds = L.latLngBounds(start.current, e.latlng);
      start.current = null;
      map.dragging.enable();

      onBoxSelected({
        min_lat: bounds.getSouth(),
        min_lon: bounds.getWest(),
        max_lat: bounds.getNorth(),
        max_lon: bounds.getEast(),
      });
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
  }, [map, onBoxSelected]);

  return null;
}

export default function BoxSelectMap({ onBoxSelected }) {
  return (
    <MapContainer
      center={[17.385, 78.486]}
      zoom={13}
      style={{ height: "450px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoxSelector onBoxSelected={onBoxSelected} />
    </MapContainer>
  );
}
