# BUILD_LOG

Append one block per completed module. Never edit a previous block — if something
was wrong, append a correction with the date.

Template:

```markdown
## Module N — <name>
- Date: YYYY-MM-DD
- Session: <tab N>
- Files created: <list>
- Files modified: <list>
- Commands run: <list>
- Acceptance checks:
  | # | Check | Result |
  |---|---|---|
  | 1 | ... | PASS/FAIL |
- Deviations from the module spec: <none, or what and why>
- Next: Module N+1
```

---

_(no modules completed yet)_

## Module 0 — Setup & model verification (BLOCKED, not complete)
- Date: 2026-09-27
- Session: tab 1
- Files created: backend/requirements.txt
- Files modified: none (verify_model.py, .env.example, .gitignore already existed and met spec)
- Commands run: `uv run --no-project` scratch envs to read bundle meta and diagnose; psql `select 1`
- Env: no venv created yet, pending the platform decision (Windows vs WSL)
- Acceptance checks:
  | # | Check | Result |
  |---|---|---|
  | 1 | Four model files present | PASS |
  | 2 | verify_model.py exits 0 | FAIL on Windows: XGBoostError "input stream corrupted" at unpickle |
  | 3 | Max abs diff < 1e-6 | NOT RUN by verify_model.py; 1.49e-8 in scratch diagnostic with rng_state swapped |
  | 4 | Model B feature count == 21 | PASS (21, from diagnostic) |
  | 5 | Threshold in (0, 0.5) | PASS (0.027838, from diagnostic) |
  | 6 | psql select 1 | PASS only after URL-encoding the `@` in the .env password; as written, the URL does not parse |
- Deviations from the module spec: none; stopped at the blocker as the spec requires
- Next: resolve blocker (see STATE.md), then finish Module 0

## Module 0 — Setup & model verification (COMPLETE, supersedes the BLOCKED block above)
- Date: 2026-09-27
- Session: tab 2
- Files created: backend/.venv (WSL, uv, Python 3.12.3), C:\Users\PC\.wslconfig (networkingMode=mirrored)
- Files modified: none in repo (user changed .env DATABASE_URL password themselves)
- Commands run: uv installed to WSL ~/.local/bin (no sudo); `uv venv backend/.venv --python 3.12`;
  `uv pip install -r backend/requirements.txt`; `backend/.venv/bin/python backend/verify_model.py`;
  `wsl --shutdown` to apply mirrored networking; psycopg `select 1` from WSL
- Acceptance checks:
  | # | Check | Result |
  |---|---|---|
  | 1 | Four model files present | PASS |
  | 2 | verify_model.py exits 0 (WSL) | PASS |
  | 3 | Max abs diff < 1e-6 | PASS (1.490e-08) |
  | 4 | Model B feature count == 21 | PASS |
  | 5 | Threshold in (0, 0.5) | PASS (0.0278) |
  | 6 | psql select 1 | PASS (Windows psql, and psycopg from WSL via localhost) |
- Deviations from the module spec: venv is `backend/.venv` not `backend/venv`, because a
  Windows-Python venv (user-created, not by Claude) already occupies `backend/venv` and
  cannot run under WSL. It was left untouched.
- Next: Module 1 — backend runs **inside WSL Ubuntu**:
  `wsl -d Ubuntu`, `cd /mnt/d/sem7/healthcare/neuroFlow`, `backend/.venv/bin/python ...`

## Module 1 — Backend core (FastAPI + Postgres)
- Date: 2026-09-27
- Files created: backend/main.py, backend/model.py, backend/schema.py, backend/db.py
- Files modified: none (backend/sql/001_init.sql already matched the spec verbatim; kept)
- Commands run: applied 001_init.sql via psycopg (WSL);
  `backend/.venv/bin/uvicorn main:app --app-dir backend --port 8000` (WSL, from repo root);
  acceptance script (scratchpad, urllib + psycopg); deleted the 3 test rows afterwards
