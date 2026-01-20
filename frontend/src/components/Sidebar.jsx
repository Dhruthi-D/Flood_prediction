import { NavLink, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Live Prediction", icon: "📊" },
  { path: "/forecast", label: "3-Day Forecast", icon: "📈" },
  { path: "/multi-city", label: "Multi-City Scan", icon: "🌍" },
  { path: "/simulation", label: "Simulation", icon: "🌀" },
  { path: "/area-heatmap", label: "Area Heatmap", icon: "🗺️" },
  { path: "/explainability", label: "Explainability", icon: "🔍" },
  { path: "/chat", label: "Chat Assistant", icon: "💬" },
  { path: "/custom", label: "Custom", icon: "✏️" },
];

export default function Sidebar({ collapsed, onToggle, currentPath }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebarInner">
        <div
          className="sidebarBrand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <div className="brandMark" aria-hidden="true" />
          {!collapsed && (
            <div className="brandText">
              <p className="brandTitle">Flood Prediction</p>
              <p className="brandSubtitle">AI Risk Dashboard</p>
            </div>
          )}
        </div>

        <button
          className="sidebarToggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="hamburgerIcon" />
        </button>

        <nav className="sidebarNav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "sidebarNavItem",
                  isActive ? "active" : "",
                  collapsed ? "iconOnly" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              end={item.path === "/"}
            >
              <span className="sidebarIcon">{item.icon}</span>
              {!collapsed && <span className="sidebarLabel">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}


