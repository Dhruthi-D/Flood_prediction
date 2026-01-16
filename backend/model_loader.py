import pickle
import os
import logging
import numpy as np
import shap

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgboost_flood_model.pkl")

with open(MODEL_PATH, "rb") as f:
    flood_model = pickle.load(f)

logger.info("Expected features: %s", getattr(flood_model, "feature_names_in_", None))

# Initialize SHAP TreeExplainer for XGBoost model
try:
    shap_explainer = shap.TreeExplainer(flood_model)
    logger.info("SHAP TreeExplainer initialized successfully")
except Exception as e:
    logger.warning("Failed to initialize SHAP TreeExplainer: %s", e)
    shap_explainer = None


def get_feature_names():
    """Get feature names in the correct order used for training"""
    # Try scikit-learn API
    names = getattr(flood_model, "feature_names_in_", None)
    if names is not None:
        return [str(n) for n in names]

    # Try xgboost booster
    try:
        booster = getattr(flood_model, "get_booster", None)
        if booster:
            b = flood_model.get_booster()
            fmap = b.feature_names
            if fmap:
                return [str(n) for n in fmap]
    except Exception:
        pass

    # Fallback to correct feature order
    return ['T2M', 'T2M_MAX', 'T2M_MIN', 'PS', 'PRECTOTCORR', 'RH2M', 'WS2M', 'rain_anomaly', 'temp_anomaly']


def predict(features):
    """
    features: 2D numpy array
    Returns probability for positive class as float
    """
    try:
        arr = np.array(features, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)

        logger.info("Model input features: %s", arr.tolist())

        proba = flood_model.predict_proba(arr)
        # Defensive checks
        if proba is None:
            logger.warning("predict_proba returned None")
            return 0.0
        # Ensure index exists
        if proba.shape[1] < 2:
            logger.warning("predict_proba returned unexpected shape: %s", proba.shape)
            return float(proba[0][0])

        prob = float(proba[0][1])
        if np.isnan(prob):
            logger.warning("predict_proba returned NaN")
            return 0.0

        logger.info("Predicted probability: %s", prob)
        return prob
    except Exception as e:
        logger.exception("Error in model prediction: %s", e)
        return 0.0


def get_feature_importances(normalize=True):
    """Get global feature importances from the model"""
    # Prefer scikit-learn style attribute
    fi = getattr(flood_model, "feature_importances_", None)
    if fi is not None:
        arr = list(map(float, fi))
        names = get_feature_names()
        mapping = dict(zip(names, arr))
    else:
        # Try xgboost booster feature scores
        try:
            b = flood_model.get_booster()
            score = b.get_score(importance_type="weight")
            # score keys like 'f0', map to names
            names = get_feature_names()
            mapping = {names[int(k[1:])]: float(v) for k, v in score.items() if k.startswith("f")}
            # ensure all features present
            for n in names:
                mapping.setdefault(n, 0.0)
        except Exception:
            # fallback uniform
            names = get_feature_names()
            mapping = {n: 1.0 for n in names}

    if normalize:
        s = sum(mapping.values()) or 1.0
        for k in mapping:
            mapping[k] = mapping[k] / s

    return mapping


def explain_instance_shap(features):
    """
    Use SHAP TreeExplainer to explain a single prediction.
    
    Args:
        features: 2D numpy array with shape (1, n_features)
    
    Returns:
        {
            "base_value": float,
            "feature_names": list,
            "shap_values": list of floats,
            "prediction": float
        }
    """
    if shap_explainer is None:
        raise ValueError("SHAP explainer not initialized")
    
    try:
        arr = np.array(features, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        
        # Get SHAP values for positive class (flood prediction)
        shap_values = shap_explainer.shap_values(arr)
        
        # Handle different SHAP output formats
        if isinstance(shap_values, list):
            # For multi-class, get class 1 (flood)
            shap_vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            # For binary classification
            shap_vals = shap_values[0] if shap_values.ndim > 1 else shap_values
        
        # Get base value (expected model output)
        if hasattr(shap_explainer, 'expected_value'):
            base_value = float(shap_explainer.expected_value[1] if isinstance(shap_explainer.expected_value, (list, np.ndarray)) else shap_explainer.expected_value)
        else:
            base_value = 0.5
        
        # Get prediction for this instance
        pred = predict(arr)
        
        return {
            "base_value": base_value,
            "feature_names": get_feature_names(),
            "shap_values": shap_vals.tolist() if isinstance(shap_vals, np.ndarray) else list(shap_vals),
            "prediction": float(pred)
        }
    except Exception as e:
        logger.exception("Error in SHAP explanation: %s", e)
        raise


def explain_instance(values):
    """
    Simple contribution heuristic: contribution = normalized_importance * feature_value
    (Legacy function for backward compatibility)
    """
    names = get_feature_names()
    mapping = get_feature_importances(normalize=True)
    contributions = []
    for i, name in enumerate(names):
        v = float(values[i]) if i < len(values) else 0.0
        contrib = mapping.get(name, 0.0) * v
        contributions.append({"feature": name, "value": v, "contribution": contrib})
    return contributions


