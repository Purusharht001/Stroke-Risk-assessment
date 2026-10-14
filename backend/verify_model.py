#!/usr/bin/env python3
"""verify_model.py — prove the bundle reproduces Colab's numbers here.

Exits 0 on success, 1 on any failure. Module 0 requires exit 0 before the
backend is built.
"""
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"


def main() -> int:
    missing = [f for f in ("stroke_model.joblib", "sanity_input.csv",
                           "sanity_expected.npy")
               if not (MODELS / f).exists()]
    if missing:
        print(f"FAIL: missing in models/: {missing}")
        return 1

    bundle = joblib.load(MODELS / "stroke_model.joblib")
    meta = bundle["meta"]

    print("Bundle metadata")
    for k, v in meta.items():
        if k not in ("excluded_leakage", "suspect_features_removed_in_B"):
            print(f"  {k:24s} {v}")

    import sklearn, xgboost
    print("\nInstalled vs expected")
    mismatched = False
    for lib, installed, expected in [
        ("scikit-learn", sklearn.__version__, meta.get("sklearn")),
        ("xgboost", xgboost.__version__, meta.get("xgboost")),
        ("numpy", np.__version__, meta.get("numpy")),
    ]:
        mark = "ok" if installed == expected else "MISMATCH"
        if mark == "MISMATCH":
            mismatched = True
        print(f"  {lib:16s} {installed:12s} expected {expected:12s} {mark}")

    M = bundle["model_B"]
    print(f"\nModel B: {len(M['features'])} features, "
          f"threshold {M['threshold']:.4f}")
    if len(M["features"]) != 21:
        print(f"FAIL: expected 21 features, got {len(M['features'])}")
        return 1

    X = pd.read_csv(MODELS / "sanity_input.csv")[M["features"]]
    raw = M["model"].predict_proba(M["preprocessor"].transform(X))[:, 1]
    got = M["calibrator"].predict(raw)
    want = np.load(MODELS / "sanity_expected.npy")

    diff = float(np.abs(got - want).max())
    print(f"\nSanity check over {len(X)} rows: max |diff| = {diff:.3e}")

    if diff >= 1e-6:
        print("FAIL: predictions do not reproduce Colab's output.")
        if mismatched:
            print("      Library versions differ — pin them and reinstall.")
        return 1

    print("PASS: bundle verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
