# NeuroFlow AI

Stroke-history classification and risk screening over CDC BRFSS data.
FastAPI + Vite/React + Postgres, driven by a pre-trained model bundle.

**This model does not predict future strokes.** It classifies whether a person has
ever been told by a doctor that they had a stroke. See `docs/MODEL_CARD.md`.

---

## Before you start

Put the four files downloaded from the Colab training notebook into `models/`,
unrenamed:

```
models/stroke_model.joblib      both models, preprocessors, calibrators
models/model_config.json        input schema, thresholds, library versions
models/sanity_input.csv         200 test rows
models/sanity_expected.npy      their expected Model B probabilities
```

The notebook itself is not part of this repo. Keep it with your report.

## Optional tooling

```bash
uv tool install graphifyy && graphify install    # repo knowledge graph
# in Claude Code:
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail                # YAGNI enforcement
```

## How to build it

Open Claude Code in this folder. In a new tab, type:

```
continue
```

It reads `CLAUDE.md`, then `plan/STATE.md`, then the one module it points at.
Module 5 is optional — the project is complete after Module 4.
When that module is done it updates `STATE.md` and stops. Open a new tab, type
`continue` again. Five tabs, five modules.

The separate tabs are the point: each starts with a clean context window and reads
~2k tokens of state instead of carrying 40k tokens of the previous module.

| Tab | Module |
|---|---|
| 1 | Setup and model verification |
| 2 | Backend — FastAPI, dynamic Pydantic, Postgres |
| 3 | Intake form — 21 fields, client-side BMI |
| 4 | Results — SHAP, guardrailed LLM narrative, causal DAG |
| 5 | Drift dashboard — PSI over stored predictions |
| 6 | *Optional* — result chatbot via OpenRouter |

## Layout

```
CLAUDE.md               always-on directives
plan/STATE.md           the handoff file — read 2nd every session
plan/MODULE_*.md        one spec per module
docs/                   data dictionary, UI copy rules, model card, dossier
logs/                   build log and audit log
.claude/skills/         agent skills (agentskills.io format)
models/                 the Colab bundle
backend/ frontend/      the application
```
