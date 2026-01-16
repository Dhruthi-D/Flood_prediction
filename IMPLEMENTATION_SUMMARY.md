# Flood Prediction Project - Multi-City Extension Implementation

## Summary of Changes

This document outlines all the changes made to extend the flood prediction project with multi-city flood simulation and map view functionality.

---

## 1. Backend Changes

### 1.1 New File: `backend/multi_city_utils.py`
**Purpose:** Utilities for multi-city flood prediction and geocoding

**Key Functions:**
- `get_city_coordinates(city_name)` - Fetches coordinates using Open-Meteo geocoding API with caching
- `fetch_live_weather_for_city(lat, lon)` - Fetches live weather data for given coordinates
- `get_flood_prediction_for_city(city_name)` - Gets flood prediction for a single city
- `get_multiple_cities_predictions(city_names)` - Gets predictions for multiple cities
- `get_sample_cities(limit)` - Gets a sample of cities from Cities.csv for the multi-city view

**Features:**
- Caches geocoded coordinates to avoid repeated API calls
- Fallback to default weather data if API fails
- Returns city data with: name, coordinates, probability, risk_level, weather

### 1.2 Updated: `backend/main.py`
**Changes:**
- Added import: `from multi_city_utils import get_multiple_cities_predictions, get_sample_cities`
- Added two new endpoints:
  
  **`GET /multi-city/sample`**
  - Parameter: `limit` (1-100, default 10)
  - Returns: Sample of cities with flood predictions
  - Response: `{"cities": [...]}`
  
  **`POST /multi-city/predictions`**
  - Request body: `{"cities": ["city1", "city2", ...]}`
  - Returns: Flood predictions for specified cities
  - Response: `{"cities": [...]}`

---

## 2. Frontend Changes

### 2.1 New Component: `frontend/src/components/FloodMap.jsx`
**Purpose:** Interactive Leaflet map displaying cities with color-coded flood risk

