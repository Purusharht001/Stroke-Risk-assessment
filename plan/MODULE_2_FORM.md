# MODULE 2 — Intake form

**Goal:** a Vite + React + Tailwind form collecting the 21 Model B fields, computing
BMI client-side, and POSTing integer-coded values to `/api/v1/predict`.

## Required reading
- `CLAUDE.md`
- `docs/DATA_DICTIONARY.md` — fields, codes, question wording
- `docs/UI_COPY_RULES.md` — banned and required phrasing

Do **not** read the model card or the dossier. No backend changes in this module.

## Preconditions
Module 1 ✅ and the backend running. Verify with `curl localhost:PORT/health`.

## Files to create

| Path | Purpose |
|---|---|
| `frontend/` | `npm create vite@latest frontend -- --template react` |
| `frontend/src/App.jsx` | routing between form and result |
| `frontend/src/Form.jsx` | the 21 fields |
| `frontend/src/api.js` | fetch wrapper |
| `frontend/src/copy.js` | every user-facing string, in one place |
| `frontend/tailwind.config.js` | Tailwind setup |

**Vite, not Next.js.** Static build, no SSR. The app is a form, a result page, and
a dashboard — routing and server rendering buy nothing here.

`copy.js` exists so the UI-copy grep in the acceptance checks has one file to
audit rather than a component tree.

## Form structure

Three steps, matching the tiers in the data dictionary. A single 21-field wall is
worse for completion than three short screens.

| Step | Fields |
|---|---|
| 1 — About you | age, is_female, height_cm, weight_kg, urban_rural, education, marital, own_home, veteran |
| 2 — Medical history | high_bp, high_chol, diabetes, chd_or_mi, kidney_disease, copd, depression, arthritis |
| 3 — Lifestyle & access | smoker_status, heavy_drink, binge_drink, has_insurance, cost_barrier |

Progress indicator. Back/next. Validate per step, not only on submit.

## Rules that are correctness, not style

**1. Question wording.** Every clinical field reads *"Has a doctor ever told you
that you..."*. Copy the exact strings from `docs/DATA_DICTIONARY.md`. This is a
model-correctness requirement — the training data asked exactly that question, and
rephrasing shifts the input distribution away from what the calibrator was fitted
on. See the data dictionary's closing section.

**2. Integer codes.** `smoker_status`, `education`, `marital` submit as integers
(1–4, 1–4, 1–6). A radio group's value must be the number, not the label. Assert
this in the payload builder.

**3. BMI is computed, never asked.**
```js
const bmi = weightKg / Math.pow(heightCm / 100, 2);
```
Collect weight (25–300 kg) and height (100–250 cm). Validate the computed BMI into
12–70. On failure, show the error on the height and weight fields — the user never
sees a BMI field, so an error attached to one is meaningless.

**4. Binary encoding.** `0`/`1`, with the three exceptions in the data dictionary
(`is_female`, `urban_rural`, `own_home`). Read them; do not guess.

**5. No banned copy.** The grep in the acceptance checks must return zero.

## Rendering from the API schema

`GET /api/v1/schema` returns the live ranges. Use them for the numeric inputs'
`min`/`max` rather than hardcoding, so a retrain propagates without a frontend edit.
Labels and question text stay in `copy.js` — the API carries ranges, not wording.

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | `npm run build` | succeeds, no errors |
| 2 | All 21 fields present and reachable | manual pass through the 3 steps |
| 3 | Submitted payload has exactly 21 keys | logged and inspected |
| 4 | `smoker_status`/`education`/`marital` are numbers | `typeof === "number"` |
| 5 | BMI computed, not collected | no input with `name="bmi"` |
| 6 | 70kg / 175cm → bmi ≈ 22.86 | within 0.01 |
| 7 | Every clinical question starts "Has a doctor ever told you" | grep `copy.js` |
| 8 | Banned-copy grep | zero hits (command below) |
| 9 | Footer disclaimer visible on every screen | manual |
| 10 | Full submit returns a probability | end-to-end against the live backend |

Check 8 command:
```bash
grep -rniE "your (stroke )?risk|high risk|low risk|risk of future|you will have|chance of stroke|reduce your risk|diagnos" frontend/src/
```

## Exit protocol
1. Append Module 2 to `logs/BUILD_LOG.md` with all 10 results, including the exact
   grep output for check 8.
2. Log in `logs/AUDIT_LOG.md`: the UI-copy compliance check and its result.
3. Record the frontend dev port in STATE.md.
4. Mark Module 2 ✅, set current to `MODULE_3_RESULTS`.
5. Say: *"Module 2 complete. Open a new tab and say continue."* Stop.
