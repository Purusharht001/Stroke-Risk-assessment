---
name: neuroflow-inference
description: Run a stroke-history screening prediction through the NeuroFlow Model B bundle. Use when adding, debugging, or calling any prediction path — the four-step contract (reorder, transform, calibrate, compare) must be followed exactly or predictions are silently wrong. Covers column ordering, calibration before thresholding, and the Model A prohibition.
license: Apache-2.0
---

# NeuroFlow inference

## The four-step contract

```python
import joblib, pandas as pd

B = joblib.load("models/stroke_model.joblib")
M = B["model_B"]                                   # never model_A

row  = pd.DataFrame([payload])[M["features"]]      # 1. reorder
X    = M["preprocessor"].transform(row)            # 2. transform, never refit
raw  = float(M["model"].predict_proba(X)[:, 1][0])
prob = float(M["calibrator"].predict([raw])[0])    # 3. calibrate
flagged = prob >= M["threshold"]                   # 4. compare
```

## The two silent failures

**Wrong column order.** `pd.DataFrame([payload])` orders by dict insertion. The
preprocessor was fitted on a specific order. Mismatched order produces a number,
raises nothing, and is wrong. Always index by `M["features"]`.

**Skipping calibration.** The threshold lives on the calibrated scale. Comparing a
raw score to it returns a boolean that is quietly not the 86%-recall operating
point the threshold promised.

## Prohibitions

- Never serve `model_A`. It carries 7 post-stroke-state features and exists only
  for the academic comparison.
- Never refit the preprocessor, model, or calibrator at runtime.
- Never hardcode a feature range. Read `models/model_config.json`.

## Performance

Load the bundle and build `shap.TreeExplainer` **once at startup**. Per-request
construction adds seconds.

## Verifying a change

```bash
python backend/verify_model.py     # must exit 0, max diff < 1e-6
```

Any change to the inference path re-runs this before being considered done.
