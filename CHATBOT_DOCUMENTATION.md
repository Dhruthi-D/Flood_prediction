# Explainability-Focused Chatbot Integration

## Overview

The Flood Risk Insight Assistant is an explainability-focused chatbot that helps users understand flood predictions, SHAP explanations, and model behavior. It is **NOT** a decision-making or management system.

## Purpose

The chatbot serves as an interpretive layer that:
- Explains why flood risk is high or low
- Interprets SHAP feature contributions
- Clarifies differences between predictions and simulations
- Provides contextual awareness using simulated external information

## Key Features

### 1. **Conversational Interface**
- Natural language query processing
- Context-aware responses
- Conversation history tracking
- Quick question suggestions

### 2. **SHAP Integration**
- Interprets SHAP values from model explanations
- Identifies top contributing features
- Explains positive vs negative contributions
- Connects SHAP values to prediction outcomes

### 3. **Prediction & Simulation Awareness**
- Distinguishes between ML predictions and what-if simulations
- Compares prediction vs simulation results
- Explains the purpose and limitations of simulations
- Never mixes contexts silently

### 4. **External Context Awareness (Simulated)**
- Provides contextual information based on risk level
- Simulates public information sources (news, alerts, historical data)
- Demonstrates system-level thinking
- **Note**: In production, this would integrate with real APIs

### 5. **Safety-First Design**
- Refuses decision-making queries (evacuation, resource allocation, etc.)
- Provides clear disclaimers about limitations
- Uses interpretive language ("risk interpretation" not "evacuation order")
- Directs users to official authorities for actions

## Architecture

### Backend Components

#### `chatbot_engine.py`
The core chatbot logic with the `FloodInsightChatbot` class:
- **Query Processing**: Routes queries to appropriate handlers
- **Safety Checks**: Detects and refuses decision-making queries
- **SHAP Explanation**: Interprets SHAP values and feature contributions
- **Prediction Explanation**: Contextualizes risk levels
- **Simulation Explanation**: Explains what-if scenarios
- **External Context**: Provides simulated public information
- **Comparison**: Compares predictions vs simulations

#### API Endpoints (`main.py`)
- `POST /chat`: Main chatbot query endpoint
  - Accepts: message text and context (prediction, SHAP, simulation, location)
  - Returns: explanatory response with type and confidence
- `GET /chat/history`: Retrieve conversation history
- `POST /chat/clear`: Clear conversation history

#### Schemas (`schemas.py`)
- `ChatRequest`: Query with optional context components
- `ChatResponse`: Response with message, type, confidence, and timestamp
- `ChatMessage`: Single message for history tracking

### Frontend Components

#### `ChatAssistant.jsx`
React component providing the chat interface:
- Message display with markdown rendering
- Input handling with quick questions
- Context tracking (prediction, SHAP, simulation, location)
- Loading states and error handling
- Automatic welcome message

#### `ChatAssistant.css`
Styling for the chat interface with:
- Message bubbles (user vs assistant)
- Animated message appearance
- Loading indicators
- Context awareness display
- Mobile-responsive design

#### Integration with Dashboard
- New "💬 Chat Assistant" tab
- Automatic context passing:
  - Current prediction
  - SHAP explanation
  - Location information
- Context indicator shows available data

### API Services (`api.js`)
- `sendChatMessage(message, context)`: Send query to chatbot
- `getChatHistory()`: Retrieve conversation history
- `clearChatHistory()`: Clear history

## Usage Examples

### Example Queries

1. **Understanding Risk**
   - "Why is the flood risk high?"
   - "What is the current prediction?"
   - "Explain the risk level"

2. **SHAP Interpretation**
   - "Which features contributed most?"
   - "Explain the SHAP values"
   - "Why did rainfall influence the result?"

3. **Simulation Understanding**
   - "How does this simulation differ from prediction?"
   - "What if scenarios can I explore?"
   - "Compare prediction vs simulation"

4. **External Context**
   - "What external information is available?"
   - "Are there any recent weather alerts?"
   - "What does public information say?"

### Safety-Checked Queries (Refused)

The chatbot will refuse and redirect these types of queries:
- "Should I evacuate?"
- "What action should I take?"
- "Allocate resources to this area"
- "Tell me what to do"

Response includes:
- Clear explanation of chatbot limitations
- Referral to official authorities
- Description of what the chatbot CAN help with

## Response Types

The chatbot provides different response types:

1. **shap_explanation**: SHAP value interpretation
2. **prediction_explanation**: Current prediction analysis
3. **simulation_explanation**: Simulation scenario interpretation
4. **reason_explanation**: Why certain risk levels occur
5. **external_context**: Contextual public information
6. **comparison**: Prediction vs simulation comparison
7. **safety_disclaimer**: Response to inappropriate queries
8. **welcome**: Initial help message
9. **general**: General guidance

## Context Awareness

The chatbot receives context from the Dashboard:

