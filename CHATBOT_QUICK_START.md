# Chatbot Quick Start Guide

## 🚀 Getting Started with the Flood Risk Insight Assistant

### Prerequisites
- Backend server running (Python with FastAPI)
- Frontend server running (React with Vite)
- All dependencies installed

### Step 1: Install Dependencies

#### Backend (if not already installed)
```bash
cd Flood_prediction/backend
pip install -r requirements.txt
```

#### Frontend (install react-markdown)
```bash
cd Flood_prediction/frontend
npm install
```

### Step 2: Start the Servers

#### Terminal 1 - Backend
```bash
cd Flood_prediction/backend
uvicorn main:app --reload
```

Backend should start on `http://127.0.0.1:8000`

#### Terminal 2 - Frontend
```bash
cd Flood_prediction/frontend
npm run dev
```

Frontend should start on `http://localhost:5173` (or similar)

### Step 3: Access the Chatbot

1. Open your browser to the frontend URL (e.g., `http://localhost:5173`)
2. Navigate to the Dashboard
3. Click on the **"💬 Chat Assistant"** tab

### Step 4: Try the Chatbot

#### First Time Use
When you first open the chat, it will automatically show a welcome message explaining what it can do.

#### Without Context (Fresh Start)
You can ask general questions:
- "Hello"
- "What can you help me with?"
- "Help"

The chatbot will guide you to make predictions first to get better context.

#### With Context (After Running Predictions)

1. **Select a Location**
   - Choose a city from the dropdown, or
   - Enter coordinates

2. **Get Live Prediction**
   - Click "Get Live Prediction" button
   - Wait for results to load
   - SHAP explanation will load automatically

3. **Switch to Chat Tab**
   - Click "💬 Chat Assistant"
   - Notice the context indicator showing available data

4. **Ask Questions**

Try these quick questions:

**About Risk:**
```
Why is the flood risk high?
What is the current prediction?
```

**About Features:**
```
Which features contributed most?
Explain the SHAP values
Why did rainfall influence the result?
```

**About Context:**
```
What external information is available?
Are there any weather alerts?
```

**Compare Results** (after running simulation):
```
Compare prediction vs simulation
How does simulation differ from prediction?
```

#### Quick Questions
Click any of the suggested quick questions for instant examples.

### Step 5: Safety Features

Try asking decision-making questions to see safety checks:

```
Should I evacuate?
What action should I take?
Tell me what to do
```

The chatbot will politely refuse and explain:
- It only provides interpretations
- It does not give authoritative guidance
- You should consult official authorities for decisions

### Step 6: Advanced Features

#### Clear History
- Click "Clear History" to start fresh
- Conversation resets with new welcome message

#### Help Command
- Click "Help" or ask "help" for guidance anytime

#### Markdown Responses
- Responses use markdown formatting
- **Bold** text for emphasis
- Bullet points for lists
- Structured sections

### Common Workflows

#### Workflow 1: Understanding a Prediction
1. Select location → Run live prediction
2. Switch to Chat tab
3. Ask: "Why is the flood risk [level]?"
4. Follow up: "Which features contributed most?"
5. Ask: "What does external context say?"

#### Workflow 2: Exploring SHAP
1. Get prediction with SHAP
2. Switch to Chat tab
3. Ask: "Explain the SHAP values"
4. Ask: "Why did [feature] increase/decrease risk?"

#### Workflow 3: Simulation Comparison
1. Run live prediction
2. Run a simulation (Simulation tab)
3. Switch to Chat tab
4. Ask: "Compare prediction vs simulation"

### Troubleshooting

#### Issue: Chat not responding
**Solution:**
- Check backend console for errors
- Verify backend is running on port 8000
- Check browser network tab for failed requests

#### Issue: No context available
**Solution:**
- Run a prediction first (Live tab)
- Ensure location is selected
- Wait for SHAP explanation to load

#### Issue: Markdown not rendering
**Solution:**
```bash
cd frontend
npm install react-markdown
npm run dev
```

#### Issue: CORS errors
**Solution:**
Backend `main.py` should include your frontend URL in CORS origins:
```python
allow_origins=["http://localhost:5173", ...]
```

### API Testing (Optional)

You can test the chatbot API directly:

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is flood risk high?",
    "prediction": {
      "probability": 0.75,
      "risk_level": "High"
    }
  }'
```

### Example Conversation

```
User: hello
Assistant: Welcome to the Flood Risk Insight Assistant! 🌊
I can help you understand flood predictions...

User: [runs prediction for Mumbai]
[Context: Prediction available, Risk: High (72%)]

User: Why is the flood risk high?
Assistant: The model indicates high flood risk (50-75% probability).
Multiple weather factors are contributing to elevated flood potential.

Key Contributing Factors:
• Rainfall is elevating flood risk
• Relative Humidity is elevating flood risk
• Atmospheric Pressure is reducing flood risk

User: Explain the SHAP values
Assistant: **Feature Contribution Analysis (SHAP)**
The model predicts a flood probability of 72.0% (Risk: High).
Starting from a baseline probability of 50.0%, here's how each feature influenced:
• Rainfall (mm): strong increased flood risk (SHAP: +0.180)
• Relative Humidity (%): moderate increased flood risk (SHAP: +0.094)
...
```

### Next Steps

1. **Explore Different Scenarios**
   - Try different locations
   - Run simulations with varied parameters
   - Compare results using the chatbot

2. **Test Safety Boundaries**
   - Try decision-making queries
   - Observe how chatbot maintains boundaries

3. **Provide Feedback**
   - Note what works well
   - Identify areas for improvement
   - Suggest new features

### Tips for Best Experience

✅ **Do:**
- Run predictions before chatting for better context
- Ask specific questions about features
- Use quick questions for examples
- Explore SHAP explanations
- Compare predictions with simulations

❌ **Don't:**
- Expect real-time official warnings
- Ask for evacuation instructions
- Treat as authoritative guidance
- Expect resource allocation decisions

### Support

For issues or questions:
1. Check [CHATBOT_DOCUMENTATION.md](CHATBOT_DOCUMENTATION.md)
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Ensure all dependencies are installed

---

**Remember:** The chatbot is an **explanation tool**, not a **decision tool**. Always consult official authorities for emergency actions.
