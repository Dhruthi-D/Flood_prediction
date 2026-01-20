import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useOutletContext, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import ThemeToggle from "../components/ThemeToggle";
import LocationSelector from "../components/LocationSelector";
import "../App.css";

const LAYOUT_STORAGE_KEY = "fps_sidebar_collapsed";

const PAGE_META = {
  "/": {
    title: "Live Flood Prediction",
    description: "Real-time flood risk estimation using AI",
  },
  "/forecast": {
    title: "3-Day Flood Forecast",
    description: "Short-term flood risk forecast for your selected location",
  },
  "/multi-city": {
    title: "Multi-City Scan",
    description: "Compare flood risk across multiple locations",
  },
  "/simulation": {
    title: "Flood Simulation Studio",
    description: "Simulate dynamic flood scenarios and risk evolution",
  },
  "/area-heatmap": {
    title: "Area Flood Risk Heatmap",
    description: "Visualize flood risk intensity over a selected area",
  },
  "/explainability": {
    title: "SHAP Explainability",
    description: "Understand which factors drive your flood predictions",
  },
  "/chat": {
    title: "AI Flood Assistant",
    description: "Ask questions about predictions, SHAP values and simulations",
  },
  "/custom": {
    title: "Custom Prediction",
    description: "Manually tune inputs and explore model responses",
  },
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locationSelection, setLocationSelection] = useState(null);

  // Hydrate sidebar state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved != null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const meta = useMemo(() => {
    return PAGE_META[location.pathname] || {
      title: "Flood Prediction System",
      description: "AI-powered flood risk forecasting & analysis",
    };
  }, [location.pathname]);

  const showLocationSelector =
    location.pathname === "/" || location.pathname === "/forecast";

  const handleHelpClick = () => {
    navigate("/chat");
  };

  return (
    <div className="appShell">
      {!sidebarCollapsed && (
        <div
          className="sidebarOverlay mobileOnly"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPath={location.pathname}
      />

      <div className="appMain">
        <header className="appHeader">
          <div className="appHeaderLeft">
            <button
              className="iconButton ghostButton mobileOnly"
              aria-label="Toggle navigation"
              onClick={toggleSidebar}
            >
              <span className="hamburgerIcon" />
            </button>
            <PageHeader
              title={meta.title}
              description={meta.description}
              breadcrumb={null}
            />
          </div>
          <div className="appHeaderRight">
            <ThemeToggle />
            <button
              className="iconButton ghostButton"
              onClick={handleHelpClick}
              aria-label="Open help chat"
            >
              ?
            </button>
          </div>
        </header>

        {showLocationSelector && (
          <div className="headerLocationBar">
            <div className="headerLocationInner card">
              <div className="cardHeader">
                <p className="cardTitle">Location</p>
              </div>
              <div className="cardBody">
                <LocationSelector
                  onLocationSelect={setLocationSelection}
                  selectedLocation={locationSelection}
                />
              </div>
            </div>
          </div>
        )}

        <main className="appContent">
          <Outlet context={{ locationSelection }} />
          <footer className="footer">
            <span>&copy; 2026 Flood Prediction System</span>
            <span style={{ margin: "0 8px" }}>•</span>
            <span>Built with FastAPI + React</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function useLayoutLocationSelection() {
  return useOutletContext();
}


