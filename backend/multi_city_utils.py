"""
Multi-city utilities for flood risk visualization
Provides functions to get city data with flood predictions
"""
import re
import requests
import pandas as pd
import logging
from pathlib import Path
from typing import List, Dict, Any
from city_loader import load_cities, search_cities
from model_loader import predict
import numpy as np

logger = logging.getLogger(__name__)

# Cache for city coordinates (geocoded on demand)
_coordinates_cache: Dict[str, tuple] = {}

# Path to Cities.csv
CSV_PATH = Path(__file__).parent.parent / "Cities.csv"


def get_city_coordinates(city_name: str) -> tuple:
    """
    Get latitude and longitude for a city using geocoding API.
    Results are cached to avoid repeated API calls.
    
    Args:
        city_name: Name of the city
    
    Returns:
        Tuple of (latitude, longitude) or None if not found
    """
    # Check cache first
    if city_name in _coordinates_cache:
        return _coordinates_cache[city_name]
    
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if "results" in data and len(data["results"]) > 0:
            location = data["results"][0]
            coords = (location["latitude"], location["longitude"])
            _coordinates_cache[city_name] = coords
            return coords
    except Exception as e:
        logger.warning(f"Failed to geocode city {city_name}: {e}")
    
    return None


def fetch_live_weather_for_city(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch live weather for given coordinates.
    
    Args:
        lat: Latitude
        lon: Longitude
    
    Returns:
        Dictionary with weather data
    """
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            "&current=temperature_2m,relative_humidity_2m,"
            "pressure_msl,wind_speed_10m,precipitation"
        )
        
        response = requests.get(url, timeout=5)
        data = response.json()["current"]
        
        return {
            "temperature": data["temperature_2m"],
            "humidity": data["relative_humidity_2m"],
            "pressure": data["pressure_msl"],
            "wind_speed": data["wind_speed_10m"],
            "rainfall": data["precipitation"]
        }
    except Exception as e:
        logger.warning(f"Failed to fetch weather for {lat},{lon}: {e}")
        return {
            "temperature": 25.0,
            "humidity": 70.0,
            "pressure": 1013.0,
            "wind_speed": 5.0,
            "rainfall": 0.0
        }


def get_flood_prediction_for_city(city_name: str) -> Dict[str, Any]:
    """
    Get flood prediction for a city using live weather data.
    Also accepts coordinates in format "lat,lon".
    
    Args:
        city_name: Name of the city or coordinates in format "lat,lon"
    
    Returns:
        Dictionary with prediction data including probability and risk level
    """
    # Check if city_name is in coordinate format (e.g., "12.922, 77.505")
    coord_pattern = r'^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$'
    coords = None
    
    if re.match(coord_pattern, city_name.strip()):
        # Parse coordinates directly
        parts = [p.strip() for p in city_name.split(',')]
        if len(parts) == 2:
            try:
                lat = float(parts[0])
                lon = float(parts[1])
                # Validate ranges
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    coords = (lat, lon)
                    city_name = f"Location ({lat:.4f}, {lon:.4f})"
            except ValueError:
                pass
    
    # If not coordinates, try geocoding
    if coords is None:
        coords = get_city_coordinates(city_name)
    
    if not coords:
        return {
            "city": city_name,
            "latitude": None,
            "longitude": None,
            "probability": 0.0,
            "risk_level": "Unknown",
            "error": "Could not find city coordinates"
        }
    
    lat, lon = coords
    weather = fetch_live_weather_for_city(lat, lon)
    
    # Build feature vector for prediction
    features = np.array([[
        weather["temperature"],
        weather["temperature"] + 2,  # T2M_MAX
        weather["temperature"] - 2,  # T2M_MIN
        weather["pressure"],
        weather["rainfall"],
        weather["humidity"],
        weather["wind_speed"],
        0.0,  # rain_anomaly
        0.0   # temp_anomaly
    ]])
    
    probability = float(predict(features))
    
    # Classify risk
    if probability < 0.25:
        risk_level = "Low"
    elif probability < 0.50:
        risk_level = "Moderate"
    elif probability < 0.75:
        risk_level = "High"
    else:
        risk_level = "Critical"
    
    return {
        "city": city_name,
        "latitude": lat,
        "longitude": lon,
        "probability": round(probability, 3),
        "risk_level": risk_level,
        "weather": weather
    }


def get_multiple_cities_predictions(city_names: List[str]) -> List[Dict[str, Any]]:
    """
    Get flood predictions for multiple cities.
    
    Args:
        city_names: List of city names
    
    Returns:
        List of city prediction data
    """
    results = []
    for city_name in city_names:
        try:
            prediction = get_flood_prediction_for_city(city_name)
            results.append(prediction)
        except Exception as e:
            logger.error(f"Error getting prediction for {city_name}: {e}")
            results.append({
                "city": city_name,
                "latitude": None,
                "longitude": None,
                "probability": 0.0,
                "risk_level": "Unknown",
                "error": str(e)
            })
    
    return results


def get_sample_cities(limit: int = 10) -> List[str]:
    """
    Get a sample of cities from the CSV for the multi-city view.
    
    Args:
        limit: Number of cities to return
    
    Returns:
        List of city names
    """
    try:
        df = pd.read_csv(CSV_PATH)
        
        if 'Name' not in df.columns:
            return []
        
        # Get unique cities and sample
        cities = df['Name'].dropna().unique().tolist()
        cities = [str(c).strip() for c in cities if str(c).strip()]
        
        # Remove duplicates (case-insensitive)
        seen = set()
        unique_cities = []
        for city in cities:
            city_lower = city.lower()
            if city_lower not in seen:
                seen.add(city_lower)
                unique_cities.append(city)
        
        # Return sample (evenly distributed)
        step = max(1, len(unique_cities) // limit)
        return unique_cities[::step][:limit]
    
    except Exception as e:
        logger.error(f"Failed to get sample cities: {e}")
        return []
