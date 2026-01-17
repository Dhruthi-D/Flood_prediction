"""
Explainability-Focused Chatbot Engine
This module provides contextual explanations and interpretations of flood prediction results.
It does NOT provide decision-making or authoritative guidance.
"""

import logging
from typing import Dict, List, Optional, Any
import random
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)


class FloodInsightChatbot:
    """
    Flood Risk Insight Assistant - Explains model outputs, SHAP values, 
    and contextualizes predictions with external information.
    
    This is NOT a decision-making system. It only provides interpretations
    and contextual awareness.
    """
    
    def __init__(self):
        self.conversation_history = []
        
        # Feature name mappings for better explanation
        self.feature_names = {
            "temperature": "Temperature (°C)",
            "temperature_max": "Maximum Temperature (°C)",
            "temperature_min": "Minimum Temperature (°C)",
            "pressure": "Atmospheric Pressure (kPa)",
            "rainfall": "Rainfall (mm)",
            "humidity": "Relative Humidity (%)",
            "wind_speed": "Wind Speed (m/s)",
            "rain_anomaly": "Rainfall Anomaly",
            "temp_anomaly": "Temperature Anomaly"
        }
        
    def process_query(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a user query and return an explanatory response.
        
        Args:
            user_message: The user's question
            context: Optional context including prediction, shap_values, simulation, etc.
        
        Returns:
            Dictionary with response and metadata
        """
        user_message_lower = user_message.lower()
        
        # Store in history
        self.conversation_history.append({
            "role": "user",
            "message": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Route to appropriate handler
        response = self._generate_response(user_message_lower, context or {})
        
        # Store response
        self.conversation_history.append({
            "role": "assistant",
            "message": response["message"],
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def _generate_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate appropriate response based on query type and available context"""
        
        # Safety check - refuse decision-making queries
        if self._is_decision_query(query):
            return {
                "message": self._get_safety_disclaimer(),
                "type": "safety_disclaimer",
                "confidence": 1.0
            }
        
        # Check if user is asking about a specific place
        location_query = self._extract_location_query(query)
        if location_query:
            return self._handle_location_query(location_query, context)
        
        # Route to specific handlers
        if any(word in query for word in ["shap", "feature", "contribute", "important", "influence"]):
            return self._explain_shap(context)
        
        elif any(word in query for word in ["why", "reason", "cause"]):
            return self._explain_reasons(context)
        
        elif any(word in query for word in ["simulation", "what if", "scenario", "hypothetical"]):
            return self._explain_simulation(context)
        
        elif any(word in query for word in ["prediction", "forecast", "risk"]):
            return self._explain_prediction(context)
        
        elif any(word in query for word in ["external", "news", "context", "recent", "public"]):
            return self._provide_external_context(context)
        
        elif any(word in query for word in ["compare", "difference", "versus", "vs"]):
            return self._compare_results(context)
        
        elif any(word in query for word in ["hello", "hi", "help", "what can you"]):
            return self._get_welcome_message()
        
        else:
            return self._general_response(query, context)
    
    def _extract_location_query(self, query: str) -> Optional[str]:
        """
        Extract location name from query like:
        'What about Mumbai?', 'Tell me about Delhi', 'Show data for Chennai', etc.
        Returns the location name if found, else None
        """
        location_patterns = [
            r"what about\s+([a-zA-Z\s]+)",
            r"tell\s+(?:me\s+)?about\s+([a-zA-Z\s]+)",
            r"show.*?for\s+([a-zA-Z\s]+)",
            r"give.*?for\s+([a-zA-Z\s]+)",
            r"(?:flood\s+)?risk in\s+([a-zA-Z\s]+)",
            r"forecast for\s+([a-zA-Z\s]+)",
            r"prediction for\s+([a-zA-Z\s]+)",
            r"analysis (?:of|for)\s+([a-zA-Z\s]+)",
            r"(?:what's|how's) (?:the )?(?:flood )?risk in\s+([a-zA-Z\s]+)",
            r"data (?:for|of|on)\s+([a-zA-Z\s]+)"
        ]
        
        query_lower = query.lower().strip()
        
        import re
        for pattern in location_patterns:
            match = re.search(pattern, query_lower)
            if match:
                location = match.group(1).strip()
                # Remove trailing punctuation
                location = re.sub(r'[?!.,;]+$', '', location).strip()
                # Filter out common non-location words
                if location and len(location) > 1 and location not in ["the area", "my area", "this area", "here"]:
                    return location
        
        return None
    
    def _handle_location_query(self, location: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle user asking about a specific location.
        Fetches live data and returns comprehensive analysis.
        """
        from main import get_lat_lon, fetch_live_weather, classify_risk
        from model_loader import predict, explain_instance_shap
        
        explanation = f"**Flood Risk Analysis for {location.title()}**\n\n"
        
        try:
            # Get coordinates
            coords = get_lat_lon(location)
            if coords is None:
                explanation += f"❌ Unable to find location '{location.title()}'. Please check the spelling or try:\n"
                explanation += "• Using a more specific name (e.g., 'Mumbai, India')\n"
                explanation += "• Selecting the location from the Location Selector in the dashboard\n"
                return {
                    "message": explanation,
                    "type": "location_query",
                    "confidence": 0.3,
                    "data": {"location": location, "status": "location_not_found"}
                }
            
            lat, lon = coords
            
            # Fetch weather data
            weather = fetch_live_weather(lat, lon)
            
            # Calculate features
            t2m = weather["temperature"]
            t2m_max = weather["temperature"] + 2
            t2m_min = weather["temperature"] - 2
            
            features = np.array([[
                t2m,                      # T2M
                t2m_max,                  # T2M_MAX
                t2m_min,                  # T2M_MIN
                weather["pressure"],      # PS
                weather["rainfall"],      # PRECTOTCORR
                weather["humidity"],      # RH2M
                weather["wind_speed"],    # WS2M
                0.0,                      # rain_anomaly
                0.0                       # temp_anomaly
            ]])
            
            # Get prediction
            prob = float(predict(features))
            risk = classify_risk(prob)
            
            # Get SHAP explanation
            shap_explanation = explain_instance_shap(features)
            shap_values = shap_explanation.get("shap_values", [])
            feature_names = shap_explanation.get("feature_names", [])
            
            # Build comprehensive response
            explanation += f"📍 **Location**: {location.title()} ({lat:.2f}°N, {lon:.2f}°E)\n\n"
            
            explanation += "---\n\n"
            explanation += "## 🌊 Flood Risk Assessment\n\n"
            explanation += f"**Probability**: {prob:.1%}\n"
            explanation += f"**Risk Level**: **{risk}**\n\n"
            
            # Risk interpretation
            if risk == "Critical":
                explanation += "⚠️ **CRITICAL RISK** - Conditions are highly favorable for flooding. Multiple weather factors indicate severe flood potential.\n\n"
            elif risk == "High":
                explanation += "🔴 **HIGH RISK** - Significant flood potential exists. Weather conditions show elevated risk factors.\n\n"
            elif risk == "Moderate":
                explanation += "🟡 **MODERATE RISK** - Some flood potential present. Conditions warrant monitoring.\n\n"
            else:
                explanation += "🟢 **LOW RISK** - Current conditions are generally unfavorable for flooding.\n\n"
            
            explanation += "---\n\n"
            explanation += "## 🌤️ Current Weather Conditions\n\n"
            explanation += f"• **Temperature**: {t2m:.1f}°C (max: {t2m_max:.1f}°C, min: {t2m_min:.1f}°C)\n"
            explanation += f"• **Rainfall**: {weather['rainfall']:.1f} mm\n"
            explanation += f"• **Humidity**: {weather['humidity']:.1f}%\n"
            explanation += f"• **Pressure**: {weather['pressure']:.1f} kPa\n"
            explanation += f"• **Wind Speed**: {weather['wind_speed']:.1f} m/s\n\n"
            
            explanation += "---\n\n"
            explanation += "## 📊 Feature Contribution Analysis (SHAP)\n\n"
            
            if shap_values and feature_names:
                # Find top contributing features
                feature_impacts = list(zip(feature_names, shap_values))
                feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
                top_features = feature_impacts[:5]
                
                explanation += "**Top factors influencing the flood risk prediction:**\n\n"
                
                for i, (feature, value) in enumerate(top_features, 1):
                    feature_display = self.feature_names.get(feature, feature)
                    direction = "increasing" if value > 0 else "decreasing"
                    impact = "strongly" if abs(value) > 0.1 else "moderately" if abs(value) > 0.05 else "slightly"
                    emoji = "🔺" if value > 0 else "🔻"
                    
                    explanation += f"{i}. {emoji} **{feature_display}**: {impact} {direction} risk (SHAP: {value:+.3f})\n"
                
                explanation += "\n*SHAP values show how much each weather parameter pushed the prediction away from the baseline.*\n\n"
            
            explanation += "---\n\n"
            explanation += "## 💡 What This Means\n\n"
            explanation += "This analysis is based on:\n"
            explanation += "• Real-time weather data from meteorological services\n"
            explanation += "• Machine learning model trained on historical flood patterns\n"
            explanation += "• Feature importance analysis using SHAP (SHapley Additive exPlanations)\n\n"
            
            explanation += "**Remember**: This is a risk interpretation tool, not an official warning system. "
            explanation += "Always consult local emergency services and official weather alerts for action guidance.\n\n"
            
            explanation += "---\n\n"
            explanation += "**Ask me more questions** like:\n"
            explanation += "• 'Why is the risk at this level?'\n"
            explanation += "• 'Which feature contributed most?'\n"
            explanation += "• 'How does rainfall affect the prediction?'\n"
            
            return {
                "message": explanation,
                "type": "location_query",
                "confidence": 0.95,
                "data": {
                    "location": location,
                    "coordinates": {"latitude": lat, "longitude": lon},
                    "probability": prob,
                    "risk_level": risk,
                    "weather": weather,
                    "shap_explanation": shap_explanation,
                    "status": "success"
                }
            }
            
        except Exception as e:
            logger.exception(f"Error fetching data for location {location}: {e}")
            explanation += f"❌ **Error**: Unable to fetch data for {location.title()}.\n\n"
            explanation += "This could be due to:\n"
            explanation += "• Network connectivity issues\n"
            explanation += "• Weather service unavailability\n"
            explanation += "• Invalid location name\n\n"
            explanation += "Please try:\n"
            explanation += "• Checking your spelling\n"
            explanation += "• Using the Location Selector in the dashboard\n"
            explanation += "• Trying again in a few moments\n"
            
            return {
                "message": explanation,
                "type": "location_query",
                "confidence": 0.2,
                "data": {
                    "location": location,
                    "status": "error",
                    "error": str(e)
                }
            }
    
    def _is_decision_query(self, query: str) -> bool:
        """Detect if user is asking for decisions/actions"""
        decision_keywords = [
            "should i evacuate", "should we evacuate", "tell me what to do",
            "what action", "what should i do", "what should we do",
            "allocate", "deploy", "command", "order", "authorize"
        ]
        return any(keyword in query for keyword in decision_keywords)
    
    def _get_safety_disclaimer(self) -> str:
        """Return safety disclaimer for inappropriate queries"""
        return (
            "I'm an explainability assistant designed to help you understand flood risk predictions, "
            "not to provide authoritative guidance or decisions. For evacuation orders, resource allocation, "
            "or emergency actions, please consult official authorities and emergency management services. "
            "\n\nI can help you understand:\n"
            "• Why the model predicts certain risk levels\n"
            "• Which features contribute most to predictions\n"
            "• How simulation scenarios differ from predictions\n"
            "• Contextual information from public sources"
        )
    
    def _explain_shap(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Explain SHAP values and feature contributions"""
        shap_data = context.get("shap_explanation")
        prediction = context.get("prediction")
        
        if not shap_data:
            return {
                "message": "SHAP explanation data is not available for this query. Please ensure you've run a prediction first.",
                "type": "shap_explanation",
                "confidence": 0.5
            }
        
        # Extract SHAP values and feature names
        shap_values = shap_data.get("shap_values", [])
        feature_names = shap_data.get("feature_names", [])
        base_value = shap_data.get("base_value", 0.5)
        
        if not shap_values or not feature_names:
            return {
                "message": "Unable to interpret SHAP data. The explanation structure may be incomplete.",
                "type": "shap_explanation",
                "confidence": 0.3
            }
        
        # Find top contributing features
        feature_impacts = list(zip(feature_names, shap_values))
        feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
        top_features = feature_impacts[:3]
        
        # Build explanation
        prob = prediction.get("probability", 0) if prediction else None
        risk = prediction.get("risk_level", "Unknown") if prediction else "Unknown"
        
        explanation = f"**Feature Contribution Analysis (SHAP)**\n\n"
        
        if prob is not None:
            explanation += f"The model predicts a flood probability of **{prob:.1%}** (Risk: **{risk}**).\n\n"
        
        explanation += f"Starting from a baseline probability of {base_value:.1%}, here's how each feature influenced the prediction:\n\n"
        
        for feature, value in top_features:
            feature_display = self.feature_names.get(feature, feature)
            direction = "increased" if value > 0 else "decreased"
            impact = "strong" if abs(value) > 0.1 else "moderate" if abs(value) > 0.05 else "slight"
            
            explanation += f"• **{feature_display}**: {impact} {direction} flood risk (SHAP: {value:+.3f})\n"
        
        explanation += "\n**Interpretation Note**: SHAP values show how much each feature pushed the prediction away from the baseline. "
        explanation += "Positive values increase flood risk, negative values decrease it."
        
        return {
            "message": explanation,
            "type": "shap_explanation",
            "confidence": 0.9,
            "data": {
                "top_features": [{"feature": f, "shap_value": v} for f, v in top_features]
            }
        }
    
    def _explain_reasons(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Explain reasons for prediction outcome"""
        prediction = context.get("prediction")
        shap_data = context.get("shap_explanation")
        
        if not prediction:
            return {
                "message": "I need prediction data to explain the reasons. Please run a prediction first.",
                "type": "reason_explanation",
                "confidence": 0.5
            }
        
        prob = prediction.get("probability", 0)
        risk = prediction.get("risk_level", "Unknown")
        
        explanation = f"**Why is the flood risk {risk}?**\n\n"
        
        # Risk level explanation
        if risk == "Critical":
            explanation += "The model indicates **critical** flood risk (>75% probability). "
            explanation += "This suggests that current weather conditions are highly conducive to flooding.\n\n"
        elif risk == "High":
            explanation += "The model indicates **high** flood risk (50-75% probability). "
            explanation += "Multiple weather factors are contributing to elevated flood potential.\n\n"
        elif risk == "Moderate":
            explanation += "The model indicates **moderate** flood risk (25-50% probability). "
            explanation += "Some weather conditions favor flooding, but others may be mitigating factors.\n\n"
        else:
            explanation += "The model indicates **low** flood risk (<25% probability). "
            explanation += "Current weather conditions are generally unfavorable for flooding.\n\n"
        
        # Add SHAP insights if available
        if shap_data:
            shap_values = shap_data.get("shap_values", [])
            feature_names = shap_data.get("feature_names", [])
            
            if shap_values and feature_names:
                feature_impacts = list(zip(feature_names, shap_values))
                feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
                
                explanation += "**Key Contributing Factors**:\n"
                for feature, value in feature_impacts[:3]:
                    feature_display = self.feature_names.get(feature, feature)
                    if abs(value) > 0.01:
                        if value > 0:
                            explanation += f"• {feature_display} is elevating flood risk\n"
                        else:
                            explanation += f"• {feature_display} is reducing flood risk\n"
        
        explanation += "\n*Note: This is a risk interpretation based on ML model outputs, not an official flood warning.*"
        
        return {
            "message": explanation,
            "type": "reason_explanation",
            "confidence": 0.85
        }
    
    def _explain_simulation(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Explain simulation (what-if scenario) results"""
        simulation = context.get("simulation")
        prediction = context.get("prediction")
        
        if not simulation:
            return {
                "message": (
                    "Simulation data is not available. Simulations allow you to explore 'what-if' scenarios by "
                    "adjusting weather parameters and observing how they affect flood risk predictions. "
                    "\n\nYou can run simulations from the Simulation tab in the dashboard."
                ),
                "type": "simulation_explanation",
                "confidence": 0.6
            }
        
        sim_prob = simulation.get("probability", 0)
        sim_risk = simulation.get("risk_level", "Unknown")
        
        explanation = f"**Simulation (What-If Scenario) Interpretation**\n\n"
        explanation += f"Your hypothetical scenario predicts a flood probability of **{sim_prob:.1%}** (Risk: **{sim_risk}**).\n\n"
        
        # Compare with actual prediction if available
        if prediction:
            pred_prob = prediction.get("probability", 0)
            pred_risk = prediction.get("risk_level", "Unknown")
            
            diff = sim_prob - pred_prob
            
            explanation += f"**Comparison with Current Prediction**:\n"
            explanation += f"• Current prediction: {pred_prob:.1%} ({pred_risk})\n"
            explanation += f"• Simulation scenario: {sim_prob:.1%} ({sim_risk})\n"
            explanation += f"• Difference: {diff:+.1%}\n\n"
            
            if abs(diff) > 0.1:
                if diff > 0:
                    explanation += "The simulation scenario shows **higher** flood risk compared to current conditions. "
                    explanation += "This suggests your hypothetical weather changes would increase flood likelihood.\n"
                else:
                    explanation += "The simulation scenario shows **lower** flood risk compared to current conditions. "
                    explanation += "This suggests your hypothetical weather changes would decrease flood likelihood.\n"
            else:
                explanation += "The simulation result is similar to current predictions. "
                explanation += "Your scenario changes have relatively minor impact on flood risk.\n"
        else:
            explanation += "This is a hypothetical scenario exploring how specific weather conditions might affect flood risk.\n"
        
        explanation += "\n*Important: Simulations are exploratory tools for understanding model behavior, not real predictions.*"
        
        return {
            "message": explanation,
            "type": "simulation_explanation",
            "confidence": 0.88
        }
    
    def _explain_prediction(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Explain current prediction"""
        prediction = context.get("prediction")
        location = context.get("location", "the selected area")
        
        if not prediction:
            return {
                "message": (
                    "No prediction data is currently available. To get a flood risk prediction:\n"
                    "1. Select a location (city or coordinates)\n"
                    "2. Click 'Get Live Prediction' for real-time weather\n"
                    "3. Or enter custom weather parameters for analysis"
                ),
                "type": "prediction_explanation",
                "confidence": 0.5
            }
        
        prob = prediction.get("probability", 0)
        risk = prediction.get("risk_level", "Unknown")
        
        explanation = f"**Current Flood Risk Prediction for {location}**\n\n"
        explanation += f"• **Probability**: {prob:.1%}\n"
        explanation += f"• **Risk Level**: {risk}\n\n"
        
        # Contextual interpretation
        if risk == "Critical":
            explanation += "**Risk Interpretation**: Critical risk indicates conditions are highly favorable for flooding. "
            explanation += "The model has identified a strong combination of weather factors that historically correlate with flood events.\n\n"
        elif risk == "High":
            explanation += "**Risk Interpretation**: High risk suggests significant flood potential. "
            explanation += "Multiple weather parameters are showing elevated values associated with flooding.\n\n"
        elif risk == "Moderate":
            explanation += "**Risk Interpretation**: Moderate risk indicates some flood potential exists. "
            explanation += "Certain conditions favor flooding while others may be protective.\n\n"
        else:
            explanation += "**Risk Interpretation**: Low risk suggests conditions are generally unfavorable for flooding. "
            explanation += "Current weather parameters do not strongly align with historical flood patterns.\n\n"
        
        explanation += "**What this means**: This is a machine learning interpretation of current weather conditions "
        explanation += "based on historical flood patterns. It should be considered alongside official weather warnings "
        explanation += "and local emergency guidance."
        
        return {
            "message": explanation,
            "type": "prediction_explanation",
            "confidence": 0.85
        }
    
    def _provide_external_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Provide external context awareness (simulated public information)"""
        location = context.get("location", "the area")
        prediction = context.get("prediction")
        
        # In a real implementation, this would fetch actual news, weather alerts, etc.
        # For now, we provide simulated contextual information
        
        explanation = f"**External Context Awareness for {location}**\n\n"
        explanation += "*Note: This feature demonstrates contextual awareness. In production, this would integrate with:*\n"
        explanation += "• Public weather service alerts\n"
        explanation += "• News aggregation APIs\n"
        explanation += "• Historical flood databases\n"
        explanation += "• Social media monitoring (verified sources)\n\n"
        
        # Simulated contextual information
        contexts = self._get_simulated_context(prediction)
        
        explanation += "**Simulated Public Context**:\n\n"
        for ctx in contexts:
            explanation += f"• {ctx}\n"
        
        explanation += "\n**Important Disclaimer**: External context is provided for situational awareness only. "
        explanation += "Always verify information through official sources and follow guidance from local authorities."
        
        return {
            "message": explanation,
            "type": "external_context",
            "confidence": 0.7
        }
    
    def _get_simulated_context(self, prediction: Optional[Dict]) -> List[str]:
        """Generate simulated external context based on prediction"""
        contexts = []
        
        if prediction:
            risk = prediction.get("risk_level", "Unknown")
            
            if risk in ["Critical", "High"]:
                contexts.extend([
                    "Public weather services have issued heavy rainfall advisories for the region",
                    "Historical records indicate similar conditions have led to localized flooding in the past",
                    "Soil moisture levels are reported to be elevated in nearby monitoring stations"
                ])
            elif risk == "Moderate":
                contexts.extend([
                    "Weather conditions are within normal seasonal ranges for this region",
                    "Drainage infrastructure is functioning normally according to municipal reports",
                    "Recent precipitation has been moderate with no immediate concerns noted"
                ])
            else:
                contexts.extend([
                    "Current weather conditions are favorable with low precipitation",
                    "No weather warnings or advisories are in effect for the region",
                    "Historical data shows low flood frequency under similar conditions"
                ])
        else:
            contexts.append("Contextual information will be available once a prediction is made")
        
        return contexts
    
    def _compare_results(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Compare prediction vs simulation results"""
        prediction = context.get("prediction")
        simulation = context.get("simulation")
        
        if not prediction and not simulation:
            return {
                "message": "I need both prediction and simulation data to make comparisons. Please run predictions or simulations first.",
                "type": "comparison",
                "confidence": 0.5
            }
        
        explanation = "**Prediction vs Simulation Comparison**\n\n"
        
        if prediction and not simulation:
            explanation += "Only prediction data is available. Run a simulation to compare hypothetical scenarios."
        elif simulation and not prediction:
            explanation += "Only simulation data is available. Get a live prediction to compare with current conditions."
        else:
            pred_prob = prediction.get("probability", 0)
            pred_risk = prediction.get("risk_level", "Unknown")
            sim_prob = simulation.get("probability", 0)
            sim_risk = simulation.get("risk_level", "Unknown")
            
            explanation += f"**Current Prediction** (Real/Estimated Weather):\n"
            explanation += f"• Probability: {pred_prob:.1%}\n"
            explanation += f"• Risk Level: {pred_risk}\n\n"
            
            explanation += f"**Simulation Scenario** (Hypothetical):\n"
            explanation += f"• Probability: {sim_prob:.1%}\n"
            explanation += f"• Risk Level: {sim_risk}\n\n"
            
            diff = sim_prob - pred_prob
            explanation += f"**Difference**: {diff:+.1%}\n\n"
            
            if abs(diff) > 0.15:
                explanation += "**Interpretation**: There is a **significant difference** between the prediction and simulation. "
                if diff > 0:
                    explanation += "The simulation scenario indicates higher flood risk than current conditions."
                else:
                    explanation += "The simulation scenario indicates lower flood risk than current conditions."
            else:
                explanation += "**Interpretation**: The prediction and simulation show **similar results**. "
                explanation += "The hypothetical changes have limited impact on flood risk."
        
        return {
            "message": explanation,
            "type": "comparison",
            "confidence": 0.85
        }
    
    def _get_welcome_message(self) -> Dict[str, Any]:
        """Return welcome/help message"""
        message = """**Welcome to the Flood Risk Insight Assistant** 🌊

I'm here to help you understand flood predictions and model explanations. You can:

**Ask About a Specific Location**:
• "What about Mumbai?"
• "Tell me about flood risk in Delhi"
• "Show data for Chennai"
• "How's the flood risk in Bangalore?"

Once you ask about a location, I'll guide you to get comprehensive predictions and analysis.

**Ask About Predictions**:
• "Why is the flood risk high?"
• "What is the current prediction?"
• "How accurate is this prediction?"

**Ask About Feature Contributions**:
• "Which features contributed most?"
• "Explain the SHAP values"
• "Why did rainfall influence the result?"

**Ask About Simulations**:
• "How does this simulation differ from the prediction?"
• "What if scenarios can I explore?"

**Ask About Context**:
• "What external information is available?"
• "Are there any recent weather alerts?"

**Important Limitations**:
⚠️ I provide **interpretations and explanations only**
⚠️ I do NOT provide evacuation instructions or authoritative guidance
⚠️ Always consult official emergency services for action decisions

How can I help you understand the flood predictions today?
"""
        return {
            "message": message,
            "type": "welcome",
            "confidence": 1.0
        }
    
    def _general_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general queries"""
        message = (
            "I can help you understand flood risk predictions and model explanations. "
            "Try asking about:\n"
            "• Current predictions or risk levels\n"
            "• Feature contributions (SHAP values)\n"
            "• Simulation scenarios\n"
            "• External context and public information\n\n"
            "Or type 'help' to see all available queries."
        )
        return {
            "message": message,
            "type": "general",
            "confidence": 0.6
        }
    
    def get_conversation_history(self) -> List[Dict]:
        """Return conversation history"""
        return self.conversation_history
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []


# Global chatbot instance
_chatbot_instance = None

def get_chatbot() -> FloodInsightChatbot:
    """Get or create global chatbot instance"""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = FloodInsightChatbot()
    return _chatbot_instance
