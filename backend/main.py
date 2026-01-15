from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import requests
import re
import logging
from model_loader import predict, get_feature_importances, get_feature_names, explain_instance
from schemas import WeatherInput, PredictionOutput, LocationValidationRequest, LocationValidationResponse
from city_loader import search_cities, city_exists

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------------------------------------
# FastAPI App
# --------------------------------------------------
app = FastAPI(title="ML Flood Prediction System")

# --------------------------------------------------
# Enable CORS (React → FastAPI)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Risk Classification Logic
# --------------------------------------------------
def classify_risk(probability: float) -> str:
    if probability < 0.25:
        return "Low"
    elif probability < 0.50:
        return "Moderate"
    elif probability < 0.75:
        return "High"
    else:
        return "Critical"

# --------------------------------------------------
# Health Check
# --------------------------------------------------
@app.get("/")
def root():
    return {"status": "Flood Prediction API running"}

# --------------------------------------------------
# Flood Prediction Endpoint
# --------------------------------------------------
@app.post("/predict", response_model=PredictionOutput)
def predict_flood(data: WeatherInput):
    # Log incoming payload for debugging
    logger.info("Received /predict request: %s", data.dict())

    try:
        # --------------------------------------------------
        # Feature Vector (ORDER MUST MATCH TRAINING)
        # --------------------------------------------------
        features = np.array([[
            data.temperature,        # T2M
            data.temperature_max,    # T2M_MAX
            data.temperature_min,    # T2M_MIN
            data.pressure,           # PS
            data.rainfall,           # PRECTOTCORR
            data.humidity,           # RH2M
            data.wind_speed,         # WS2M
            data.rain_anomaly,       # rain_anomaly
            data.temp_anomaly        # temp_anomaly
        ]])

        # --------------------------------------------------
        # Model Prediction
        # --------------------------------------------------
        probability = predict(features)
        risk_level = classify_risk(probability)

        return {
            "probability": float(probability),
            "risk_level": risk_level
        }
    except Exception as e:
        # Log exception with stack trace
        logger.exception("Error during prediction: %s", e)
        # Return HTTP error so frontend can show meaningful message
        raise HTTPException(status_code=500, detail="Prediction failed on server")


# --------------------------------------------------
# City Search and Location Validation Endpoints
# --------------------------------------------------
@app.get("/cities")
def get_cities(query: str = Query(..., min_length=1, description="Search query for city names")):
    """
    Search cities by query (autocomplete endpoint).
    Returns up to 10 matching city names from Cities.csv.
    """
    try:
        results = search_cities(query, limit=10)
        return {"cities": results}
    except Exception as e:
        logger.exception("Error searching cities: %s", e)
        raise HTTPException(status_code=500, detail="Failed to search cities")


@app.post("/validate-location", response_model=LocationValidationResponse)
def validate_location(data: LocationValidationRequest):
    """
    Validate location input (either city name or coordinates).
    - City must exist in Cities.csv
    - Coordinates must be valid (latitude: -90 to 90, longitude: -180 to 180)
    """
    try:
        # Check if city is provided
        if data.city:
            city_name = data.city.strip()
            if city_exists(city_name):
                return LocationValidationResponse(
                    valid=True,
                    message=f"City '{city_name}' is valid",
                    location_type="city"
                )
            else:
                return LocationValidationResponse(
                    valid=False,
                    message=f"City '{city_name}' not found in database",
                    location_type="city"
                )
        
        # Check if coordinates are provided
        elif data.latitude is not None and data.longitude is not None:
            # Validation is already done by Pydantic validators
            return LocationValidationResponse(
                valid=True,
                message="Coordinates are valid",
                location_type="coordinates"
            )
        
        # This should not happen due to Pydantic validation, but just in case
        else:
            raise HTTPException(
                status_code=400,
                detail="Either city or coordinates must be provided"
            )
    
    except ValueError as e:
        # Handle Pydantic validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error validating location: %s", e)
        raise HTTPException(status_code=500, detail="Failed to validate location")


def fetch_live_weather(lat: float, lon: float):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,"
        "pressure_msl,wind_speed_10m,precipitation"
    )

    response = requests.get(url)
    data = response.json()["current"]

    return {
        "temperature": data["temperature_2m"],
        "humidity": data["relative_humidity_2m"],
        "pressure": data["pressure_msl"],
        "wind_speed": data["wind_speed_10m"],
        "rainfall": data["precipitation"]
    }


