from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Union, Dict, Any, List

class WeatherInput(BaseModel):
    # Core weather inputs
    temperature: float        # T2M
    temperature_max: float    # T2M_MAX
    temperature_min: float    # T2M_MIN
    pressure: float           # PS
    rainfall: float           # PRECTOTCORR
    humidity: float           # RH2M
    wind_speed: float         # WS2M

    # Derived / anomaly features (optional for now)
    rain_anomaly: float = 0.0
    temp_anomaly: float = 0.0

class PredictionOutput(BaseModel):
    probability: float
    risk_level: str
    shap_explanation: Optional[Dict[str, Any]] = None


class LocationValidationRequest(BaseModel):
    """Request model for location validation - accepts either city or coordinates"""
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v):
        if v is not None:
            if not (-90 <= v <= 90):
                raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v):
        if v is not None:
            if not (-180 <= v <= 180):
                raise ValueError('Longitude must be between -180 and 180')
        return v
    
    @model_validator(mode='after')
    def validate_exactly_one(self):
        """Ensure either city OR coordinates are provided, not both"""
        city = self.city
        lat = self.latitude
        lon = self.longitude
        
        has_city = city is not None and str(city).strip() != ""
        has_coords = lat is not None and lon is not None
        
        if not has_city and not has_coords:
            raise ValueError('Either city or coordinates (latitude and longitude) must be provided')
        if has_city and has_coords:
            raise ValueError('Cannot provide both city and coordinates. Use either city OR coordinates.')
        
        return self


class LocationValidationResponse(BaseModel):
    """Response model for location validation"""
    valid: bool
    message: str
    location_type: Optional[str] = None  # "city" or "coordinates"


# Alias for backward compatibility with earlier naming
PredictionInput = WeatherInput


# Chatbot schemas
class ChatMessage(BaseModel):
    """A single chat message"""
    role: str  # "user" or "assistant"
    message: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Request model for chatbot queries"""
    message: str
    context: Optional[Dict[str, Any]] = None
    
    # Optional context components
    prediction: Optional[Dict[str, Any]] = None
    shap_explanation: Optional[Dict[str, Any]] = None
    simulation: Optional[Dict[str, Any]] = None
    location: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chatbot queries"""
    message: str
    type: str  # Type of response (e.g., "shap_explanation", "prediction_explanation")
    confidence: float
    data: Optional[Dict[str, Any]] = None
    timestamp: str
