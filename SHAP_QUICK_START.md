# SHAP Explainability - Quick Start Guide

## What is SHAP Explainability?

SHAP (SHapley Additive exPlanations) explains which weather features contribute most to each flood prediction. It shows:
- **Blue bars** = features that INCREASE flood risk
- **Red bars** = features that DECREASE flood risk
- **Bar length** = strength of influence

## Using the Explainability Page

### Step 1: Navigate to Explainability
Click "Explainability" in the main navigation menu.

### Step 2: Enter Weather Data
Fill in the weather parameters:
- Temperature (°C)
- Max Temperature (°C)
- Min Temperature (°C)
- Pressure (hPa)
- Rainfall (mm)
- Humidity (%)
- Wind Speed (m/s)
- Rain Anomaly (deviation from normal)
- Temperature Anomaly (deviation from normal)

**Quick Tip:** Click "Explain Prediction" to use default values as an example.

### Step 3: Generate Explanation
Click **"Explain Prediction"** button.

### Step 4: Interpret Results
The explanation shows:

#### Flood Risk Probability
The predicted chance of flooding (0-100%)
- Green: Low risk (< 50%)
- Red: High risk (> 50%)

#### Feature Contributions Bar Chart
Visual bar chart showing all 9 features ranked by importance:
- Each bar shows the SHAP value for that feature
- Longer bars = stronger influence
- Color indicates direction (increase/decrease risk)

#### Key Drivers Section
Text summary listing the top 3 most influential factors:
- Shows if each factor increases or decreases risk
- Includes numerical SHAP value

## Example Interpretations

### Example 1: High Rainfall Dominates
```
Prediction: 75% (High Risk)

Key Drivers:
- Rainfall: +0.6500 (increases flood risk)
- Temperature: -0.2300 (decreases flood risk)
- Humidity: +0.1200 (increases flood risk)
```
**Interpretation:** Heavy rainfall is the main driver of flood risk in this scenario.

### Example 2: Multiple Risk Factors
```
Prediction: 62% (Moderate Risk)

Key Drivers:
- Pressure: -0.4100 (decreases flood risk)
- Rainfall: +0.3500 (increases flood risk)
- Wind Speed: +0.1800 (increases flood risk)
```
**Interpretation:** Low pressure and moderate rainfall are creating moderate risk.

### Example 3: Protective Factors
```
Prediction: 15% (Low Risk)

Key Drivers:
- Temperature: -0.5200 (decreases flood risk)
- Min Temperature: -0.3100 (decreases flood risk)
- Humidity: -0.2400 (decreases flood risk)
```
**Interpretation:** Warm, dry conditions are protecting against floods.

## Feature Meanings

| Feature | Range | Interpretation |
|---------|-------|-----------------|
| T2M | -50°C to +50°C | Current temperature |
| T2M_MAX | -40°C to +60°C | Daily high temperature |
| T2M_MIN | -60°C to +40°C | Daily low temperature |
| PS | 900-1050 hPa | Atmospheric pressure |
| PRECTOTCORR | 0-100+ mm | Total rainfall |
| RH2M | 0-100% | Relative humidity |
| WS2M | 0-30 m/s | Wind speed |
| rain_anomaly | -50 to +100 mm | Rainfall vs. historical average |
| temp_anomaly | -20°C to +20°C | Temperature vs. historical average |

## Understanding SHAP Values

### What are SHAP Values?
SHAP values show how much each feature pushes the prediction away from the baseline:

**Prediction = Base Value + Sum of SHAP Values**

Example:
- Base Value: 0.50 (50% baseline risk)
- Rainfall SHAP: +0.20 (adds 20% risk)
- Humidity SHAP: -0.05 (removes 5% risk)
- **Final Prediction: 0.50 + 0.20 - 0.05 = 0.65 (65%)**

### Why Use SHAP?
1. **Fair Attribution**: Each feature gets credit/blame proportional to its influence
2. **Local Explanations**: Explains specific predictions, not general patterns
3. **Consistent**: Same base prediction math as the model
4. **Trustworthy**: Based on game theory (Shapley values)

## Tips for Better Understanding

### 1. Compare Scenarios
Try different weather conditions to see how each feature's influence changes.

### 2. Look for Patterns
- Does rainfall always increase risk?
- Does temperature mostly decrease risk?
- Are anomalies more important than absolute values?

### 3. Check the Magnitude
Focus on larger bars first - they have more impact on the final prediction.

### 4. Use Default Values
Start with the default example to see a typical prediction explanation.

## Common Questions

**Q: Why is rainfall sometimes negative?**
A: In rare conditions, higher rainfall might correlate with other protective factors. SHAP captures the actual model behavior.

**Q: What's the difference between feature importance and SHAP values?**
A: Feature importance shows global patterns (across all predictions). SHAP values are local (for this specific prediction).

**Q: Can SHAP values be wrong?**
A: No, SHAP values accurately represent the model's logic. If they seem wrong, the model itself might have unexpected behavior.

**Q: Why does temperature have different effects sometimes?**
A: SHAP shows the interaction effect. Temperature's impact changes based on other weather conditions.

## Technical Details

- **Model**: XGBoost flood prediction model
- **Explainer**: SHAP TreeExplainer (fast, accurate for tree models)
- **Features**: 9 weather parameters
- **Computation**: <1 second per explanation

## Need Help?

For detailed documentation, see: `SHAP_IMPLEMENTATION.md`

For model details, see: `README.md` and `ARCHITECTURE.md`
