# MODULE 0 — Setup & model verification

**Goal:** prove the model bundle runs correctly on this machine before a single
line of application code exists.

This module is deliberately small. A scikit-learn version mismatch found now costs
five minutes; found after the form is built, it looks like a mysterious prediction
bug.

## Required reading
- `CLAUDE.md` (already read)
- `docs/MODEL_CARD.md` — bundle structure and the four-step inference contract

Do **not** read the data dictionary, UI rules, or dossier in this module.

## Preconditions — verify before starting

The four Colab files must already be in `models/`. If any is missing, stop and
tell the user which one. Do not fabricate a bundle.

```
models/stroke_model.joblib
models/model_config.json
models/sanity_input.csv
models/sanity_expected.npy
```

## Files to create

| Path | Purpose |
|---|---|
| `backend/requirements.txt` | pinned deps, versions read from the bundle |
| `backend/verify_model.py` | the sanity check, runnable standalone |
| `.env.example` | env var names, no values |
| `.gitignore` | excludes `models/*.joblib`, `.env`, `node_modules`, `venv` |

## Steps

1. Create a venv at `backend/venv` (or use `uv`). Record which in BUILD_LOG.

2. Read the bundle's `meta` block and pin those exact versions:
   ```python
   import joblib; print(joblib.load("models/stroke_model.joblib")["meta"])
   ```
   Write `backend/requirements.txt` with `scikit-learn==`, `xgboost==`,
   `numpy==` at the versions the bundle reports, plus: `fastapi`, `uvicorn[standard]`,
   `pydantic>=2`, `pandas`, `joblib`, `psycopg[binary]`, `shap`, `python-dotenv`.

3. Install. If scikit-learn refuses to build on this Python version, report the
   conflict to the user rather than silently installing a different version.

4. Write `backend/verify_model.py`. It must:
   - load the bundle, print `meta`
   - print Model B's feature count and threshold
   - load `sanity_input.csv`, reorder to `M["features"]`, transform, predict,
     calibrate
   - compare against `sanity_expected.npy`, print max absolute difference
   - exit non-zero if max diff >= 1e-6

5. Run it.

6. Start Postgres and create the database. Record the connection string shape in
   `.env.example` as `DATABASE_URL=postgresql://user:pass@localhost:5432/neuroflow`.
   Do not put real credentials in any tracked file.

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | All four model files present | yes |
| 2 | `python backend/verify_model.py` | exits 0 |
| 3 | Max absolute difference | < 1e-6 |
| 4 | Model B feature count | == 21 |
| 5 | Model B threshold | a float in (0, 0.5) |
| 6 | `psql $DATABASE_URL -c 'select 1'` | succeeds |

If check 2 or 3 fails, it is a version mismatch. Stop, record the installed
versions and the bundle's expected versions in STATE.md under Blockers, and tell
the user. Do not proceed to Module 1 with a failing sanity check.

## Exit protocol

1. Fill in the **Environment facts** table in `plan/STATE.md` — every row.
2. Append the Module 0 block to `logs/BUILD_LOG.md`.
3. Mark Module 0 ✅ in the ledger, set current module to `MODULE_1_BACKEND`.
4. Say: *"Module 0 complete. Open a new tab and say continue."* Then stop.
