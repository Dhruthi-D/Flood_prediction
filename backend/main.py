from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import requests
import re
import logging
from datetime import datetime
from typing import List, Dict
from model_loader import predict, get_feature_importances, get_feature_names, explain_instance, explain_instance_shap
from simulation_engine import simulate_flood
from schemas import WeatherInput, PredictionOutput, LocationValidationRequest, LocationValidationResponse, PredictionInput, ChatRequest, ChatResponse
from city_loader import search_cities, city_exists
from multi_city_utils import get_multiple_cities_predictions, get_sample_cities
from chatbot_engine import get_chatbot

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
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

        # --------------------------------------------------
        # SHAP Explanation (for chatbot context)
        # --------------------------------------------------
        try:
            shap_explanation = explain_instance_shap(features)
        except:
            shap_explanation = None

        return {
            "probability": float(probability),
            "risk_level": risk_level,
            "shap_explanation": shap_explanation
        }
    except Exception as e:
        # Log exception with stack trace
        logger.exception("Error during prediction: %s", e)
        # Return HTTP error so frontend can show meaningful message
        raise HTTPException(status_code=500, detail="Prediction failed on server")


# --------------------------------------------------
# SHAP Explainability Endpoint
# --------------------------------------------------
@app.post("/explain")
def explain_prediction(data: WeatherInput):
    """
    Explain a single prediction using SHAP TreeExplainer.
    Returns base value, feature names, and SHAP values for the prediction.
    """
    logger.info("Received /explain request: %s", data.dict())

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
        # SHAP Explanation
        # --------------------------------------------------
        explanation = explain_instance_shap(features)
        return explanation

    except Exception as e:
        logger.exception("Error during SHAP explanation: %s", e)
        raise HTTPException(status_code=500, detail="Explainability failed on server")


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

    # Calculate features used in model
    t2m = weather["temperature"]
    t2m_max = weather["temperature"] + 2
    t2m_min = weather["temperature"] - 2
    
    features = np.array([[
        t2m,                                  # T2M
        t2m_max,                              # T2M_MAX
        t2m_min,                              # T2M_MIN
        weather["pressure"],                  # PS
        weather["rainfall"],                  # PRECTOTCORR
        weather["humidity"],                  # RH2M
        weather["wind_speed"],                # WS2M
        0.0,                                  # rain_anomaly
        0.0                                   # temp_anomaly
    ]])

    prob = predict(features)
    risk = classify_risk(prob)

    # Get SHAP explanation
    try:
        shap_explanation = explain_instance_shap(features)
    except:
        shap_explanation = None

    recommendations = {
        "Low": "No immediate action required",
        "Moderate": "Monitor conditions",
        "High": "Prepare emergency response",
        "Critical": "Issue evacuation warning"
    }

    return {
    "location": place,
    "probability": float(prob),
    "risk_level": risk,
    "recommendation": recommendations[risk],
    "shap_explanation": shap_explanation,
    "weather": {
        "temperature": weather["temperature"],
        "temperature_max": t2m_max,
        "temperature_min": t2m_min,
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
            "probability": float(prob),
            "risk": classify_risk(prob)
        })

    return {
        "location": place,
        "forecast": results
    }


@app.post("/simulate")
def simulate(data: PredictionInput):
    """Run model-driven flood simulation across hours and return timeline."""
    try:
        timeline = simulate_flood(data.model_dump())
        return {"timeline": timeline}
    except Exception as e:
        logger.exception("Simulation failed: %s", e)
        raise HTTPException(status_code=500, detail="Simulation failed on server")


# --------------------------------------------------
# Multi-City Endpoints
# --------------------------------------------------
@app.get("/multi-city/sample")
def get_sample_cities_endpoint(limit: int = Query(10, ge=1, le=100)):
    """
    Get a sample of cities for the multi-city map view.
    Returns city names with flood predictions.
    """
    try:
        city_names = get_sample_cities(limit=limit)
        predictions = get_multiple_cities_predictions(city_names)
        return {"cities": predictions}
    except Exception as e:
        logger.exception("Failed to get sample cities: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get sample cities")


