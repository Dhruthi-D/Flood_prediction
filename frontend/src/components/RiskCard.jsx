import "./RiskCard.css";

export default function RiskCard({ probability, risk }) {
  const getRiskClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return "risk-high";
      case "medium":
        return "risk-medium";
      case "low":
        return "risk-low";
      default:
        return "risk-neutral";
    }
  };

  return (
    <div className={`risk-card-container ${getRiskClass(risk)}`}>
      <div className="risk-icon">⚠️</div>
      <div className="risk-content">
        <h3>Flood Risk Assessment</h3>
        <div className="risk-details">
          <div className="detail-item">
            <span className="detail-label">Probability</span>
            <span className="detail-value">{probability}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Risk Level</span>
            <span className="detail-value risk-badge">{risk}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
