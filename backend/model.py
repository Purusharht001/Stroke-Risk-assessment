"""Model B bundle loading, inference, and SHAP. Loaded once at import (startup).

The model classifies self-reported stroke *history*; it does not predict future
strokes. Only model_B is ever read from the bundle.
"""
import os
from pathlib import Path

import joblib
import pandas as pd
import shap

ROOT = Path(__file__).resolve().parents[1]

_M = joblib.load(ROOT / os.environ.get("MODEL_BUNDLE", "models/stroke_model.joblib"))["model_B"]
FEATURES = list(_M["features"])
THRESHOLD = float(_M["threshold"])
VERSION = "model_B"
_T = _M["test_metrics"]  # 2023 held-out year
EXPECTED_FLAG_RATE = (_T["TP"] + _T["FP"]) / (_T["TP"] + _T["FP"] + _T["FN"] + _T["TN"])
_EXPLAINER = shap.TreeExplainer(_M["model"])

# One-hot columns ("marital_2.0") fold back to their source feature ("marital").
_SOURCE = [t if t in FEATURES else t.rsplit("_", 1)[0] for t in _M["transformed_names"]]
assert set(_SOURCE) == set(FEATURES), "transformed_names do not map onto features"


def predict(payload: dict) -> dict:
    row = pd.DataFrame([payload])[FEATURES].astype(float)   # 1. reorder (training data was float)
    X = _M["preprocessor"].transform(row)                     # 2. transform, never refit
    raw = float(_M["model"].predict_proba(X)[:, 1][0])
    prob = float(_M["calibrator"].predict([raw])[0])         # 3. calibrate
    flagged = prob >= THRESHOLD                               # 4. compare on calibrated scale

    # SHAP is on the model's raw log-odds scale, before calibration.
    agg = dict.fromkeys(FEATURES, 0.0)
    for src, v in zip(_SOURCE, _EXPLAINER.shap_values(X)[0]):
        agg[src] += float(v)
    top = sorted(agg.items(), key=lambda kv: abs(kv[1]), reverse=True)[:5]

    return {
        "probability": prob,
        "flagged": bool(flagged),
        "threshold": THRESHOLD,
        "model_version": VERSION,
        "contributions": [
            {"feature": f, "value": payload[f], "shap": round(s, 6),
             "direction": "up" if s > 0 else "down"}
            for f, s in top
        ],
    }
