# AUDIT_LOG

One row per decision that engages a hard rule in `CLAUDE.md` §3. Every row names
the rule. If something was done that a module spec did not authorise, it belongs
here with a justification — not silently in the code.

| Date | Module | Rule | Decision | Justification |
|---|---|---|---|---|
| 2026-09-27 | 0 | §3.1 version pinning | Pinned scikit-learn 1.6.1, xgboost 3.4.1, numpy 2.1.3 (read from bundle meta bytes; confirmed by booster's embedded version [3,4,1]) | Exact match to training runtime |
| 2026-09-27 | 0 | §3.1 never modify model | BLOCKED, asked user. Bundle fails to unpickle on Windows even at exact versions: XGBoost's training `rng_state` (libstdc++ mt19937 text, 625 decimal tokens) is unreadable by the MSVC build (expects 624 hex tokens). Diagnostic in scratch only: swapping that field for a Windows-format value gives max diff 1.49e-8, 21 features, threshold 0.02784. No bundle file modified. | Training-only RNG does not affect predictions, but altering the loaded booster touches §3.1, so the user decides between (a) running the backend under WSL Ubuntu with no change, and (b) the load-time rng_state shim |
| 2026-09-27 | 0 | §3.1 never modify model | RESOLVED: user chose (a) WSL Ubuntu. Bundle loads unmodified on Linux; verify_model.py max diff 1.490e-08, installed == expected for sklearn/xgboost/numpy. No shim exists in the codebase. | Satisfies §3.1 with zero changes to the model object |
| 2026-09-27 | 1 | §3.1 Model B only | `backend/model.py` indexes `["model_B"]` straight off the loaded bundle and keeps no reference to the rest of it. No route touches model_A; `grep -rn model_A backend/*.py` → 0 hits | model_A carries 7 post-stroke-state features; it is academic-only |
| 2026-09-27 | 1 | §3.1 four-step contract | Reorder to `features`, `.astype(float)`, transform, predict_proba, calibrator.predict, compare. The float cast matches the training dtype (the one-hot categories are `1.0`…). Bundle and TreeExplainer are built once at import | Check 10: API output vs sanity_expected.npy max diff 0.0 |
| 2026-09-27 | 1 | §3.1 SHAP scale | SHAP values come from the raw XGBoost log-odds, before calibration. One-hot columns (`smoker_status_*`, `marital_*`) are summed back to their source feature, so every contribution names one of the 21 real fields | Isotonic calibration is monotonic, so direction and ranking hold; the magnitudes are log-odds, not probability points |
| 2026-09-27 | 1 | §3.3 no identifiers | `PatientInput` uses `extra="forbid"`, so any field outside the 21 is rejected with 422 (tested with `name`). `inputs` = `model_dump()` of the 21 fields. No IP, user agent or name is read or stored | Hard rule §3.3 |
| 2026-09-27 | 1 | §3.3 fixed schema | `001_init.sql` applied verbatim (plus `IF NOT EXISTS` and `pgcrypto`, already present from Module 0 scaffolding). No columns added | Hard rule §3.3 |
| 2026-09-27 | 1 | §3.2 dynamic schema | `schema.py` builds `PatientInput` with `create_model` from `model_config.json` → `schema`, filtered to the bundle's 21 features in fitted order. Type map: numeric→float, binary/categorical→int. Bounds come from the config's min/max. `grep -c "ge=18" backend/schema.py` → 0 | A retrain that shifts a range propagates without code changes |
| 2026-09-27 | 1 | §3.3 data hygiene | The 3 rows the acceptance run inserted were deleted afterwards (the table was empty beforehand) | Keeps test traffic out of Module 4's drift distribution |
| 2026-09-27 | 2 | §3.4 UI copy | Ran the banned-copy grep `grep -rniE "your (stroke )?risk\|high risk\|low risk\|risk of future\|you will have\|chance of stroke\|reduce your risk\|diagnos" frontend/src/`. Output, exactly one hit: `frontend/src/copy.js:8:  footer: 'Screening estimate from self-reported survey data, not a diagnosis.',`. Accepted: the only hit is the footer that §3.4 and UI_COPY_RULES require verbatim. The `diagnos` pattern exists to catch "diagnosis"/"diagnosed as" claims; the footer negates one. No other user-facing string matches. The string was not obfuscated to dodge the grep. Effective check: `… \| grep -v "not a diagnosis"` → 0 hits | CLAUDE.md §8: this file wins over a module spec. The spec's "zero hits" conflicts with the required footer, so the footer wins |
| 2026-09-27 | 2 | §3.4 UI copy | All user-facing strings live in `frontend/src/copy.js`. Result view uses "This profile scores X% on our screening model", "Flagged for follow-up"/"Not flagged", and "Most flagged profiles do not have a stroke history." The flag threshold shown is derived from the API's `threshold` (2.8%), not the "3.3%" example in UI_COPY_RULES. The "~86% captured" recall figure is left for Module 3 to source from the model card. Neutral slate palette, no traffic-light colours | Showing a flag without the precision caveat is banned by UI_COPY_RULES. The number has to match the live config |
| 2026-09-27 | 2 | §3.2 dynamic schema (frontend) | Age min/max and the BMI range come from `GET /api/v1/schema` at runtime. Categorical codes are range-checked against the schema in `buildPayload`. Height 100–250 cm and weight 25–300 kg are hardcoded in `Form.jsx`: they are form-only inputs and not in model_config.json (bounds from DATA_DICTIONARY) | Config-carried ranges are never hardcoded |
| 2026-09-27 | 2 | §3.3 data hygiene | The e2e check and one curl probe inserted 2 rows (ids 931c0be4…, 6c304c33…). Deleted by id afterwards; table back to 0 rows | Keeps test traffic out of Module 4's drift distribution |

---

## Rules that must be logged when touched

| Rule | Where |
|---|---|
| Serve Model B only | CLAUDE.md §3.1 |
| Calibrate before thresholding | CLAUDE.md §3.1 |
| Reorder columns to the fitted order | CLAUDE.md §3.1 |
| Never refit at runtime | CLAUDE.md §3.1 |
| Validators generated from model_config.json | CLAUDE.md §3.2 |
| No identifiers stored | CLAUDE.md §3.3 |
| Fixed assessments schema | CLAUDE.md §3.3 |
| UI copy bans | CLAUDE.md §3.4, docs/UI_COPY_RULES.md |
| LLM guardrails and fallback | CLAUDE.md §3.5 |

## Mandatory entries per module

| Module | Must log |
|---|---|
| 0 | installed versions vs bundle versions; sanity max diff |
| 1 | Model-B-only; no-identifier; dynamic-schema |
| 2 | UI-copy grep result (paste the command output) |
| 3 | LLM guardrail design; filter banned list; fallback behaviour |
| 4 | which reference distribution was used, and why |
| 2026-09-27 | 3 | §3.5 LLM narrative | Guardrail design: system prompt carries all six UI_COPY_RULES constraints; /narrative accepts only {feature, direction}, feature validated against Model B FEATURES (422 otherwise), max 5 items; LLM sees no model A data | Model B only, enforced at the trust boundary rather than by prompt alone |
| 2026-09-27 | 3 | §3.5 LLM narrative | Post-filter banned list (lowercased substrings): risk, future, will have, "will ", likely, chance, predict; caus, leads to, led to, result(s/ed) in, increas, reduc, raise, raising, lowers, lowered, lowering, drive, driving, contribut, protect, because, due to; you should, should, recommend, advise, advice, consult, see a doctor, consider, try to; diagnos; model a, general health, physical activity, exercise, mental health, employ, checkup, check-up, personal doctor. Plus >2 sentences rejects | Stems catch inflections the skill's list missed ("increased"). "lower" itself is allowed so the required "lower-scoring profiles" framing passes. Over-rejection is safe: the fallback is bars only |
| 2026-09-27 | 3 | §3.5 LLM narrative | Fallback: 5s total budget across claude-haiku-4.5 → gemini-2.5-flash; error/timeout tries next; filter rejection returns null with no retry; no key → null. Client fetch is fire-and-forget with a 7s abort and never rejects; null renders nothing | "Never block the result page"; UI_COPY_RULES: LLM unavailable → render nothing, no apology |
| 2026-09-27 | 3 | §3.4 UI copy | Threshold sentence renders the served threshold (2.8%) instead of the spec's "3.3%" | Stating a threshold the app does not use would be false copy; recall ~86% taken from MODEL_CARD |
| 2026-09-27 | 3 | §3.4 UI copy | Score bar and SHAP bars use a single neutral slate palette; SHAP direction carried by side of centre line + text | No traffic-light severity encoding |
| 2026-09-27 | 3 | §3.4 UI copy | Banned-copy grep: one hit, footer "not a diagnosis" (standing exception from Module 2). DAG caption uses "causation" only in the required methodological sentence | Grep result recorded per UI_COPY_RULES checklist |
| 2026-09-28 | 4 | Module 4 reference rule ("never invent a reference silently") | PSI uses option 1: training `reference_bins` from model_config.json; `reference: "training_bins"` returned and named in the UI footnote | Exported from the training frame and verified 0.00e+00 against the notebook psi() (Module 0). The exact reference was available, so the approximation fallback was not needed |
| 2026-09-28 | 4 | §3.2 Validation (config is the source of truth) | Drift edges, expected proportions and ε come from `CONFIG["reference_bins"]`. Nothing is hardcoded; `schema._cfg` renamed `CONFIG` so drift.py reads the same load | One config load, no duplicated constants |
| 2026-09-28 | 4 | §3.1 Model (Model B only; no refit) | Expected flag rate derived read-only from `bundle["model_B"]["test_metrics"]` (43.4%), replacing the spec's ~39%; drift reads only `model_version = 'model_B'` rows | Bundle figure is exact; nothing refitted, Model A untouched |
| 2026-09-28 | 4 | §3.3 Data (fixed schema, no identifiers) | 40 demo rows inserted with existing column `source = 'seed'`; no new columns, no identifiers | Module 4 precondition needs ≥ 30 rows; tagging keeps them separable and deletable |
| 2026-09-28 | 4 | §3.3 Data | At the user's request: re-seeded 40 `source='seed'` rows for the check-6 screenshot, then deleted all seed rows (40). Table holds only the 2 form rows | Demo data removed so it cannot be mistaken for real traffic |
| 2026-09-28 | 4 | §3.4 UI copy | Drift page uses PSI/band language only, with no per-person risk wording. Neutral colour scale. Persistent footer still wraps the view. Small-sample caveat shown when n < 1000 | Banned-copy grep: 0 hits excluding footer |
| 2026-09-28 | Restyle | §3.4 UI copy (new strings) | Added `COPY.rail.form` (2 notes) and `COPY.rail.result` (2 notes) to copy.js, verbatim from the user's request. Checked against UI_COPY_RULES: no banned phrase; the stroke question is quoted in the past tense ("had a stroke"); "It cannot see forward in time" disclaims future framing; "stored without any name or identifier" matches §3.3 | Banned-copy grep after the change: 0 hits excluding footer. No existing string modified |
| 2026-09-28 | Restyle | §3.4 UI copy (score rendering) | Large numeral is `aria-hidden`; the required "This profile scores X% on our screening model." sentence is still rendered as its caption. Mockup-only strings were not ported | Headline wording rule kept intact; no unreviewed copy shipped |
| 2026-09-28 | Restyle | §3.4 UI copy (no traffic lights) | Single non-semantic accent (#2D5B8E / dark #7FA9D6). Error text and drift bands moved off red/indigo onto tokens | UI_COPY_RULES: no red/amber/green severity claim |
| 2026-09-28 | Restyle | §3.3 Data | Two test submissions from the browser check added 2 rows (`source='form'`, no identifiers) | Needed to verify end-to-end scoring; left in place, not deleted without the user's say-so |
| 2026-09-28 | Post-4 | §3.1 Model (calibrate → threshold; never modify calibrator) | `/api/v1/predict` returns `min(prob, 0.99)`. `flagged` is still decided on the raw calibrated value, and `assessments.probability` stores the raw value. Result page renders `>99%` when `probability >= 0.99` (figure, caption, scale aria-label) | Isotonic calibration saturates at exactly 1.0 when its top PAV block is pure-positive, reachable by answering "yes" to every condition; a displayed 100% overstates certainty. Preprocessor, model and calibrator untouched; 0.99 > threshold 0.0278, so no flag can change. Verified: saturating profile → API 0.99 / "99.0%", stored 1.0, flagged true |
| 2026-09-28 | Post-4 | §3.3 Data | Deleted the 2 restyle test rows (ids 40ec832d…, 0ea87a18…) and the 1 clamp-check row (9bb76704…). Table back to the 2 original form rows | At the user's request; test traffic removed so it is not mistaken for real use |
| 2026-10-06 | Ad-hoc | 3.4 UI copy / 3.6 | Added static BE FAST "call 112" notice on form and result pages | Explicit user request; fixed public-health emergency text, not model output or personalised advice — same category as the chatbot emergency card. |
| 2026-10-06 | Ad-hoc | DATA_DICTIONARY verbatim wording | Veteran question label changed to drop "US" | Explicit user request; display text only — feature name `veteran` and 0/1 encoding unchanged, so model input is unaffected. |
| 2026-10-06 | Ad-hoc | 3.4 UI copy (no severity colour) | Warm brick colour used for the static BE FAST notice | Colour applies only to the fixed emergency notice, never to the score, flag or bars, so it makes no severity claim about model output. |
| 2026-10-06 | Closure | §3.6 Chatbot (optional module) | Project closed without building Module 5 | User instruction "close the project"; STATE.md says the project is complete and defensible after Module 4 |
