import sys
print(sys.version)
import numpy as np
print('numpy', np.__version__)
import importlib.util
print('opencv installed?', importlib.util.find_spec('cv2') is not None)
try:
    import cv2
    print('cv2', cv2.__version__)
except Exception as e:
    print('cv2 import error:', type(e).__name__, e)
try:
    import shap
    print('shap', getattr(shap, '__version__', 'unknown'))
except Exception as e:
    print('shap import error:', type(e).__name__, e)
