import "./Simulation.css";

export default function Simulation() {
  return (
    <div className="simulation-container">
      <div className="feature-coming-soon">
        <div className="icon">🌀</div>
        <h2>3D Flood Simulation</h2>
        <p>Advanced spatial visualization of flood propagation and water flow dynamics</p>
        <div className="feature-list">
          <div className="feature-item">🗺️ Real-time 3D Map Visualization</div>
          <div className="feature-item">💧 Water Flow Dynamics</div>
          <div className="feature-item">🏗️ Impact Zone Analysis</div>
          <div className="feature-item">📊 Risk Heat Maps</div>
        </div>
        <span className="badge">Coming Soon</span>
      </div>
    </div>
  );
}
