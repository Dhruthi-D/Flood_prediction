import logging
from typing import List, Dict, Any
import numpy as np
from model_loader import predict

logger = logging.getLogger(__name__)


def _classify_risk(probability: float) -> str:
	"""Map probability to categorical risk."""
	if probability < 0.25:
		return "LOW"
	if probability < 0.50:
		return "MODERATE"
	if probability < 0.75:
		return "HIGH"
	return "CRITICAL"


def simulate_flood(input_data: Dict[str, Any], hours: int = 24) -> List[Dict[str, Any]]:
	"""
	Run the existing flood model once per simulated hour.

	- Accumulates rainfall over time (simple running total).
	- Slightly decreases pressure each hour to simulate storm progression.
	- Returns a timeline of probability and categorical risk per hour.
	"""
	# Extract and normalize inputs with safe defaults
	temperature = float(input_data.get("temperature", 0.0))
	temperature_max = float(input_data.get("temperature_max", temperature))
	temperature_min = float(input_data.get("temperature_min", temperature))
	pressure = float(input_data.get("pressure", 1013.0))
	base_rainfall = float(input_data.get("rainfall", 0.0))
	humidity = float(input_data.get("humidity", 0.0))
	wind_speed = float(input_data.get("wind_speed", 0.0))
	rain_anomaly = float(input_data.get("rain_anomaly", 0.0))
	temp_anomaly = float(input_data.get("temp_anomaly", 0.0))

	cumulative_rainfall = base_rainfall
	pressure_step = 0.5  # hPa per hour drop to represent mild pressure decline

	timeline: List[Dict[str, Any]] = []

	for hour in range(hours):
		features = np.array([[
			temperature,
			temperature_max,
			temperature_min,
			pressure,
			cumulative_rainfall,
			humidity,
			wind_speed,
			rain_anomaly,
			temp_anomaly
		]])

		probability = float(predict(features))
		risk_state = _classify_risk(probability)

		timeline.append({
			"hour": hour,
			"probability": probability,
			"risk_state": risk_state
		})

		# Update evolving conditions for next hour
		cumulative_rainfall += base_rainfall
		pressure = max(0.0, pressure - pressure_step)

	return timeline