```javascript
{
  prediction: { probability, risk_level },
  shap_explanation: { shap_values, feature_names, base_value },
  simulation: { probability, risk_level },
  location: "City Name" or "lat,lon"
}
```

This context enables:
- Specific answers about current predictions
- SHAP-based feature analysis
- Comparison between prediction and simulation
- Location-specific contextualization

## Implementation Notes

### Feature Name Mapping
The chatbot maps technical feature names to user-friendly labels:
- `temperature` → "Temperature (°C)"
- `rainfall` → "Rainfall (mm)"
- `humidity` → "Relative Humidity (%)"
- etc.

### SHAP Interpretation
When explaining SHAP values:
- Sorts features by absolute contribution
- Shows top 3 most influential features
- Indicates direction (increase/decrease risk)
- Describes impact magnitude (strong/moderate/slight)

### External Context (Simulated)
Currently provides simulated context based on risk level:
- **Critical/High**: Heavy rainfall advisories, historical flood mentions
- **Moderate**: Normal conditions, functioning infrastructure
- **Low**: Favorable conditions, no warnings

**Production Enhancement**: Replace with real APIs:
- Weather service APIs (NWS, NOAA, etc.)
- News aggregation APIs
- Social media monitoring (verified sources)
- Historical database queries

## Installation & Dependencies

### Backend
```bash
cd backend
# No additional dependencies needed - uses existing FastAPI setup
```

### Frontend
```bash
cd frontend
npm install react-markdown
# Or it will be installed automatically with npm install
```

## Testing the Chatbot

### 1. Start Backend
```bash
cd backend
uvicorn main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm install  # Install react-markdown if not already installed
npm run dev
```

### 3. Test Flow
1. Navigate to the dashboard
2. Select a location
3. Run "Get Live Prediction"
4. Switch to "💬 Chat Assistant" tab
5. Try queries:
   - Start with "hello" (automatic)
   - Click quick questions
   - Ask custom questions
   - Try safety-checked queries

### 4. Verify Features
- ✅ Chat interface loads
- ✅ Welcome message appears
- ✅ Context indicator shows available data
- ✅ SHAP explanations work with prediction
- ✅ Safety checks refuse inappropriate queries
- ✅ Message history persists
- ✅ Clear history works
- ✅ Markdown rendering works
- ✅ Loading states display correctly

## Security & Safety Considerations

### What the Chatbot Does NOT Do
- ❌ Provide evacuation instructions
- ❌ Allocate resources
- ❌ Make authoritative decisions
- ❌ Claim real-time accuracy
- ❌ Replace official emergency services

### What the Chatbot DOES Do
- ✅ Explain model predictions
- ✅ Interpret SHAP feature contributions
- ✅ Contextualize risk levels
- ✅ Compare predictions vs simulations
- ✅ Provide situational awareness
- ✅ Refer users to official authorities

### Safety Disclaimers
The chatbot includes multiple safety layers:
1. **Header disclaimer**: Visible at all times
2. **Safety check**: Detects decision-making queries
3. **Response framing**: Uses interpretive language
4. **Authority referral**: Directs to official services

## Future Enhancements

### Potential Improvements

1. **Real External Context Integration**
   - Weather API integration (OpenWeatherMap, NOAA)
   - News API for recent reports
   - Historical flood database queries
   - Social media monitoring (verified sources)

2. **Advanced NLP**
   - Use LLM API (OpenAI, Anthropic) for more natural responses
   - Better intent recognition
   - Multi-turn conversation understanding

3. **Visualization Integration**
   - Generate charts/graphs in responses
   - Interactive SHAP visualizations
   - Risk trend visualization

4. **Multi-Language Support**
   - Translate queries and responses
   - Location-specific language defaults

5. **Personalization**
   - User preference storage
   - Query history analysis
   - Customized explanation depth

6. **Voice Interface**
   - Speech-to-text input
   - Text-to-speech responses
   - Accessibility improvements

## Troubleshooting

### Common Issues

1. **Chatbot not responding**
   - Check backend is running on port 8000
   - Verify CORS settings allow frontend origin
   - Check browser console for errors

2. **Context not showing**
   - Ensure prediction has been run
   - Check SHAP explanation is loaded
   - Verify location is selected

3. **SHAP explanation empty**
   - Run prediction first
   - Check SHAP values in backend logs
   - Verify model has SHAP explainer

4. **Markdown not rendering**
   - Ensure react-markdown is installed
   - Check npm install completed successfully
   - Restart development server

## Conclusion

The Explainability-Focused Chatbot adds a powerful interpretive layer to the flood prediction system without turning it into a management or control system. It demonstrates system-level thinking by combining ML predictions, SHAP explainability, simulation insights, and external context awareness while maintaining strict safety boundaries.

The chatbot serves as an educational and interpretive tool, helping users understand complex model outputs while always referring them to official authorities for actual decision-making.
