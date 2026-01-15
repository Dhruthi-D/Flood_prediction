import Dashboard from "./pages/Dashboard";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🌊 Flood Prediction System</h1>
          <p className="app-subtitle">AI-powered flood risk forecasting and analysis</p>
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
      <footer className="app-footer">
        <p>&copy; 2026 Flood Prediction System. All rights reserved.</p>
      </footer>
    </div>
  );
}
