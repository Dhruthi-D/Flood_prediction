import pickle
import os
import logging
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgboost_flood_model.pkl")

with open(MODEL_PATH, "rb") as f:
    flood_model = pickle.load(f)

logger.info("Expected features: %s", getattr(flood_model, "feature_names_in_", None))


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


def get_feature_names():
    # Try scikit-learn API
    names = getattr(flood_model, "feature_names_in_", None)
    if names is not None:
        return list(names)

    # Try xgboost booster
    try:
        booster = getattr(flood_model, "get_booster", None)
        if booster:
            b = flood_model.get_booster()
            fmap = b.feature_names
            if fmap:
                return list(fmap)
    except Exception:
        pass

    # Fallback to generic names
    return [f"f{i}" for i in range(9)]


def get_feature_importances(normalize=True):
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


def explain_instance(values):
    """Simple contribution heuristic: contribution = normalized_importance * feature_value"""
    names = get_feature_names()
    mapping = get_feature_importances(normalize=True)
    contributions = []
    for i, name in enumerate(names):
        v = float(values[i]) if i < len(values) else 0.0
        contrib = mapping.get(name, 0.0) * v
        contributions.append({"feature": name, "value": v, "contribution": contrib})
    return contributions

