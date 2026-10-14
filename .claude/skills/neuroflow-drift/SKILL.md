---
name: neuroflow-drift
description: Compute Population Stability Index over stored NeuroFlow assessments to detect covariate and prediction drift. Use when building or debugging the drift dashboard. Covers the PSI formula, decile binning, the epsilon guard, band cutoffs, and the reference-distribution problem.
license: Apache-2.0
---

# PSI drift monitoring

## Formula

PSI = sum_b (A_b - E_b) * ln(A_b / E_b)

E_b = expected (training) proportion in bin b, A_b = actual (live) proportion.
Symmetrised KL divergence: non-negative, zero only when distributions coincide.

## Conventions — match the training notebook exactly

- 10 bins, edges from **training** deciles
- Binary features: two bins split at 0.5
- Add `1e-6` to every proportion before the log — otherwise an empty bin yields
  `ln 0 = -inf`
- Bands: `< 0.1` stable, `0.1-0.25` moderate, `> 0.25` significant

```python
def psi(expected, actual, bins=10):
    e, a = pd.Series(expected).dropna(), pd.Series(actual).dropna()
    if e.nunique() <= 2:
        edges = [-np.inf, 0.5, np.inf]
    else:
        edges = np.unique(np.percentile(e, np.linspace(0, 100, bins + 1)))
        edges[0], edges[-1] = -np.inf, np.inf
    ep = np.histogram(e, edges)[0] / len(e) + 1e-6
    ap = np.histogram(a, edges)[0] / len(a) + 1e-6
    return float(np.sum((ap - ep) * np.log(ap / ep)))
```

## The reference-distribution problem

PSI needs training-side bin proportions. **The bundle does not ship them.** Two
options — pick one and disclose it:

1. **Preferred:** add a `reference_bins` block to `models/model_config.json`,
   exported once from the training frame.
2. **Fallback:** build an approximate reference from the config's
   `min`/`max`/`median`, and label the dashboard as approximate.

Never invent a reference silently. An undisclosed approximation discredits the
whole dashboard.

## Correctness tests

| Test | Expected |
|---|---|
| Distribution against itself | approx 0 (< 1e-6) |
| Obviously shifted distribution | > 0.25 |
| Empty bins | no `inf` or `nan` |
| Band cutoffs | correct at exactly 0.1 and 0.25 |

## Small-sample honesty

Under ~30 stored assessments, the dashboard says so rather than rendering noise as
if it were signal.
