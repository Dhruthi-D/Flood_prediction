import Dashboard from "./pages/Dashboard";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-top">
            <h1 className="app-title">🌊 Flood Prediction System</h1>
            <p className="app-subtitle">AI-powered flood risk forecasting & analysis</p>
          </div>
          <div className="header-tagline">
            <span className="tagline-badge">🎯 Real-time monitoring</span>
            <span className="tagline-badge">📊 Predictive analytics</span>
            <span className="tagline-badge">🔍 Explainable AI</span>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
      <footer className="app-footer">
        <p>&copy; 2026 Flood Prediction System. Built with AI &amp; precision forecasting.</p>
      </footer>
    </div>
  );
}
