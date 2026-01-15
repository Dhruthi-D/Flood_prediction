import React from "react";

function getRiskColor(risk) {
  if (!risk) return "#64748b";
  switch (risk.toLowerCase()) {
    case "critical":
    case "high":
      return "#ef4444"; // red
    case "moderate":
    case "medium":
      return "#f97316"; // orange
    case "low":
      return "#22c55e"; // green
    default:
      return "#64748b";
  }
}

export default function ForecastChart({ data = [] }) {
  // data: [{ day: 'Day 1', probability: 0.12, risk: 'Low' }, ...]
  const width = 600;
  const height = 180;
  const padding = 32;
  const count = data.length || 3;
  const innerW = width - padding * 2;
  const barW = Math.max(28, innerW / count - 16);

  // Map probability (0..1) to pixels (0..height- padding)
  const maxBarHeight = height - padding * 2;

  return (
    <div className="forecast-chart" style={{ overflowX: "auto" }}>
      <svg width={Math.max(width, count * (barW + 16))} height={height}>
        {/* horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((p) => {
          const y = padding + (1 - p / 100) * maxBarHeight;
          return (
            <g key={p}>
              <line x1={padding} x2={Math.max(width, count * (barW + 16)) - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={6} y={y + 4} fill="rgba(230,244,255,0.7)" fontSize={10}>{p}%</text>
            </g>
          );
        })}

        {/* bars */}
        {data.map((d, i) => {
          const prob = Number(d.probability) || 0;
          const pct = Math.min(1, Math.max(0, prob));
          const bh = pct * maxBarHeight;
          const x = padding + i * (barW + 16) + 8;
          const y = padding + (maxBarHeight - bh);
          const labelX = x + barW / 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={6}
                ry={6}
                fill={getRiskColor(d.risk)}
                opacity={0.95}
              />

              {/* probability text */}
              <text x={labelX} y={y - 6} textAnchor="middle" fontSize={12} fill="#e6f4ff">
                {(pct * 100).toFixed(2)}%
              </text>

              {/* day label */}
              <text x={labelX} y={height - padding + 16} textAnchor="middle" fontSize={12} fill="rgba(230,244,255,0.85)">
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