@app.get("/explainability")
def explainability_global():
    """Return global feature importances (normalized)."""
    mapping = get_feature_importances(normalize=True)
    items = [{"feature": k, "importance": v} for k, v in mapping.items()]
    return {"features": items}


@app.post("/explainability/instance")
def explain_instance_route(data: WeatherInput):
    """Return per-feature contributions for a provided input vector.
    Uses a simple heuristic based on normalized importances (no SHAP dependency).
    """
    try:
        features = [
            data.temperature,
            data.temperature_max,
            data.temperature_min,
            data.pressure,
            data.rainfall,
            data.humidity,
            data.wind_speed,
            data.rain_anomaly,
            data.temp_anomaly,
        ]

        contributions = explain_instance(features)
        prob = predict(np.array([features]))
        return {"probability": float(prob), "contributions": contributions}
    except Exception as e:
        logger.exception("Explainability error: %s", e)
        raise HTTPException(status_code=500, detail="Explainability failed on server")


def get_lat_lon(place: str):
    """
    Get latitude and longitude from a place name or coordinates.
    If place is in format "lat,lon", parse it directly.
    Otherwise, use geocoding API.
    """
    # Check if place is in coordinate format (e.g., "12.922, 77.505")
    coord_pattern = r'^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$'
    if re.match(coord_pattern, place.strip()):
        # Parse coordinates directly
        parts = [p.strip() for p in place.split(',')]
        if len(parts) == 2:
            try:
                lat = float(parts[0])
                lon = float(parts[1])
                # Validate ranges
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    return lat, lon
            except ValueError:
                pass
    
    # Use geocoding API for place names
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={place}&count=1"
    response = requests.get(url).json()

    if "results" not in response:
        return None

    location = response["results"][0]
    return location["latitude"], location["longitude"]

def fetch_3day_forecast(lat: float, lon: float):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&daily=temperature_2m_max,temperature_2m_min,"
        "precipitation_sum,wind_speed_10m_max,pressure_msl_mean"
        "&forecast_days=3"
    )

    response = requests.get(url)
    return response.json()["daily"]

@app.get("/predict/live")
def live_prediction(place: str):

    coords = get_lat_lon(place)
    if coords is None:
        return {"error": "Invalid location"}

    lat, lon = coords
    weather = fetch_live_weather(lat, lon)

    features = np.array([[
        weather["temperature"],              # T2M
        weather["temperature"] + 2,           # T2M_MAX
        weather["temperature"] - 2,           # T2M_MIN
        weather["pressure"],                  # PS
        weather["rainfall"],                  # PRECTOTCORR
        weather["humidity"],                  # RH2M
        weather["wind_speed"],                # WS2M
        0.0,                                  # rain_anomaly
        0.0                                   # temp_anomaly
    ]])

    prob = predict(features)
    risk = classify_risk(prob)

    recommendations = {
        "Low": "No immediate action required",
        "Moderate": "Monitor conditions",
        "High": "Prepare emergency response",
        "Critical": "Issue evacuation warning"
    }

    return {
    "location": place,
    "probability": round(float(prob), 3),
    "risk_level": risk,
    "recommendation": recommendations[risk],
    "weather": {
        "temperature": weather["temperature"],
        "rainfall": weather["rainfall"],
        "humidity": weather["humidity"],
        "pressure": weather["pressure"],
        "wind_speed": weather["wind_speed"]
    }
}
@app.get("/forecast/3day")
def forecast_3day(place: str):

    coords = get_lat_lon(place)
    if coords is None:
        return {"error": "Invalid location"}

    lat, lon = coords
    forecast = fetch_3day_forecast(lat, lon)
    results = []

    for i in range(3):
        features = np.array([[
            (forecast["temperature_2m_max"][i] +
             forecast["temperature_2m_min"][i]) / 2,
            forecast["temperature_2m_max"][i],
            forecast["temperature_2m_min"][i],
            forecast["pressure_msl_mean"][i],
            forecast["precipitation_sum"][i],
            70,
            forecast["wind_speed_10m_max"][i],
            0.0,
            0.0
        ]])

        prob = predict(features)

        results.append({
            "day": f"Day {i+1}",
            "probability": round(float(prob), 3),
            "risk": classify_risk(prob)
        })

    return {
        "location": place,
        "forecast": results
    }
