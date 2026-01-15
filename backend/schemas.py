from pydantic import BaseModel
from pydantic import BaseModel

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
