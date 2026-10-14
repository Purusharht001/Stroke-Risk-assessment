# STATE.md

**The handoff file.** Read this second, after `CLAUDE.md`. Update it at the end of
every module. It is the only thing that tells a fresh session where the build is.

---

## Current position

| | |
|---|---|
| **Current module** | `CLOSED` |
| **Spec to read** | — |
| **Status** | PROJECT CLOSED by the user on 2026-10-06. Module 5 (chatbot) not built |
| **Last updated** | 2026-10-06 |
| **Last session ended** | Project closed. No dev servers running. `assessments` holds the 2 original form rows |

### Project summary (after Module 4)
**Built:** FastAPI backend serving Model B only (calibrate → threshold, config-generated validation, Postgres `assessments`); 3-step React intake form; results page with score bar, SHAP bars, guardrailed OpenRouter narrative (bars-only fallback) and causal DAG; PSI drift dashboard at `#drift` against the exact training reference bins, with prediction-drift panel (live vs 43.4% expected flag rate).
**Left for a later phase:** OCR/document ingestion of survey answers; deployment (hosting, HTTPS, managed Postgres, CORS/proxy config — currently dev servers only); real traffic to replace the 40 seeded rows (`DELETE FROM assessments WHERE source='seed'`); an OpenRouter key to exercise live narrative text; optional Module 5 chatbot.

---

## Module ledger

| # | Module | Spec file | Status | Completed |
|---|---|---|---|---|
| 0 | Setup & model verification | `MODULE_0_SETUP.md` | ✅ done | 2026-09-27 |
| 1 | Backend core (FastAPI + Postgres) | `MODULE_1_BACKEND.md` | ✅ done | 2026-09-27 |
| 2 | Intake form (Vite + React) | `MODULE_2_FORM.md` | ✅ done | 2026-09-27 |
| 3 | Results page (SHAP + LLM + DAG) | `MODULE_3_RESULTS.md` | ✅ done | 2026-09-27 |
| 4 | Drift dashboard (PSI) | `MODULE_4_DRIFT.md` | ✅ done | 2026-09-28 |
| 5 | Result chatbot (**OPTIONAL**) | `MODULE_5_CHATBOT.md` | ⬜ not built (project closed) | — |

Status values: ⬜ not started · 🟡 in progress · ✅ done · ❌ blocked · ⬜ optional

**Module 5 is optional.** The project is complete and defensible after Module 4.
Build 5 only if time remains. After Module 4, set the current module to
`MODULE_5_CHATBOT` if the user wants it, or `COMPLETE` if not — ask which.

---

## Environment facts discovered so far



Fill these in as modules establish them. A later module should never re-derive
something an earlier one already found.