- Acceptance checks:
  | # | Check | Result |
  |---|---|---|
  | 1 | GET /health | PASS (200, model_loaded true) |
  | 2 | Valid payload → predict | PASS (200, p=0.0877) |
  | 3 | age: 200 | PASS (422, loc ['body','age']) |
  | 4 | Missing field | PASS (422, loc ['body','bmi']) |
  | 5 | Row lands in assessments | PASS (count 0 → 1) |
  | 6 | Stored probability == response to 6 dp | PASS (0.0877193) |
  | 7 | ≤5 contributions, real feature names | PASS (age, diabetes, high_bp, chd_or_mi, depression) |
  | 8 | `grep -c "ge=18" backend/schema.py` | PASS (0) |
  | 9 | model_A unreachable | PASS (0 hits in backend/*.py) |
  | 10 | 2 sanity rows via API vs sanity_expected.npy | PASS (max diff 0.0) |
- Deviations from the module spec:
  - db.py's two reads are `recent(limit)` and `count()`. Module 4 may need a different second read.
  - Extra fields are rejected with 422 (`extra="forbid"`), a no-identifier safeguard.
  - No CORS middleware. Module 2 should use a Vite dev proxy to :8000, or add CORS then.
  - psycopg warns `unknown PostgreSQL timezone 'Asia/Calcutta'; will use UTC`. Harmless:
    TIMESTAMPTZ values are still correct.
- Next: Module 2 — intake form

## Module 2 — Intake form
- Date: 2026-09-27
- Files created: frontend/ (Vite 8 + React 19 scaffold), frontend/src/copy.js, frontend/src/api.js,
  frontend/src/Form.jsx
- Files modified: frontend/src/App.jsx, frontend/src/index.css, frontend/vite.config.js,
  frontend/index.html (title); removed scaffold boilerplate (App.css, src/assets, public/icons.svg)
- Commands run: `npm create vite@latest frontend -- --template react` (from Git Bash: PowerShell's
  npm shim swallowed `--template` and produced vanilla-TS, which was discarded);
  `npm install -D tailwindcss @tailwindcss/vite`; `npm run build`;
  `npx vite --host 127.0.0.1 --port 5173`; backend started in WSL per STATE.md;
  scratchpad `m2check.mjs` (node, imports src/api.js + src/copy.js, hits the Vite proxy);
  headless Edge `--dump-dom` of step 1
- Acceptance checks:
  | # | Check | Result |
  |---|---|---|
  | 1 | `npm run build` | PASS (19 modules, 0 errors) |
  | 2 | All 21 fields present and reachable | PARTIAL: step 1 verified by headless render (age, is_female, height_cm, weight_kg, urban_rural, education, marital, own_home, veteran). Script confirms FIELDS cover all 21 schema features (height+weight → bmi). A manual click-through of steps 2–3 is still owed by the user |
  | 3 | Payload has exactly 21 keys | PASS (21, in fitted order; also `console.log('predict payload', …)` on submit) |
  | 4 | smoker_status/education/marital are numbers | PASS (`typeof` number ×3; string-coded `marital` throws in buildPayload) |
  | 5 | No input `name="bmi"` | PASS (0 hits) |
  | 6 | 70 kg / 175 cm → 22.86 | PASS (22.8571) |
  | 7 | Clinical questions start "Has a doctor ever told you" | PASS (8/8 in copy.js) |
  | 8 | Banned-copy grep | PASS WITH LOGGED EXCEPTION: 1 hit, the mandatory footer: `frontend/src/copy.js:8:  footer: 'Screening estimate from self-reported survey data, not a diagnosis.',`. See AUDIT_LOG |
  | 9 | Footer on every screen | PARTIAL: rendered on step 1 (headless). It lives in App's layout outside the view switch, so every view gets it. Manual confirmation owed |
  | 10 | Full submit returns a probability | PASS (via Vite proxy: "This profile scores 19.6% on our screening model." Flagged for follow-up) |
- Deviations from the module spec:
  - No `tailwind.config.js`: Tailwind v4 with `@tailwindcss/vite` needs no config file (`@import "tailwindcss"` in index.css).
  - `computeBmi`/`buildPayload` live in `api.js`, not Form.jsx, so Node can test them without a browser.
  - App.jsx has a minimal result view (score, flag, caveat line). Module 3 replaces it.
  - Vite proxy targets `127.0.0.1:8000`, not `localhost`. On Windows `localhost` resolves to ::1 and times out against the WSL-mirrored port.
  - 2 test rows deleted from assessments afterwards (see AUDIT_LOG).
- Next: Module 3 — results page

## Module 3 — Results page (SHAP + LLM + DAG)
- Date: 2026-09-27
- Files created: frontend/src/Result.jsx, frontend/src/CausalDAG.jsx, backend/narrative.py
- Files modified: backend/main.py (POST /api/v1/narrative + request models), frontend/src/App.jsx (placeholder Result removed), frontend/src/copy.js (result + DAG copy, EXTRA_LABELS), frontend/src/api.js (getNarrative)
- Commands run: filter test (WSL venv python), `npx vite build`, banned-copy grep, backend restart in WSL, curl /health, /narrative, predict via Vite proxy
- Acceptance checks:
  1. Score sentence "This profile scores X% on our screening model." — PASS (COPY.result.score, unchanged from Module 2)
  2. Both threshold sentences — PASS ("Profiles above 2.8% are flagged so that roughly 86% of stroke-history cases are captured. Most flagged profiles do not have a stroke history.")
  3. No traffic lights — PASS by construction (slate-only palette; manual visual check pending with user)
  4. SHAP bars ≤ 5, "pushes score up/down" — PASS (slice(0,5); predict returned 5)
  5. Narrative ≤ 2 sentences — PASS (filter rejects >2; "A. B. C." rejected)
  6. Filter test — PASS: "Your high BMI causes increased risk" REJECTED; "This reduces your chance of stroke" REJECTED; "You should lower your blood pressure" REJECTED. Target shape "This profile differs from lower-scoring profiles mainly in age and blood pressure history." passes.
  7. LLM unavailable → page renders — PASS (OPENROUTER_API_KEY is empty; /narrative returns {"narrative": null}; client renders bars only, fetch never rejects)
  8. DAG: 7 excluded nodes, arrows outcome → descendants — PASS (CausalDAG.jsx; manual visual check pending)
  9. Banned-copy grep — PASS with the known footer exception (only hit: copy.js:8 "not a diagnosis")
  10. Footer on results page — PASS (fixed footer in App.jsx wraps every view)
- Deviations from the module spec:
  - Threshold rendered from the API (2.8%), not the spec's hardcoded "3.3%": config threshold is 0.02784.
  - OpenRouter called with stdlib urllib, not the `openai` client (CLAUDE.md §4 rung 2; no new dependency).
  - Live LLM output untested: no OpenRouter key configured.
- Next: Module 4 — Drift dashboard

## Module 4 — Drift dashboard (PSI)
- Date: 2026-09-28
- Files created: backend/drift.py, backend/check_drift.py (checks 2–5), backend/seed_demo.py, frontend/src/Drift.jsx
- Files modified: backend/main.py (`GET /api/v1/drift`), backend/db.py (`for_drift()`), backend/model.py (`EXPECTED_FLAG_RATE` from bundle test_metrics), backend/schema.py (`_cfg` → `CONFIG`, now shared with drift.py), frontend/src/App.jsx (`#drift` hash view + header link), frontend/src/api.js (`getDrift`), frontend/src/copy.js (`COPY.drift`)
- Commands run: `backend/.venv/bin/python backend/check_drift.py`; `backend/.venv/bin/python backend/seed_demo.py 40`; backend restart; `GET /api/v1/drift`; `npx vite build`; banned-copy grep (0 hits excluding the footer)
- Reference distribution: **option 1, `training_bins`** — `reference_bins` in model_config.json (exported from Colab, training years 2015/2017/2019, n=1,305,790). No approximation used.
- Data scale: **demonstration-scale.** The table had 2 form rows; 40 rows were seeded by `seed_demo.py` (inputs sampled from the training reference bins, scored through `model.predict`, stored with `source='seed'`). n = 42. Remove with `DELETE FROM assessments WHERE source = 'seed';`
- Checks 2–5 output (`check_drift.py`):
  ```
  [PASS] 2a reference vs itself, all 21 features: max |PSI| = 0.000e+00
  [PASS] 2b sample vs itself (decile edges): PSI = 0.000e+00
  [PASS] 3a N(50,10) vs N(65,10): PSI = 1.9895
  [PASS] 3b age: training vs live all 75-80: PSI = 10.5238
  [PASS] 3c high_bp: training vs live all 1: PSI = 8.4558
  [PASS] 4 one occupied bin, 9 empty, every feature: all finite, max PSI = 14.977
  [PASS] 5 bands at 0.1 and 0.25: {0.0: 'stable', 0.0999: 'stable', 0.1: 'moderate', 0.2: 'moderate', 0.25: 'moderate', 0.2501: 'significant', 3.0: 'significant'}
  ALL PASS
  ```
- Acceptance checks:
  1. `GET /api/v1/drift` — PASS (200, 21 features, reference `training_bins`, sorted descending)
  2. PSI against itself < 1e-6 — PASS (0.0)
  3. Shifted distribution > 0.25 — PASS (1.99 / 10.5 / 8.46)
  4. Empty bins give no inf/nan — PASS
  5. Band cutoffs at 0.1 and 0.25 — PASS (both edges → moderate)
  6. Dashboard renders and sorts descending — PASS (2026-09-28 re-run: 40 fresh seed rows, headless-Edge screenshot `logs/screenshots/module4_drift_check6.png`. Bars sort descending 1.263 → 0.000, 0.1/0.25 lines drawn, reference footnote and footer visible. Seeds then deleted: 40 removed, table back to 2 form rows, API `n=2 sufficient=false`)
  7. Reference disclosed in UI — PASS in code (footnote always shown; approximate banner if ever `approximate`); visual look pending
  8. < 30 rows → says so — PASS at API level (`sufficient` false for n = 0, 2, 29; true at 30); UI shows a message and hides bars/panel; visual look pending
- Live result at n = 42: 16 stable, 1 moderate (age), 4 significant (education 0.93, kidney_disease 0.40, marital 0.30, bmi 0.25). Flag rate 45.2% vs expected 43.4%. The significant values come from empty rare bins (no stored `education = 1`, no `kidney_disease = 1`). With ε = 1e-6 an empty bin alone adds ≈ E·ln(E/1e-6), about 0.83 for a 7% bin. This is small-sample inflation, not a defect; the dashboard states it when n < 1000.
- Deviations from the module spec:
  - Expected flag rate is 43.4%, computed from the bundle's 2023 test confusion matrix ((TP+FP)/N), not the spec's "~39%" (MODEL_CARD: "read test_metrics rather than quoting these").
  - Endpoint adds `sufficient` and `reference_source` fields. `psi`/`band` are null when n = 0.
  - Band colours are a neutral slate→indigo sequence, not traffic-light colours (consistent with Module 3).
  - Seeded directly via `model.predict` + SQL rather than by clicking the form: same inference path, and the rows are tagged `source='seed'`.
- Next: COMPLETE (Module 5 optional)

## Restyle — frontend presentation pass (outside the module plan)
- Date: 2026-09-28
- Reference: design artifact https://claude.ai/artifact/3QyrzEPpM3PSRfjHCXXyVF (record-sheet layout)
- Files created: `frontend/src/Rail.jsx` (step list + rail note, shared by Form and Result)
- Files modified: `frontend/src/index.css` (tokens incl. two dark-mode blocks, component classes), `frontend/index.html` (Public Sans + Newsreader from Google Fonts), `frontend/src/App.jsx` (masthead/shell/footer markup), `frontend/src/Form.jsx` (JSX and class names only), `frontend/src/Result.jsx` (score figure, measurement scale, diverging SHAP bars), `frontend/src/CausalDAG.jsx` and `frontend/src/Drift.jsx` (Tailwind colours → token utilities, e.g. `fill-(--ink)`), `frontend/src/copy.js` (one added `rail` block)
- Not touched: Form state/validation/`handleSubmit`, `api.js`, `backend/`
- Commands run: `npm run build`; banned-copy grep; colour greps over `src/` and `dist/assets/*.css`; headless-Edge CDP script (scratchpad, not committed) that tabs through step 1, fills all 3 steps, submits, and screenshots at 1280 / 375 px in light and dark
- Acceptance checks:
  1. `npm run build` — PASS
  2. Banned-copy grep — PASS (1 raw hit = the footer's "not a diagnosis", 0 excluding it, as in Module 2)
  3. copy.js only additions — PASS (a single inserted `rail` block, made as one insertion edit; no git in this repo, so there is no `git diff` to attach)
  4. 21 fields reachable, full submission scores — PASS (step 1: 9 inputs, step 2: 8, step 3: 5; height+weight → bmi = 21 features. Two submissions returned 100.0% "Flagged for follow-up" and 0.7% "Not flagged")
  5. Visible keyboard focus — PASS (11 Tab stops on step 1, each with a 2px solid accent outline; radio chips via `:has(input:focus-visible)`)
  6. 375 px — PASS (`scrollWidth` = 375 on form and result; screenshots `logs/screenshots/restyle_*`)
  7. No red/amber/green — PASS (no colour utilities or hex outside the token palette; the only "red" in built CSS is Tailwind's `@supports (color-mix(in lab, red, red))` feature query, which never renders)
  8. Footer on every screen — PASS (form, result, drift)
- Deviations from the reference design:
  - No view switcher (preview device) and no "N of 21 answered" counter: Form keeps `values` but never counts answers, so a counter would add logic and new copy.
  - Mockup-only strings not ported ("Basic details used by…", "screening score for this profile", "cutoff", "Scored against the whole survey population", "Base rate"). The sheet head shows the existing `stepOf`; the figure caption is the required `result.score` sentence; the cutoff label is the existing `thresholdMark`.
  - Each SHAP row keeps the full "<feature> — pushes score up/down" label (UI_COPY_RULES), placed on the opposite side of the axis; the "down" bars use `--muted` rather than `--rule-strong` for 3:1 graphic contrast.
  - Validation errors are ink text with an accent rule, no longer `text-red-700`.
- Side effect: the two check submissions added 2 `source='form'` rows to `assessments` (table now 4 rows).
- Next: unchanged (COMPLETE; Module 5 optional)

## Probability ceiling (post-Module 4)
- Date: 2026-09-28
- Files modified: `backend/main.py` (`PROB_CEILING = 0.99`, clamp on the returned float only), `frontend/src/Result.jsx` (renders `>99%` at the ceiling)
- Commands run: backend restart (WSL); saturating-profile POST to `/api/v1/predict`; `npm run build`; psql deletes
- Checks: API returns 0.99 / "99.0%" for the all-"yes" profile — PASS; DB keeps raw 1.0 — PASS; `flagged` unchanged — PASS; build — PASS
- Data: 2 restyle test rows + 1 check row deleted; `assessments` = 2 original rows
- Deviations: none. The DB keeps the raw value so drift's mean-probability stays faithful to the model

## Ad-hoc — colour palette swap
- Date: 2026-10-06
- Files modified: frontend/src/index.css (colour token values only; added --accent-2)
- Deviations from the module spec: user request outside the current module; colours only, no layout/copy/logic changes.

## Ad-hoc — BE FAST notice + veteran wording
- Date: 2026-10-06
- Files modified: frontend/src/App.jsx, frontend/src/copy.js, frontend/src/index.css
- Change: static BE FAST emergency notice shown above every form step and the result page; "US" removed from the veteran question label.
- Deviations from the module spec: user request outside the current module.

## Ad-hoc — BE FAST notice moved to sticky left rail
- Date: 2026-10-06
- Files modified: frontend/src/App.jsx, frontend/src/Rail.jsx, frontend/src/index.css
- Change: notice now lives at the top of the sticky left rail (form + result), brick-coloured so it stands out from the teal palette.
- Deviations from the module spec: user request outside the current module.

## Project closure
- Date: 2026-10-06
- Files modified: plan/STATE.md (current module → CLOSED; Module 5 marked not built)
- Commands run: checked ports 8000/5173 and WSL uvicorn processes; none were running
- Acceptance checks: n/a
- Deviations from the module spec: none. Module 5 (optional) not built, at the user's request
- Next: none — project closed
