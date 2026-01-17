"""
Test script for the Flood Risk Insight Assistant chatbot.
Run this after starting the backend server to verify functionality.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_chat_endpoint():
    """Test basic chat endpoint"""
    print_section("Test 1: Basic Chat (Welcome)")
    
    payload = {
        "message": "hello"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:200] + "...")
        print("\n✅ Welcome message test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_chat_with_prediction():
    """Test chat with prediction context"""
    print_section("Test 2: Chat with Prediction Context")
    
    payload = {
        "message": "Why is the flood risk high?",
        "prediction": {
            "probability": 0.75,
            "risk_level": "High"
        },
        "location": "Mumbai"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:300] + "...")
        print("\n✅ Prediction context test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_chat_with_shap():
    """Test chat with SHAP explanation"""
    print_section("Test 3: Chat with SHAP Context")
    
    payload = {
        "message": "Explain the SHAP values",
        "prediction": {
            "probability": 0.68,
            "risk_level": "High"
        },
        "shap_explanation": {
            "base_value": 0.50,
            "shap_values": [0.12, -0.08, 0.15, 0.05, 0.18, 0.09, -0.03, 0.02, 0.01],
            "feature_names": [
                "temperature", "temperature_max", "temperature_min",
                "pressure", "rainfall", "humidity", "wind_speed",
                "rain_anomaly", "temp_anomaly"
            ]
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:400] + "...")
        print("\n✅ SHAP explanation test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_safety_check():
    """Test safety boundary enforcement"""
    print_section("Test 4: Safety Check (Decision Query)")
    
    payload = {
        "message": "Should I evacuate?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:300] + "...")
        
        if data.get('type') == 'safety_disclaimer':
            print("\n✅ Safety check test passed - correctly refused decision query")
        else:
            print("\n⚠️  Warning: Expected safety_disclaimer response type")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_simulation_comparison():
    """Test simulation vs prediction comparison"""
    print_section("Test 5: Simulation Comparison")
    
    payload = {
        "message": "Compare prediction vs simulation",
        "prediction": {
            "probability": 0.55,
            "risk_level": "Moderate"
        },
        "simulation": {
            "probability": 0.78,
            "risk_level": "High"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:400] + "...")
        print("\n✅ Simulation comparison test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_external_context():
    """Test external context awareness"""
    print_section("Test 6: External Context")
    
    payload = {
        "message": "What external information is available?",
        "prediction": {
            "probability": 0.82,
            "risk_level": "Critical"
        },
        "location": "Chennai"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response Type: {data.get('type')}")
        print(f"Confidence: {data.get('confidence')}")
        print(f"\nMessage Preview:")
        print(data.get('message')[:400] + "...")
        print("\n✅ External context test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_chat_history():
    """Test chat history endpoints"""
    print_section("Test 7: Chat History")
    
    try:
        # Get history
        response = requests.get(f"{BASE_URL}/chat/history")
        response.raise_for_status()
        data = response.json()
        
        history_count = len(data.get('history', []))
        print(f"Status: {response.status_code}")
        print(f"History entries: {history_count}")
        print("✅ Get history test passed")
        
        # Clear history
        print("\nClearing history...")
        response = requests.post(f"{BASE_URL}/chat/clear")
        response.raise_for_status()
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Message: {data.get('message')}")
        print("✅ Clear history test passed")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def run_all_tests():
    """Run all chatbot tests"""
    print("\n" + "="*60)
    print("  FLOOD RISK INSIGHT ASSISTANT - TEST SUITE")
    print("="*60)
    print("\nMake sure the backend server is running on http://127.0.0.1:8000")
    input("\nPress Enter to continue...")
    
    # Run tests
    test_chat_endpoint()
    test_chat_with_prediction()
    test_chat_with_shap()
    test_safety_check()
    test_simulation_comparison()
    test_external_context()
    test_chat_history()
    
    # Summary
    print("\n" + "="*60)
    print("  TEST SUITE COMPLETE")
    print("="*60)
    print("\n✅ All tests completed!")
    print("\nNext steps:")
    print("1. Check the results above for any failures")
    print("2. Start the frontend: cd frontend && npm run dev")
    print("3. Open browser and test the chat UI")
    print("4. See CHATBOT_QUICK_START.md for usage guide")

if __name__ == "__main__":
    run_all_tests()
