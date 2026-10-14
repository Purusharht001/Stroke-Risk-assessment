# 00_OVERVIEW — the build plan

Read this once if you are lost. Normal sessions read `CLAUDE.md` → `STATE.md` →
the single current module file, and nothing else.

---

## The continue protocol

The build is split into five modules that run in **separate chat tabs**. One tab,
one module. The user types `continue` and nothing else.

```
Tab 1:  "continue"  →  reads CLAUDE.md, STATE.md, MODULE_0  →  does Module 0  →  updates STATE.md  →  STOPS
Tab 2:  "continue"  →  reads CLAUDE.md, STATE.md, MODULE_1  →  does Module 1  →  updates STATE.md  →  STOPS
Tab 3:  "continue"  →  reads CLAUDE.md, STATE.md, MODULE_2  →  ...
Tab 4:  "continue"  →  Module 3
Tab 5:  "continue"  →  Module 4
Tab 6:  "continue"  →  Module 5  (optional — only if you chose to build it)
```

**Why separate tabs.** Each tab starts with a clean context window. A session that
has just built the backend carries ~40k tokens of backend detail that the form
module does not need. Starting fresh and reading only `STATE.md` costs about 2k
tokens instead. The cost of that is that nothing carries over implicitly — which
is exactly why `STATE.md` and `logs/BUILD_LOG.md` exist.

**The rule that makes it work:** a module never starts the next module. When the
acceptance checks pass and `STATE.md` is updated, the session ends.

---

## Module map

| # | Module | Builds | Depends on | Est. session |
|---|---|---|---|---|
| 0 | Setup | venv, deps, model verification, Postgres up | — | short |
| 1 | Backend | FastAPI, dynamic Pydantic, `/predict`, DB writes | 0 | long |
| 2 | Form | Vite+React intake form, 21 fields, client BMI | 1 | long |
| 3 | Results | SHAP bars, LLM narrative, causal DAG | 1, 2 | long |
| 4 | Drift | PSI dashboard from stored predictions | 1, 3 | medium |
| 5 | Chatbot | **Optional.** Scoped result explainer via OpenRouter | 1, 3, 4 | long |

Module 0 is deliberately small. It exists so that a version mismatch between your
machine and the Colab runtime is found in five minutes rather than after the form
is built.

---

## Where the Colab files go

You downloaded four files from the training notebook. They go in `models/`,
unchanged, before Module 0 runs:

| File | Destination | What it is |
|---|---|---|
| `stroke_model.joblib` | `models/stroke_model.joblib` | Both models + preprocessors + calibrators |
| `model_config.json` | `models/model_config.json` | Input schema, thresholds, library versions |
| `sanity_input.csv` | `models/sanity_input.csv` | 200 test rows |
| `sanity_expected.npy` | `models/sanity_expected.npy` | Their expected Model B probabilities |

Do not rename them. Module 0 and Module 1 reference these exact paths.

The notebook itself (`.ipynb`) is **not** part of this repo. Keep it with your
report. If you want it versioned, put it in a separate `research/` folder that
`.gitignore` excludes from the build.

---

## Definition of done, per module

A module is done when **all** of these hold:

1. Every file in its "Files to create" list exists and runs.
2. Every acceptance check in its spec passes, verified by actually running it.
3. `logs/BUILD_LOG.md` has the module's block appended.
4. `logs/AUDIT_LOG.md` has a row for every hard-rule decision made.
5. `plan/STATE.md` points at the next module.

Partial completion is recorded honestly: mark the module 🟡 in the ledger, list
what remains under Blockers, and stop. Do not mark something done that is not.

---

## What this project is not building

Named so nobody spends a session on it:

- No auth, users, or login. Sessions are anonymous UUIDs.
- No Docker, CI, or deployment config unless the user asks.
- No OCR pipeline. That is a later phase, outside these five modules.
- No model retraining. The bundle is frozen.
- No counterfactual "what-if" feature. It was evaluated and rejected — the data
  is cross-sectional prevalence and cannot support intervention claims.
- No general-purpose health chatbot. Module 5, if built, is a narrow explainer for
  one result — not a symptom checker or health assistant.
- No survival analysis. BRFSS has no time-to-event structure.