**Features:**
- Dynamically loads Leaflet library from CDN
- Centers map on India (20°, 78°)
- Color-coded markers:
  - GREEN (#22c55e) = LOW risk
  - YELLOW (#facc15) = MODERATE risk
  - ORANGE (#f97316) = HIGH risk
  - RED (#ef4444) = CRITICAL risk
- Marker size/opacity depends on flood probability
- Clicking a city triggers `onCityClick` callback
- Popups show city details on marker click
- Legend displays risk color mapping

**Props:**
- `cities` - Array of city prediction data
- `onCityClick` - Callback function when city is clicked
- `isLoading` - Boolean to show loading indicator

### 2.2 New CSS: `frontend/src/components/FloodMap.css`
**Styles:**
- Map container with proper height management
- Legend styling with gradient indicators
- Responsive design for mobile
- Custom marker styling with hover effects
- Popup styling with city details

### 2.3 New Page: `frontend/src/pages/MultiCityScan.jsx`
**Purpose:** Main interface for multi-city flood scan and simulation

**Features:**
- Header with title and subtitle
- Control panel with:
  - City limit selector (5-50 cities)
  - Refresh scan button
- Statistics dashboard showing:
  - Total cities scanned
  - Count of cities by risk level
- FloodMap component integrated
- Cities list grid showing:
  - City name
  - Risk level with color coding
  - Probability percentage
  - Current weather (temp, rain)
  - "View Simulation" button
- Simulation section that appears when a city is clicked
- Smooth scroll to simulation section when city selected

**State Management:**
- `cities` - Fetched city predictions
- `loading` - Loading state for API calls
- `error` - Error messages
- `selectedCity` - Currently selected city
- `showSimulation` - Whether to display simulation
- `cityLimit` - Number of cities to fetch

**API Calls:**
- `GET /multi-city/sample?limit={cityLimit}` - Load cities on mount and refresh

### 2.4 New CSS: `frontend/src/pages/MultiCityScan.css`
**Styles:**
- Header with gradient background
- Control section styling
- Statistics grid with color-coded cards
- Cities grid with hover effects
- City cards with risk color left border
- Simulation section styling
- Responsive grid layouts
- Mobile optimization

### 2.5 Updated: `frontend/src/pages/Dashboard.jsx`
**Changes:**
- Import added: `import MultiCityScan from "./MultiCityScan";`
- New tab button: "🌍 Multi-City Scan" (activeTab === "multi-city")
- New tab content section for multi-city view
- MultiCityScan component integrated into tab system
- Tab ordering: Live → Forecast → Multi-City → Simulation → Custom

### 2.6 Updated: `frontend/src/pages/Simulation.jsx`
**Changes:**
- Now accepts `initialCity` prop
- Uses `initialCity` data to set initial sandbox probability
- Falls back to localStorage for standalone mode
- When `initialCity` is provided:
  - Sets sandbox probability to city's prediction
  - Enables sandbox mode by default
  - Allows user to customize before running
- Maintains backward compatibility with existing custom prediction workflow

### 2.7 Updated: `frontend/src/services/api.js`
**New Functions:**
- `getMultiCitySample(limit)` - Fetches sample cities
- `getMultiCityPredictions(cities)` - Fetches predictions for specific cities

**Existing Functions:** All preserved and functional

### 2.8 Updated: `frontend/index.html`
**Changes:**
- Added Leaflet CSS link to `<head>`:
  ```html
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  ```

### 2.9 Updated: `frontend/package.json`
**New Dependencies:**
- `"leaflet": "^1.9.4"` - Map library
- `"react-leaflet": "^4.2.1"` - React wrapper for Leaflet

**Installation Required:**
```bash
npm install
```

### 2.10 Updated: `frontend/src/pages/Dashboard.css`
**Changes:**
- Added CSS for multi-city tab adjustments
- Ensures proper padding/margin handling when multi-city component is embedded

---

## 3. Feature Requirements Met

### ✅ 1. Multi-City Scan View
- Dedicated page with map display
- Lists multiple cities with risk levels
- Controls for city limit and refresh
- Statistics dashboard

### ✅ 2. Flood Map View
- Interactive Leaflet map centered on India
- Cities displayed as color-coded markers
- Marker size/opacity reflects flood probability
- Clickable markers open city details
- Click to navigate to simulation view
- Legend showing risk color mapping

### ✅ 3. Simulation Input Toggle
- Sandbox Mode vs ML Prediction Mode toggle in Simulation component
- Clear labeling: "Use Prediction Data" vs "Use Manual Simulation Input"
- Toggle in simulation view, plus integration from multi-city view

### ✅ 4. Manual Simulation Input
- Sliders for:
  - Flood Probability (%) - range 0-100
  - Simulation Duration (hours) - range 1-168
- Default values pre-filled (from city prediction if available)
- Immediate animation and sound based on probability
- Real-time updates to flood animation

### ✅ 5. Simulation Behavior
- Hour-by-hour simulation (existing functionality preserved)
- Animation intensity depends on probability
- Sound volume/frequency depends on flood probability
- Critical risk triggers warning sound
- No new ML models required
- No backend changes except new endpoints (no existing functionality altered)

### ✅ 6. UX Expectations
- Clean, modern UI with gradient backgrounds
- Map-focused view for multi-city scanning
- Clear visual risk indicators (color coding)
- Responsive design for mobile/tablet
- Smooth interactions and animations
- No extra charts, focus on map and animation
- Real-time scanning feel with refresh capability

### ✅ 7. Rules Compliance
- ✓ No existing prediction features removed
- ✓ Multi-city and prediction modes clearly labeled
- ✓ Simulation maintained as visualization/what-if tool
- ✓ No mixing of prediction and simulation data
- ✓ Backward compatible with existing features

---

## 4. Data Flow

### Multi-City Scan Flow:
```
User clicks "Multi-City Scan" tab
    ↓
MultiCityScan component loads
    ↓
GET /multi-city/sample?limit=15
    ↓
Backend fetches sample cities from CSV
    ↓
For each city:
  - Geocode to get coordinates
  - Fetch live weather
  - Run ML prediction
  - Classify risk level
    ↓
Return city data with predictions
    ↓
FloodMap displays cities on interactive map
Cities list shows summary cards
Statistics dashboard updated
    ↓
User clicks on a city
    ↓
Simulation tab opens with city data
Sandbox mode enabled with city's probability
User can adjust sliders
    ↓
Run simulation with custom/predicted probability
Animation and sound respond to probability
```

---

## 5. Color Coding Scheme

| Risk Level | Color | Hex Code | CSS Class |
|-----------|-------|----------|-----------|
| LOW | Green | #22c55e | `low` |
| MODERATE | Yellow | #facc15 | `moderate` |
| HIGH | Orange | #f97316 | `high` |
| CRITICAL | Red | #ef4444 | `critical` |

---

## 6. API Endpoints Summary

### New Endpoints:
- `GET /multi-city/sample?limit=10` - Get sample cities with predictions
- `POST /multi-city/predictions` - Get predictions for specific cities

### Existing Endpoints (Preserved):
- `POST /predict` - Custom weather prediction
- `GET /predict/live` - Live prediction for location
- `GET /forecast/3day` - 3-day forecast
- `POST /simulate` - Flood simulation
- `GET /cities` - City search
- `POST /validate-location` - Location validation
- `GET /explainability` - Feature importance
- `POST /explainability/instance` - Instance explanation

---

## 7. Installation & Setup

### Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup:
```bash
cd frontend
npm install  # Install new dependencies (leaflet, react-leaflet)
npm run dev
```

**Note:** Leaflet is loaded from CDN in addition to npm for flexibility.

---

## 8. Browser Requirements

- Modern browser with ES6+ support
- WebGL or Canvas support (for map rendering)
- Web Audio API support (for sound effects)
- LocalStorage support (for caching)

---

## 9. Performance Considerations

### Optimizations:
- Geocoding results cached in memory to prevent repeated API calls
- City sample loaded on demand (default: 10-50 cities)
- Lazy loading of Leaflet from CDN
- Canvas-based animation (efficient rendering)
- Debounced city search (existing implementation)

### Limitations:
- Maximum 50 cities per prediction request (enforced on backend)
- Real-time API calls to Open-Meteo (slight latency expected)
- Weather fallback values if API unavailable

---

## 10. Testing Checklist

### Frontend:
- [ ] Multi-City Scan tab loads without errors
- [ ] Map displays correctly with city markers
- [ ] Markers are color-coded by risk level
- [ ] Clicking marker opens popup with city details
- [ ] Clicking "View Simulation" button opens simulation
- [ ] City limit slider works (5-50 range)
- [ ] Refresh button reloads cities
- [ ] Statistics update correctly
- [ ] Cities list displays all cities with correct info
- [ ] Responsive design works on mobile/tablet
- [ ] Simulation mode toggle works
- [ ] Sliders update animation and sound
- [ ] Mute button functions correctly
- [ ] Play/Pause controls work

### Backend:
- [ ] `/multi-city/sample` returns valid data
- [ ] `/multi-city/predictions` accepts POST with city list
- [ ] Geocoding works for Indian cities
- [ ] Weather API falls back gracefully
- [ ] Risk classification correct (0-1 probability to risk level)
- [ ] Error handling works (invalid cities, API failures)

### Integration:
- [ ] Dashboard navigation works smoothly
- [ ] Multi-City tab appears in dashboard
- [ ] Tab switching is smooth
- [ ] City data flows correctly to simulation
- [ ] localStorage integration works
- [ ] CORS headers properly configured

---

## 11. Future Enhancements

Potential improvements for future iterations:
1. **Search functionality** - Search for specific cities in map view
2. **Export functionality** - Export city data as CSV/PDF
3. **Historical data** - Show trend over time
4. **Alerts** - Push notifications for high-risk cities
5. **Custom city selection** - User can select specific cities instead of sample
6. **Comparison view** - Compare two cities side-by-side
7. **Advanced filtering** - Filter by state, risk level, probability range
8. **Real-time updates** - Auto-refresh at intervals
9. **Prediction accuracy metrics** - Show model confidence/accuracy
10. **Multiple prediction models** - Choose between different ML models

---

## 12. Known Limitations

1. **Geocoding Accuracy** - Depends on Open-Meteo API accuracy for Indian city names
2. **Real-time Weather** - Requires active internet connection
3. **CSV Size** - Currently handling 5000+ cities; performance may degrade significantly
4. **Mobile Map** - Limited to 50 cities simultaneously for performance
5. **Weather Fallback** - If API fails, default weather values used (may affect accuracy)
6. **Audio** - Web Audio API may not work in all browsers or contexts (requires user interaction)

---

## 13. Code Quality Notes

- **Type Safety** - React components use prop validation via function signatures
- **Error Handling** - Try-catch blocks for API calls with user-friendly error messages
- **Responsive Design** - CSS media queries for mobile/tablet/desktop
- **Performance** - Efficient caching, lazy loading, and request debouncing
- **Code Organization** - Clear separation of concerns (components, pages, services, utils)
- **Backward Compatibility** - All existing features preserved and functional

---

## 14. Deployment Notes

1. **Environment Variables** - Update API_BASE URL in production
2. **CORS Configuration** - Update allowed origins in backend
3. **CDN Resources** - Leaflet CSS/JS from CDN (ensure availability)
4. **Build Output** - Run `npm run build` before deployment
5. **Backend Service** - Keep uvicorn running in production (use Gunicorn/supervisord)

---

**Implementation Date:** January 16, 2026
**Status:** Complete and Ready for Testing
