# Quick Start Guide - Multi-City Flood Scan

## What Was Added

Your flood prediction project now has a powerful multi-city flood scanning system with interactive maps and what-if simulations.

---

## 🚀 Quick Setup

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Access the App

Open your browser to: `http://localhost:5173`

---

## 📍 Using Multi-City Scan

### Step-by-Step:

1. **Go to Multi-City Scan Tab**
   - Click the "🌍 Multi-City Scan" tab in the dashboard

2. **View the Map**
   - Interactive map shows cities with color-coded risk markers
   - Adjust "Number of Cities" slider (5-50)
   - Click "Refresh Scan" to get new predictions

3. **Understand Risk Colors**
   - 🟢 GREEN = Low Risk
   - 🟡 YELLOW = Moderate Risk
   - 🟠 ORANGE = High Risk
   - 🔴 RED = Critical Risk

4. **Explore a City**
   - Click a marker on the map OR
   - Click "View Simulation →" on any city card

5. **Run Simulation**
   - **Sandbox Mode** - Adjust probability (%) and duration (hours) manually
   - **Prediction Mode** - Use the city's actual prediction data
   - Toggle between modes with the checkbox
   - Click "Run Simulation" to start animation
   - Watch the water level rise based on flood probability
   - Listen to dynamic sound (rain + warning)

---

## 🎮 Simulation Controls

| Control | Purpose |
|---------|---------|
| **Mode Toggle** | Switch between Prediction (ML data) and Sandbox (manual) |
| **Probability Slider** | Set flood probability (0-100%) |
| **Duration Slider** | Set simulation length (1-168 hours) |
| **Run Simulation** | Start the hour-by-hour animation |
| **Play/Pause** | Control animation playback |
| **Mute** | Toggle sound on/off |

---

## 📊 Dashboard Stats

The statistics panel shows:
- **Total** - Number of cities scanned
- **Critical** - Count of cities with critical risk
- **High** - Count of cities with high risk
- **Moderate** - Count of cities with moderate risk
- **Low** - Count of cities with low risk

---

## 🗺️ Map Features

- **Interactive Leaflet Map** - Zoom, pan, explore
- **Color-Coded Markers** - Instant risk visualization
- **Popup Details** - Click markers for city information
- **Legend** - Shows color meaning
- **Responsive** - Works on mobile and desktop

---

## 📈 Existing Features (Preserved)

All your original features still work:
- ✅ Live Prediction (single city)
- ✅ 3-Day Forecast
- ✅ Custom Prediction Input
- ✅ Flood Simulation with sound effects
- ✅ City search and autocomplete

---

## 🔧 Troubleshooting

### Map Not Showing?
- Check internet connection (CDN resources)
- Clear browser cache
- Check browser console for errors

### Cities Not Loading?
- Ensure backend is running
- Check `/multi-city/sample` endpoint responds
- Verify Cities.csv file exists in project root

### Simulation Not Playing Sound?
- Click anywhere on the page first (browsers require user interaction)
- Check browser volume settings
- Verify Web Audio API is supported (check console)

### Slow Performance?
- Reduce number of cities (5-10 for slower devices)
- Close other tabs/apps
- Use modern browser (Chrome, Firefox, Safari, Edge)

---

## 📝 New Endpoints

**Get Sample Cities:**
```
GET /multi-city/sample?limit=15
```

**Get Predictions for Specific Cities:**
```
POST /multi-city/predictions
Body: {"cities": ["Delhi", "Mumbai", "Bangalore"]}
```

---

## 💾 Data Persistence

- **City coordinates** are cached in memory (prevents repeated geocoding)
- **Last simulation input** saved to localStorage
- **Predictions** fetched fresh each time (live data)

---

## 🎯 Key Metrics

- **Probability Range:** 0-1 (displayed as %)
- **Risk Classification:**
  - 0.0-0.25 = LOW
  - 0.25-0.50 = MODERATE
  - 0.50-0.75 = HIGH
  - 0.75-1.0 = CRITICAL

---

## 🔐 Data Sources

- **Weather Data:** Open-Meteo API (free, no auth required)
- **Geocoding:** Open-Meteo Geocoding API
- **City List:** Cities.csv (local file)
- **Predictions:** Your trained ML model (XGBoost)

---

## 📱 Device Support

- **Desktop:** Full functionality
- **Tablet:** Full functionality (slightly reduced city limit)
- **Mobile:** Full functionality (optimized for smaller screens)

---

## 🚨 Important Notes

1. **Live Predictions** - Requires internet for weather API
2. **Simulation is Visual** - Not a real flood forecast for decisions
3. **No ML Model Changes** - Using existing trained model
4. **Backward Compatible** - All old features work exactly as before
5. **Clear Labeling** - Prediction vs Simulation clearly marked

---

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify both backend and frontend are running
3. Check the IMPLEMENTATION_SUMMARY.md for detailed info
4. Ensure all npm packages are installed

---

**Version:** 1.0 (Multi-City Extension)
**Date:** January 2026
**Status:** Ready to Use ✅