@app.post("/multi-city/predictions")
def get_cities_predictions(data: dict):
    """
    Get flood predictions for a specific list of cities.
    
    Request body: {"cities": ["city1", "city2", ...]}
    """
    try:
        city_names = data.get("cities", [])
        if not city_names or not isinstance(city_names, list):
            raise HTTPException(status_code=400, detail="cities parameter must be a non-empty list")
        
        # Limit to 50 cities per request
        city_names = city_names[:50]
        predictions = get_multiple_cities_predictions(city_names)
        return {"cities": predictions}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get cities predictions: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get cities predictions")


# --------------------------------------------------
# Chatbot Endpoint - Explainability Assistant
# --------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest):
    """
    Explainability-focused chatbot endpoint.
    
    This endpoint provides interpretations and explanations of model outputs.
    It does NOT provide decision-making or authoritative guidance.
    
    Context can include:
    - prediction: Current prediction result
    - shap_explanation: SHAP values for feature contributions
    - simulation: Simulation (what-if) result
    - location: Location name for contextualization
    """
    try:
        logger.info("Received chat request: %s", request.message)
        
        # Get chatbot instance
        chatbot = get_chatbot()
        
        # Build context dictionary
        context = request.context or {}
        
        # Merge optional context fields
        if request.prediction:
            context["prediction"] = request.prediction
        if request.shap_explanation:
            context["shap_explanation"] = request.shap_explanation
        if request.simulation:
            context["simulation"] = request.simulation
        if request.location:
            context["location"] = request.location
        
        # Process query
        response = chatbot.process_query(request.message, context)
        
        # Add timestamp
        response["timestamp"] = datetime.now().isoformat()
        
        return ChatResponse(**response)
    
    except Exception as e:
        logger.exception("Error in chat endpoint: %s", e)
        raise HTTPException(status_code=500, detail="Chat processing failed on server")


@app.get("/chat/history")
def get_chat_history():
    """Get conversation history from the chatbot"""
    try:
        chatbot = get_chatbot()
        history = chatbot.get_conversation_history()
        return {"history": history}
    except Exception as e:
        logger.exception("Error retrieving chat history: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history")


@app.post("/chat/clear")
def clear_chat_history():
    """Clear conversation history"""
    try:
        chatbot = get_chatbot()
        chatbot.clear_history()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.exception("Error clearing chat history: %s", e)
        raise HTTPException(status_code=500, detail="Failed to clear chat history")


# --------------------------------------------------
# Heatmap Endpoints - Area Flood Risk
# --------------------------------------------------
def generate_grid_points(min_lat, min_lon, max_lat, max_lon, grid_size=64):
    lat_step = (max_lat - min_lat) / grid_size
    lon_step = (max_lon - min_lon) / grid_size

    points = []
    for i in range(grid_size):
        for j in range(grid_size):
            lat = min_lat + (i + 0.5) * lat_step
            lon = min_lon + (j + 0.5) * lon_step
            points.append((lat, lon))

    return points


@app.get("/area/heatmap")
def area_heatmap(
    center_lat: float,
    center_lon: float,
    radius_km: int = Query(50, ge=10, le=200),
    points: int = Query(25, ge=9, le=100)
):
    """
    Generate flood risk heatmap data for a selected area.
    Returns multiple lat/lon points with risk probabilities.
    """

    try:
        results = []

        # Generate grid around center
        grid_size = int(np.sqrt(points))
        lat_step = radius_km / 111 / grid_size
        lon_step = radius_km / (111 * np.cos(np.radians(center_lat))) / grid_size

        for i in range(-grid_size, grid_size + 1):
            for j in range(-grid_size, grid_size + 1):
                lat = center_lat + i * lat_step
                lon = center_lon + j * lon_step

                weather = fetch_live_weather(lat, lon)

                features = np.array([[ 
                    weather["temperature"],
                    weather["temperature"] + 2,
                    weather["temperature"] - 2,
                    weather["pressure"],
                    weather["rainfall"],
                    weather["humidity"],
                    weather["wind_speed"],
                    0.0,
                    0.0
                ]])

                prob = float(predict(features))

                results.append({
                    "lat": lat,
                    "lon": lon,
                    "intensity": prob
                })

        return {
            "center": {"lat": center_lat, "lon": center_lon},
            "radius_km": radius_km,
            "heatmap": results
        }

    except Exception as e:
        logger.exception("Heatmap generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Heatmap generation failed")