| Fact | Value |
|---|---|
| Backend platform | **WSL Ubuntu** (bundle cannot unpickle on Windows, see AUDIT_LOG). Run from `/mnt/d/sem7/healthcare/neuroFlow` |
| Python version | 3.12.3 (WSL). Venv: `backend/.venv` via uv at `~/.local/bin/uv`. Ignore `backend/venv` (user's Windows venv, unusable) |
| scikit-learn version (must match bundle) | 1.6.1 |
| xgboost version | 3.4.1 (numpy 2.1.3) |
| Sanity check max diff | 1.490e-08 (verify_model.py, WSL) |
| Postgres connection string env var | `DATABASE_URL`. Postgres 17 is a Windows service; WSL reaches it at `localhost` via mirrored networking (`C:\Users\PC\.wslconfig`). DB `neuroflow` exists. Windows psql: `C:\Program Files\PostgreSQL\17\bin\psql.exe` |
| Backend port | 8000 (`BACKEND_PORT` in .env.example) |
| Backend start command | WSL, repo root: `backend/.venv/bin/uvicorn main:app --app-dir backend --port 8000`. `.env` is loaded by main.py (CRLF-safe) |
| `assessments` table | Created in DB `neuroflow` (001_init.sql applied 2026-09-27), empty |
| API contract | `GET /api/v1/schema` → `{features: [21 in fitted order], schema: {name: {type, min, max, median}}}`. Predict rejects unknown fields (422). No CORS; use a Vite proxy to :8000 |
| SHAP scale | Raw XGBoost log-odds, before calibration. One-hot columns are summed back to `smoker_status` / `marital` |
| Frontend dev port | 5173. Start from `frontend/`: `npx vite --host 127.0.0.1 --port 5173` (Vite proxies `/api` → `127.0.0.1:8000`) |
| Windows ↔ WSL networking | Use `127.0.0.1`, never `localhost`, from Windows: `localhost` resolves to ::1 and times out |
| Frontend layout | All copy is in `src/copy.js`. `buildPayload`/`computeBmi` are in `src/api.js`. App.jsx `Result` is a placeholder for Module 3. Tailwind v4 via `@tailwindcss/vite`, no config file |
| Banned-copy grep | Its one expected hit is the footer's "not a diagnosis" (AUDIT_LOG, Module 2). Use `… \| grep -v "not a diagnosis"` for zero |
| Model B threshold (from config) | 0.027838032692670822 |
| Model B feature count | 21 |
| OpenRouter key configured | **No** — `OPENROUTER_API_KEY` empty in `.env`; `/api/v1/narrative` returns `{"narrative": null}` and the page shows bars only |
| Narrative API | `POST /api/v1/narrative` `{contributions: [{feature, direction}] ≤5}` → `{narrative: str\|null}`. Filter/prompt in `backend/narrative.py` (stdlib urllib) |
| Restarting backend from Windows | `pkill -f 'uvicorn main:app'` via `wsl -e bash -c` kills its own shell (exit 15). Start with a background `wsl -e bash -c "cd … && exec backend/.venv/bin/uvicorn …"` |
| Results page | `Result.jsx` (score bar, SHAP bars, narrative) + `CausalDAG.jsx` (inline SVG). DAG copy lives in `COPY.dag` |
| reference_bins in model_config.json | PRESENT — 28 features, exported from Colab, verified 0.00e+00 vs notebook psi() |
| Drift API | `GET /api/v1/drift` → spec shape + `sufficient` (n ≥ 30) + `reference_source`. Expected flag rate 0.4338 = (TP+FP)/N from bundle test_metrics. Checks: `backend/check_drift.py` |
| Seeded rows | **None.** Seeds deleted 2026-09-28; table = 2 form rows, so the dashboard shows its "too few" message. Re-seed with `backend/seed_demo.py 40`; remove with `DELETE FROM assessments WHERE source='seed'` |
| Drift UI | `Drift.jsx`, reached via `#drift` header link. No router |
| Frontend styling (restyle 2026-09-28) | Design tokens + component classes in `src/index.css` (light + dark). Rail = `src/Rail.jsx`. Tailwind still imported for Drift/DAG utilities, coloured via tokens (`text-(--ink)`). No red/amber/green |
| Running from Windows PowerShell | Inline `python -c` through `wsl -e bash -c` breaks on quoting. Write a script file and run that instead |

---

## Open questions for the user

Anything a module could not resolve on its own. Clear entries as they are answered.

- Module 2 checks 2 and 9: please click through all 3 form steps at http://127.0.0.1:5173 and confirm every field and the footer show.
- Module 3 checks 3 and 8: submit a form, then look at the result page. Check that nothing uses red/amber/green and that the DAG arrows run from the outcome to the 7 greyed nodes.
- Optional: add `OPENROUTER_API_KEY` to `.env` and restart the backend to turn on the narrative.
- Module 4 check 6 PASS (screenshot `logs/screenshots/module4_drift_check6.png`). Checks 7–8 still await a visual look.
- ~~Build the optional Module 5 chatbot, or leave the project at COMPLETE?~~ Answered 2026-10-06: project closed, Module 5 not built.

---

## Blockers

- _(none)_. The Windows unpickle blocker was resolved by running the backend in WSL (2026-09-27).

---

## How to update this file

At the end of every module, replace the **Current position** block and flip the
module's row in the ledger. Example after Module 1:

```markdown
| **Current module** | `MODULE_2_FORM` |
| **Spec to read** | `plan/MODULE_2_FORM.md` |
| **Status** | NOT STARTED |
| **Last updated** | 2026-09-27 |
| **Last session ended** | Module 1 complete, all 6 acceptance checks passed |
```

Then tell the user: *"Module 1 complete. Open a new tab and say continue."*
