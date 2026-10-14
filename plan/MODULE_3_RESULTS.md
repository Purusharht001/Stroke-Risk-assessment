# MODULE 3 — Results page

**Goal:** render the score, the SHAP contributions, a guardrailed LLM narrative,
and the causal DAG.

## Required reading
- `CLAUDE.md`
- `docs/UI_COPY_RULES.md` — especially the LLM constraints section
- `docs/ACADEMIC_DOSSIER.md` **§3 only** — the DAG structure. Do not read the rest.

## Preconditions
Modules 1 and 2 ✅. A full form submission returns a prediction.

## Files to create

| Path | Purpose |
|---|---|
| `frontend/src/Result.jsx` | score, flag, SHAP bars |
| `frontend/src/CausalDAG.jsx` | the DAG, inline SVG |
| `backend/narrative.py` | OpenRouter call + guardrail filter |
| Route: `POST /api/v1/narrative` | takes contributions, returns ≤2 sentences |

## Part A — the score

```
This profile scores 8.4% on our screening model.
Flagged for follow-up.
```

One neutral horizontal bar with the threshold marked. **No traffic lights.**
Red/amber/green encodes a severity claim the model does not make.

Below it, both sentences — the second is not optional:

> Profiles above 3.3% are flagged so that roughly 86% of stroke-history cases are
> captured. Most flagged profiles do not have a stroke history.

Precision at threshold is ~9%. A flagged user who is not told this will reasonably
assume the opposite.

## Part B — SHAP contributions

Heading: **What distinguishes this profile**. Horizontal bars, top 5 by absolute
SHAP. Each reads `<Feature label> — pushes score up` / `pushes score down`.

Never "increases your risk". SHAP is attribution, not causation.

## Part C — LLM narrative

`backend/narrative.py` calls OpenRouter. Note: the original brief called this
"OpenRoute" — no such project exists. It is **OpenRouter** (openrouter.ai).

```python
# OpenAI-compatible; either the `openrouter` package or the `openai` client
client = OpenAI(base_url="https://openrouter.ai/api/v1",
                api_key=os.environ["OPENROUTER_API_KEY"])
```

Tiered routing: try a cheap model first (`anthropic/claude-haiku-4.5` or similar),
fall back to a second on failure, then give up and render bars alone.

**System prompt must carry all six constraints from `docs/UI_COPY_RULES.md`:**
Model B only · zero causal verbs · never "risk of future stroke" · no medical
advice · comparative framing only · two sentences maximum.

Target output shape:
> "This profile differs from lower-scoring profiles mainly in age and blood
> pressure history."

**Post-generation filter — mandatory.** Before returning, reject on any banned
substring (causal verbs, future-tense stroke claims, advice language). On
rejection: return `null` and render the SHAP bars with no narrative. Never render
unfiltered LLM text on a health result page.

**Never block on it.** 5s timeout. Failure, error, or filter rejection → bars only,
no apology, no placeholder.

## Part D — causal DAG

Inline SVG in `CausalDAG.jsx`. No graph library — this is ~15 static nodes.

Three node classes, visually distinct:
- **Risk factors** (upstream): age, high_bp, diabetes, high_chol, smoker_status, bmi
- **Outcome**: stroke history
- **Descendants of the outcome** (the 7 excluded): gen_health, phys_activity,
  phys_days, ment_days, employment, has_doctor, last_checkup — drawn with arrows
  pointing *from* the outcome *to* them, visibly separated, marked EXCLUDED

Caption:
> The seven greyed nodes are descendants of the outcome. Conditioning on a
> descendant of the outcome induces association without causation, so they are
> excluded from the screening model. Removing them costs 7.9% relative PR-AUC —
> the measured contribution of reverse causation.

Read `docs/ACADEMIC_DOSSIER.md` §3 for the exact edges. This is the project's
central methodological claim rendered visually; get the direction of the arrows
right.

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | Score renders as "This profile scores X% on our screening model" | exact |
| 2 | Both threshold-explanation sentences present | yes |
| 3 | No traffic-light colouring | manual |
| 4 | SHAP bars ≤ 5, labelled "pushes score up/down" | yes |
| 5 | Narrative ≤ 2 sentences | yes |
| 6 | Narrative contains zero causal verbs | filter test below |
| 7 | LLM unavailable → page still renders | kill the key, reload |
| 8 | DAG shows 7 excluded nodes as outcome descendants | arrows point from outcome |
| 9 | Banned-copy grep across `frontend/src/` | zero hits |
| 10 | Footer on this page too | manual |

Check 6: feed the filter these and confirm all are rejected —
`"Your high BMI causes increased risk"`, `"This reduces your chance of stroke"`,
`"You should lower your blood pressure"`.

## Exit protocol
1. Append Module 3 to `logs/BUILD_LOG.md`, including the filter test results.
2. Log in `logs/AUDIT_LOG.md`: the LLM guardrail design, the filter's banned list,
   and the fallback behaviour.
3. Mark Module 3 ✅, set current to `MODULE_4_DRIFT`.
4. Say: *"Module 3 complete. Open a new tab and say continue."* Stop.
