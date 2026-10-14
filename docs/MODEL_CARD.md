# MODEL_CARD

---

## What the model does

Binary classification of **self-reported lifetime stroke history** — whether a
respondent has ever been told by a health professional that they had a stroke.

It is **not** a future-incidence model. The training data is cross-sectional: there
is no follow-up, no stroke onset date, and no temporal ordering between the
features and the outcome.

---

## Training data

| | |
|---|---|
| Source | CDC BRFSS, public annual files |
| Years | 2015, 2017, 2019 (train) · 2021 (validation) · 2023 (test) |
| Total respondents | ~2.17M |
| Training rows | 1,305,790 |
| Training stroke cases | 55,970 (4.29%) |
| Target variable | `CVDSTRK3` |

Odd years only: hypertension and cholesterol are BRFSS *rotating core*, asked by
all states only in odd-numbered years.

Validation split in two halves: **Val A** for model selection, early stopping, and
ensemble weights; **Val B** for calibration and threshold selection. The test year
was scored once.

---

## Bundle structure

`models/stroke_model.joblib` unpickles to:

```python
{
  "model_A": {  # DO NOT SERVE — academic comparison only
    "preprocessor", "model", "calibrator", "threshold",
    "features",            # 28 names, in fitted order
    "transformed_names",   # 43 columns after one-hot
    "numeric", "binary", "categorical",
    "test_metrics", "task",
  },
  "model_B": {  # SERVE THIS
    "preprocessor", "model", "calibrator", "threshold",
    "features",            # 21 names, in fitted order
    "transformed_names",
    "test_metrics", "task",
  },
  "meta": {
    "train_years", "val_year", "test_year",
    "n_train", "n_test", "train_prevalence", "target_recall",
    "sklearn", "xgboost", "numpy",     # pin these exact versions
    "excluded_leakage", "suspect_features_removed_in_B",
  },
}
```

---

## Correct inference — all four steps required

```python
import joblib, pandas as pd

B = joblib.load("models/stroke_model.joblib")
M = B["model_B"]

# 1. reorder columns to the fitted order  (wrong order = wrong answer, no error)
row = pd.DataFrame([payload])[M["features"]]

# 2. transform with the fitted preprocessor  (never refit)
X = M["preprocessor"].transform(row)

# 3. raw score, then calibrate  (threshold lives on the calibrated scale)
raw  = float(M["model"].predict_proba(X)[:, 1][0])
prob = float(M["calibrator"].predict([raw])[0])

# 4. compare
flagged = prob >= M["threshold"]
```

Skipping step 3 compares a raw score against a calibrated cutoff. The prediction
still returns a number, so nothing errors — recall just silently stops being what
the threshold promised.

---

## Performance — Model B, 2023 test year

| Metric | Value |
|---|---|
| ROC-AUC | ~0.827 |
| PR-AUC | ~0.18 |
| Recall at threshold | ~0.86 |
| Precision at threshold | ~0.09 |
| Brier score | ~0.037 |
| Flag rate | ~36-39% of the population |

Read `M["test_metrics"]` for the exact figures rather than quoting these.

**Precision is ~9% and that is arithmetic, not a defect.** At 4% prevalence,
capturing 86% of cases requires flagging roughly a third of the population. Nine
of ten flagged profiles have no stroke history. The UI must say so — see
`docs/UI_COPY_RULES.md`.

Calibration is good: subgroup calibration error stays under 0.003. When the model
says 7%, about 7% of such profiles do have a stroke history.

---

## Why Model B and not Model A

Model A uses 28 features. Seven of them may reflect the *consequences* of a stroke
rather than prior risk: `gen_health`, `phys_activity`, `phys_days`, `ment_days`,
`employment`, `has_doctor`, `last_checkup`.

Removing them costs 7.9% relative PR-AUC. That figure is the project's central
measurement of reverse causation. Model A remains in the bundle only so the
comparison can be cited; **it is never served**.

---

## Known limitations

1. **Lifetime prevalence, not incidence.** No temporal ordering between features
   and outcome. A BMI recorded in 2023 cannot have preceded a stroke in 2005.
2. **Ascertainment bias.** The label requires having been *told* by a clinician.
   Undiagnosed strokes are recorded as negatives, concentrated among people with
   less healthcare access. Reported prevalence among uninsured under-65s (2.05%)
   is lower than among insured under-65s (2.40%) — the opposite of what risk
   profiles predict.
3. **Recall varies by age.** 0.72 under 65 vs 0.94 at 65+, with near-identical
   subgroup PR-AUC. This is a single-threshold artifact, not a discrimination
   failure. Per-band thresholds were evaluated and rejected: they cost ~15,900
   extra flags per additional case caught.
4. **Survivorship bias.** BRFSS surveys living, non-institutionalised adults by
   telephone. Fatal strokes are absent; severe survivors are under-represented.
5. **No clinical measurements.** No atrial fibrillation, no measured blood
   pressure, no laboratory values.
6. **No external clinical validation.** Temporal validation across five BRFSS
   years is a genuine strength but does not establish clinical transportability.

---

## Version pinning

The bundle is pickled scikit-learn. Version drift between the training runtime and
the server either warns or breaks. Pin the exact versions from `meta`:

```bash
python -c "import joblib; print(joblib.load('models/stroke_model.joblib')['meta'])"
```

`models/sanity_input.csv` and `models/sanity_expected.npy` exist to verify this.
Module 0 runs that check. Max absolute difference must be under 1e-6.