def interpolate_bilinear(lat: float, lon: float, corner_data: List, 
                         min_lat: float, max_lat: float, 
                         min_lon: float, max_lon: float) -> float:
    """
    Bilinear interpolation between 4 corners for smooth gradients
    """
    # Normalize coordinates to 0-1 range
    x = (lon - min_lon) / (max_lon - min_lon) if max_lon != min_lon else 0.5
    y = (lat - min_lat) / (max_lat - min_lat) if max_lat != min_lat else 0.5
    
    # Extract corner values
    # corner_data format: [(lat, lon, probability), ...]
    # Order: bottom-left, bottom-right, top-left, top-right
    v00 = corner_data[0][2]  # bottom-left
    v01 = corner_data[1][2]  # bottom-right
    v10 = corner_data[2][2]  # top-left
    v11 = corner_data[3][2]  # top-right
    
    # Bilinear interpolation formula
    value = (v00 * (1 - x) * (1 - y) +
             v01 * x * (1 - y) +
             v10 * (1 - x) * y +
             v11 * x * y)
    
    return value


def add_realistic_variation(value: float, noise_level: float = 0.05) -> float:
    """
    Add small random variation to make heatmap look more realistic
    """
    noise = np.random.normal(0, noise_level)
    return np.clip(value + noise, 0.0, 1.0)


@app.get("/area/heatmap/box")
def area_heatmap_box(
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    grid_size: int = 30
):
    """
    Generate flood risk heatmap for a bounding box area using interpolation for speed.
    """
    try:
        # STEP 1: Sample only 5 strategic points (FAST!)
        sample_points = [
            (min_lat, min_lon),                             # Bottom-left corner
            (min_lat, max_lon),                             # Bottom-right corner
            (max_lat, min_lon),                             # Top-left corner
            (max_lat, max_lon),                             # Top-right corner
            ((min_lat + max_lat)/2, (min_lon + max_lon)/2) # Center point
        ]
        
        sampled_data = []
        for lat, lon in sample_points:
            # Fetch weather data
            weather = fetch_live_weather(lat, lon)
            
            # Build model features
            features = np.array([[
                weather["temperature"],
                weather["temperature"] + 2,
                weather["temperature"] - 2,
                weather["pressure"],
                weather["rainfall"],
                weather["humidity"],
                weather["wind_speed"],
                0.0,
                0.0
            ]])
            
            # Get flood probability prediction
            probability = predict(features)
            sampled_data.append((lat, lon, float(probability)))
        
        # STEP 2: Use corner points for interpolation
        corner_data = sampled_data[:4]
        
        # STEP 3: Create dense grid with interpolation
        lat_step = (max_lat - min_lat) / grid_size
        lon_step = (max_lon - min_lon) / grid_size
        
        heatmap_points = []
        
        for i in range(grid_size):
            for j in range(grid_size):
                lat = min_lat + (i + 0.5) * lat_step
                lon = min_lon + (j + 0.5) * lon_step
                
                # Interpolate value from 4 corners
                interpolated_value = interpolate_bilinear(
                    lat, lon, corner_data, 
                    min_lat, max_lat, min_lon, max_lon
                )
                
                # Add slight realistic variation
                final_value = add_realistic_variation(interpolated_value, noise_level=0.03)
                
                heatmap_points.append({
                    "lat": round(lat, 6),
                    "lon": round(lon, 6),
                    "intensity": round(final_value, 4)
                })
        
        return {
            "success": True,
            "grid_size": f"{grid_size}x{grid_size}",
            "points": heatmap_points
        }
    
    except Exception as e:
        logger.exception("Heatmap interpolation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Heatmap generation failed: {str(e)}")
