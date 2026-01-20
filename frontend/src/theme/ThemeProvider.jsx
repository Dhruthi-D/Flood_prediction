import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Lightweight theme system:
 * - Uses CSS variables (see `src/styles/tokens.css`)
 * - Persists user preference in localStorage
 * - Applies `data-theme` on <html> for global styling
 */

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "fps_theme";
const THEMES = ["light", "dark"];

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved && THEMES.includes(saved)) return saved;
  // Prefer OS setting on first load
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => {
    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}


