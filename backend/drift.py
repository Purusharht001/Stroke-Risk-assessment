"""Population Stability Index of stored inputs against the training distribution.

Reference = `reference_bins` in models/model_config.json, exported from the training
frame (2015/2017/2019). Conventions match the training notebook: decile edges from
training, binary features split at 0.5, 1e-6 added to both proportions before the log.
"""
import numpy as np

import model
from schema import CONFIG

EPS = 1e-6
MIN_ROWS = 30  # below this the dashboard reports "too few" instead of PSI values

# null edges in the config are the open ends.
REFERENCE = {
    f: (np.array([-np.inf if e is None and i == 0 else np.inf if e is None else e
                  for i, e in enumerate(CONFIG["reference_bins"][f]["edges"])]),
        np.array(CONFIG["reference_bins"][f]["expected"]))
    for f in model.FEATURES
}


def bin_props(values, edges) -> np.ndarray:
    return np.histogram(np.asarray(values, dtype=float), edges)[0] / len(values)


def psi(expected, actual) -> float:
    e, a = np.asarray(expected) + EPS, np.asarray(actual) + EPS
    return float(np.sum((a - e) * np.log(a / e)))


def band(v: float) -> str:
    # 0.1 and 0.25 themselves fall in "moderate" (the 0.1–0.25 band is closed).
    return "stable" if v < 0.1 else "moderate" if v <= 0.25 else "significant"


def report(rows: list[dict]) -> dict:
    n = len(rows)
    features = []
    for f, (edges, expected) in REFERENCE.items():
        v = psi(expected, bin_props([r["inputs"][f] for r in rows], edges)) if n else None
        features.append({"feature": f, "psi": v, "band": band(v) if n else None})
    features.sort(key=lambda x: -(x["psi"] or 0))
    return {
        "n_assessments": n,
        "sufficient": n >= MIN_ROWS,
        "window": {"from": rows[0]["created_at"] if n else None,
                   "to": rows[-1]["created_at"] if n else None},
        "reference": "training_bins",
        "reference_source": CONFIG["reference_bins_meta"]["source"],
        "features": features,
        "prediction_drift": {
            "mean_probability": float(np.mean([r["probability"] for r in rows])) if n else None,
            "flag_rate": float(np.mean([r["flagged"] for r in rows])) if n else None,
            "expected_flag_rate": model.EXPECTED_FLAG_RATE,
        },
    }
