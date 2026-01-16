# SHAP Explainability Implementation Guide

## Overview
This document describes the SHAP (SHapley Additive exPlanations) explainability implementation for the flood prediction model. SHAP provides interpretable explanations for XGBoost model predictions.

## Implementation Summary

### Backend Changes

#### 1. **requirements.txt**
- Added `shap` dependency

#### 2. **model_loader.py**
New functionality:
- **SHAP TreeExplainer Initialization**: Created a global `shap_explainer` using `shap.TreeExplainer` on the loaded XGBoost model
- **Feature Names Handling**: Ensured feature names are returned as strings (handles numpy string conversion)
- **Feature Order**: Maintains correct training feature order:
  ```
  ['T2M', 'T2M_MAX', 'T2M_MIN', 'PS', 'PRECTOTCORR', 'RH2M', 'WS2M', 'rain_anomaly', 'temp_anomaly']
  ```
- **explain_instance_shap() function**: 
  - Takes 2D numpy array of features
  - Returns dict with:
    - `base_value`: Expected model output (background)
    - `feature_names`: List of 9 feature names
    - `shap_values`: List of 9 SHAP values (one per feature)
    - `prediction`: Flood probability for the instance

#### 3. **main.py**
New endpoint:
- **POST /explain**: 
  - Accepts WeatherInput (same as /predict)
  - Constructs feature array in correct order
  - Calls `explain_instance_shap()`
  - Returns JSON with base_value, feature_names, shap_values, prediction
  - No model retraining
  - No plot generation (minimal backend)

### Frontend Changes

#### 1. **services/api.js**
New function:
- **explainPrediction()**: Makes POST request to /explain endpoint with weather payload

#### 2. **pages/Explainability.jsx**
Complete redesign:
- **Input Form**: 9 weather input fields with proper labels and defaults
- **SHAP Visualization**: 
  - Bar chart showing feature contributions
  - Blue bars for positive (risk-increasing) effects
  - Red bars for negative (risk-decreasing) effects
  - Bars scaled by absolute SHAP value magnitude
- **Key Drivers Section**: Text summary of top 3 contributors
- **Prediction Display**: Shows flood risk probability with color coding

#### 3. **pages/Explainability.css**
New styles:
- Input grid layout (responsive)
- SHAP bar chart styling
- Feature contribution visualization
- Summary box styling
- Mobile-responsive design

## Data Flow

### Request
```
Frontend Form Input (9 weather parameters)
    ↓
explainPrediction(payload)
    ↓
POST /explain
```

### Processing
```
/explain endpoint receives WeatherInput
    ↓
Construct numpy array [T2M, T2M_MAX, T2M_MIN, PS, PRECTOTCORR, RH2M, WS2M, rain_anomaly, temp_anomaly]
    ↓
explain_instance_shap(features)
    ↓
shap_explainer.shap_values(array)
    ↓
Return {base_value, feature_names, shap_values, prediction}
```

### Response
```
Frontend receives SHAP explanation
    ↓
Calculate feature contributions (feature_name, shap_value, abs_shap)
    ↓
Sort by importance (absolute SHAP value)
    ↓
Display bar chart + top 3 drivers
```

## Key Features

### 1. **Model Integrity**
- ✓ XGBoost model is NOT retrained
- ✓ LSTM ensemble component is NOT explained (only XGBoost)
- ✓ Uses existing trained model weights

### 2. **SHAP Correctness**
- ✓ TreeExplainer for tree-based models (efficient, accurate)
- ✓ Correct feature order matching training data
- ✓ Base value (expected model output) included
- ✓ Per-instance SHAP values generated on-demand

### 3. **Minimal & Reliable**
- ✓ No SHAP summary plots in backend (keeps it simple)
- ✓ Frontend handles visualization
- ✓ Clean JSON response format
- ✓ Error handling with meaningful messages

### 4. **Feature Interpretation**
- Positive SHAP value → increases flood prediction (blue)
- Negative SHAP value → decreases flood prediction (red)
- Magnitude indicates strength of influence

## Testing

Backend verification completed:
```
✓ SHAP explainer initialized successfully
✓ Feature names extracted correctly (9 features)
✓ explain_instance_shap() returns proper structure
✓ JSON serialization works correctly
```

## Usage

### Make a Prediction Explanation
```bash
POST /explain
Content-Type: application/json

{
  "temperature": 25.0,
  "temperature_max": 30.0,
  "temperature_min": 20.0,
  "pressure": 1013.0,
  "rainfall": 5.0,
  "humidity": 65.0,
  "wind_speed": 5.0,
  "rain_anomaly": 0.0,
  "temp_anomaly": 0.0
}
```

### Response
```json
{
  "base_value": 0.8711,
  "feature_names": ["T2M", "T2M_MAX", "T2M_MIN", "PS", "PRECTOTCORR", "RH2M", "WS2M", "rain_anomaly", "temp_anomaly"],
  "shap_values": [0.0755, -0.6078, -0.6864, ...],
  "prediction": 0.0349
}
```

## Files Modified

1. `backend/requirements.txt` - Added shap
2. `backend/model_loader.py` - Added SHAP explainer and explain_instance_shap()
3. `backend/main.py` - Added /explain endpoint
4. `frontend/src/services/api.js` - Added explainPrediction()
5. `frontend/src/pages/Explainability.jsx` - Complete redesign with SHAP visualization
6. `frontend/src/pages/Explainability.css` - New styles for SHAP visualization

## Dependencies
- shap: TreeExplainer for XGBoost
- numpy: Array operations
- All existing dependencies

## Performance Notes
- SHAP TreeExplainer is fast (tree-based, not sampling-based)
- Single prediction explanation: <1 second
- Memory usage: Minimal (background data not stored)

## Future Enhancements
- Add SHAP dependence plots (if needed)
- Add waterfall plots (feature impact visualization)
- Cache background data for faster subsequent explanations
