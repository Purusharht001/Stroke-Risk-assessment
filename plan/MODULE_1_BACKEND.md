# MODULE 1 — Backend core

**Goal:** a running FastAPI service that loads Model B, validates input against
`model_config.json`, returns a calibrated probability with SHAP contributions, and
persists each assessment to Postgres.

## Required reading
- `CLAUDE.md`
- `docs/MODEL_CARD.md` — the four-step inference contract
- `docs/DATA_DICTIONARY.md` — the 21 fields and their codes

Do **not** read the UI copy rules or the dossier. No frontend work in this module.

## Preconditions
`plan/STATE.md` shows Module 0 ✅ with sanity max diff < 1e-6. If not, stop.

## Files to create

| Path | Purpose |
|---|---|
| `backend/main.py` | FastAPI app, routes |
| `backend/model.py` | bundle loading, inference, SHAP |
| `backend/schema.py` | Pydantic model generated from `model_config.json` |
| `backend/db.py` | connection + insert + the two read queries Module 4 needs |
| `backend/sql/001_init.sql` | the schema below, verbatim |

Five files. Resist adding a services layer, a repository layer, or DTO classes —
see `CLAUDE.md` §4.

## Database schema — exact, do not extend

```sql
CREATE TABLE assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  inputs        JSONB NOT NULL,
  probability   REAL NOT NULL,
  flagged       BOOLEAN NOT NULL,
  threshold     REAL NOT NULL,
  model_version TEXT NOT NULL,
  shap_top      JSONB,
  source        TEXT NOT NULL DEFAULT 'form'
);
CREATE INDEX idx_assessments_created ON assessments (created_at DESC);
```

Needs `pgcrypto` for `gen_random_uuid()` on older Postgres; on 13+ it is built in.

**Store no identifiers.** No name, email, IP, or user agent. `inputs` holds the 21
clinical fields and nothing else.

## Dynamic Pydantic — the important part

`backend/schema.py` must **build the validators by reading `models/model_config.json`
at import time**. Do not hardcode ranges.

```python
# shape, not a prescription
cfg = json.load(open(MODELS / "model_config.json"))
fields = {}
for name, spec in cfg["schema"].items():
    if name not in MODEL_B_FEATURES:      # config carries all 28; keep 21
        continue
    ...  # build (type, Field(ge=spec["min"], le=spec["max"]))
PatientInput = create_model("PatientInput", **fields)
```

Two consequences to honour:
- `model_config.json` carries the schema for **all 28** Model A features. Filter to
  the 21 in `bundle["model_B"]["features"]`.
- If a future retrain shifts a range, the API follows automatically. That is the
  point.

`bmi` arrives already computed from the client. Validate it 12–70; do not accept
height/weight at the API.

## Routes

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | `{status, model_loaded, model_version}` |
| GET | `/api/v1/schema` | the filtered input schema, for the form to render from |
| POST | `/api/v1/predict` | the prediction object below |
| GET | `/api/v1/assessments?limit=` | recent rows, for Module 4 |

`POST /api/v1/predict` response:

```json
{
  "id": "uuid",
  "probability": 0.0842,
  "percent": "8.4%",
  "flagged": true,
  "threshold": 0.0328,
  "model_version": "model_B",
  "contributions": [
    {"feature": "age", "value": 67, "shap": 0.031, "direction": "up"}
  ],
  "disclaimer": "Screening estimate from self-reported survey data, not a diagnosis."
}
```

Cap `contributions` at the top 5 by absolute SHAP value. Persist the same 5 into
`shap_top`.

## Inference rules — non-negotiable

Copy the four-step contract from `docs/MODEL_CARD.md` exactly. Specifically:
- reorder to `M["features"]` before transforming
- `calibrator.predict([raw])[0]` before comparing to threshold
- never refit anything at runtime
- load the bundle **once** at startup, not per request

Build the SHAP `TreeExplainer` once at startup too. Constructing it per request
adds seconds of latency.

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | `GET /health` | 200, `model_loaded: true` |
| 2 | Valid payload → `POST /api/v1/predict` | 200, probability in [0,1] |
| 3 | `age: 200` | 422, message names `age` |
| 4 | Missing required field | 422 |
| 5 | A row lands in `assessments` | `SELECT count(*)` increments by 1 |
| 6 | Stored `probability` matches the response | equal to 6 dp |
| 7 | `contributions` has ≤ 5 entries, each with a real feature name | yes |
| 8 | Schema is generated, not hardcoded | `grep -c "ge=18" backend/schema.py` returns 0 |
| 9 | Model A is unreachable | `grep -rn "model_A" backend/` finds no route or response use |
| 10 | Two rows from `sanity_input.csv` through the API | match `sanity_expected.npy` to 1e-6 |

Check 10 is the one that catches a column-ordering bug. Do not skip it.

## Exit protocol
1. Append the Module 1 block to `logs/BUILD_LOG.md` with all 10 check results.
2. Log in `logs/AUDIT_LOG.md`: the Model-B-only decision, the no-identifier
   decision, and the dynamic-schema decision.
3. Record backend port and DATABASE_URL var name in STATE.md's env facts.
4. Mark Module 1 ✅, set current to `MODULE_2_FORM`.
5. Say: *"Module 1 complete. Open a new tab and say continue."* Stop.
