export default function WeatherTiles({ weather }) {
  if (!weather) return null;

  const tileStyle = {
    padding: "15px",
    borderRadius: "10px",
    background: "#f8fafc",
    textAlign: "center",
    minWidth: "120px"
  };

  return (
    <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
      <div style={tileStyle}>
        🌡️<br />Temp<br /><b>{weather.temperature} °C</b>
      </div>
      <div style={tileStyle}>
        🌧️<br />Rain<br /><b>{weather.rainfall} mm</b>
      </div>
      <div style={tileStyle}>
        💧<br />Humidity<br /><b>{weather.humidity} %</b>
      </div>
      <div style={tileStyle}>
        📈<br />Pressure<br /><b>{weather.pressure} hPa</b>
      </div>
      <div style={tileStyle}>
        🌬️<br />Wind<br /><b>{weather.wind_speed} m/s</b>
      </div>
    </div>
  );
}
