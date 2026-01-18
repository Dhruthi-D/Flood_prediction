HOW TO RUN THE FLOOD PREDICTION SYSTEM
====================================

This project consists of two components:
1. FastAPI Backend (ML model + APIs)
2. React Frontend (User Interface)

Both must be running simultaneously.

--------------------------------------------------
PREREQUISITES
--------------------------------------------------
- Python 3.9 or higher
- Node.js 18 or higher
- npm
- Internet connection (used for Open-Meteo APIs)

--------------------------------------------------
STEP 1: CLONE THE PROJECT
--------------------------------------------------
git clone <your-repository-url>
cd flood-prediction-system

--------------------------------------------------
STEP 2: RUN THE BACKEND (FASTAPI)
--------------------------------------------------

1. Navigate to the backend directory:
cd backend

2. Create a virtual environment:
python -m venv venv

3. Activate the virtual environment:

Windows:
venv\Scripts\activate

Linux / macOS:
source venv/bin/activate

4. Install backend dependencies:
pip install -r requirements.txt

5. Start the FastAPI server:
uvicorn main:app --reload

Backend will run at:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

--------------------------------------------------
STEP 3: RUN THE FRONTEND (REACT)
--------------------------------------------------

1. Open a new terminal (keep backend running)

2. Navigate to the frontend directory:
cd frontend

3. Install frontend dependencies :
npm install

4. Start the React development server:
npm run dev

Frontend will run at:
http://localhost:5173

--------------------------------------------------
STEP 4: USING THE APPLICATION
--------------------------------------------------

1. Open a browser and go to:
http://localhost:5173

2. Enter a city or place name in the input box

3. Use the tabs to:
   - View Live Flood Risk
   - View 3-Day Flood Forecast
   - Explore Simulation (Coming Soon)

4. Observe:
   - Current weather tiles
   - Flood probability
   - Risk level
   - Recommended actions

--------------------------------------------------
STOPPING THE APPLICATION
--------------------------------------------------

To stop the servers, press:
Ctrl + C

in both backend and frontend terminals.

--------------------------------------------------
ACADEMIC NOTE
--------------------------------------------------

This system follows a modular architecture separating:
- Machine Learning prediction engine
- API layer
- User interface

This design enables scalability and future integration
of real-time flood simulation modules.
