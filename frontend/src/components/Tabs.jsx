export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = ["Live", "Forecast", "Simulation"];

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: activeTab === tab ? "#2563eb" : "#e5e7eb",
            color: activeTab === tab ? "white" : "black"
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
