# MODULE 4 — Drift dashboard

**Goal:** compute Population Stability Index over stored predictions and render it,
turning the report's Phase 8 from a described plan into a working feature.

## Required reading
- `CLAUDE.md`
- `docs/ACADEMIC_DOSSIER.md` **§2 only** — the PSI formulation and bin convention

## Preconditions
Modules 1–3 ✅. The `assessments` table has rows. If it has fewer than ~30, seed
by submitting the form several times with varied inputs, and note in BUILD_LOG that
the numbers are demonstration-scale.

## Files to create

| Path | Purpose |
|---|---|
| `backend/drift.py` | PSI computation |
| Route: `GET /api/v1/drift` | per-feature PSI + prediction drift |
| `frontend/src/Drift.jsx` | the dashboard |

## PSI

$$\text{PSI} = \sum_b (A_b - E_b)\ln\!\frac{A_b}{E_b}$$

where $E_b$ is the expected (training) proportion in bin $b$ and $A_b$ the actual
(live) proportion.

Conventions — follow exactly, they match the training notebook:
- 10 bins, edges from the **training** distribution's deciles
- Binary features: two bins split at 0.5
- Add 1e-6 to every proportion before the log, so an empty bin cannot produce `inf`
- Bands: `< 0.1` stable · `0.1–0.25` moderate · `> 0.25` significant

**The reference distribution.** PSI needs training-side bin proportions. The bundle
does not ship them. Two options — pick one and record which in BUILD_LOG:

1. **Preferred:** add a `reference_bins` block to `models/model_config.json`,
   generated once from the training frame. If the user still has the Colab session,
   ask them to export it.
2. **Fallback:** use `model_config.json`'s per-feature `min`/`max`/`median` to build
   an approximate uniform reference, and **label the dashboard clearly** as using an
   approximate reference. Do not present approximate PSI as exact.

Never invent a reference distribution silently.

## Endpoint

```json
{
  "n_assessments": 412,
  "window": {"from": "...", "to": "..."},
  "reference": "training_bins" | "approximate",
  "features": [
    {"feature": "age", "psi": 0.043, "band": "stable"}
  ],
  "prediction_drift": {
    "mean_probability": 0.051,
    "flag_rate": 0.37,
    "expected_flag_rate": 0.39
  }
}
```

## Dashboard

- Horizontal PSI bars, one per feature, sorted descending, coloured by band with
  the 0.1 and 0.25 thresholds marked
- A summary line: `n features stable, m moderate, k significant`
- Prediction-drift panel: live flag rate vs the expected ~39%
- A note naming which reference was used

If `reference` is `"approximate"`, show a banner saying so. An examiner who spots
an undisclosed approximation will discount the whole dashboard.

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | `GET /api/v1/drift` | 200 with all 21 features |
| 2 | PSI of a distribution against itself | ≈ 0 (< 1e-6) |
| 3 | PSI of an obviously shifted distribution | > 0.25 |
| 4 | Empty bins produce no `inf`/`nan` | verified |
| 5 | Bands assigned at the right cutoffs | unit-checked at 0.1 and 0.25 |
| 6 | Dashboard renders and sorts descending | manual |
| 7 | Reference type is disclosed in the UI | manual |
| 8 | Fewer than 30 rows → dashboard says so rather than showing noise | manual |

Checks 2 and 3 are the ones that prove the implementation. Write them as a small
script and paste the output into BUILD_LOG.

## Exit protocol
1. Append Module 4 to `logs/BUILD_LOG.md` with checks 2 and 3 output.
2. Log in `logs/AUDIT_LOG.md`: which reference distribution was used and why.
3. Mark Module 4 ✅. Set current module to `COMPLETE`.
4. Write a short summary in STATE.md: what was built, what is left for a later
   phase (OCR ingestion, deployment).
5. Say: *"All modules complete."* Stop.
