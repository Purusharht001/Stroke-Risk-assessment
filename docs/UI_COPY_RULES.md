# UI_COPY_RULES

Binding on every string the user can see: labels, headings, buttons, tooltips,
error messages, LLM output, page titles, and alt text.

---

## Why this file exists

The model classifies whether someone has **ever been told by a doctor that they had
a stroke**. It is fitted to cross-sectional lifetime prevalence. It has no time
axis and no follow-up data.

So a sentence like *"your risk of stroke is 8%"* is not a rounding error in
phrasing — it states something the model cannot support. It converts a prevalence
estimate into a future-incidence claim, and it does so on a health topic, to a user
who has no way to know the difference.

---

## Banned — never render these

| ❌ Banned | Why |
|---|---|
| "Your stroke risk is X%" | Asserts future incidence |
| "Risk of future stroke" | Same, explicitly |
| "You are at high risk" | Same, plus alarm |
| "High risk" / "Low risk" as a standalone label | Implies a future-risk stratum |
| "You will / are likely to have a stroke" | Prediction the model cannot make |
| "Diagnosis", "diagnosed as", "test result" | Not a diagnostic device |
| "X% chance of stroke" | Future-incidence framing |
| "This causes your risk to rise" | Causal claim; SHAP is not causal |
| "Reduce your risk by..." | Intervention claim from correlational data |

## Required — use these instead

| ✅ Required | Context |
|---|---|
| "This profile scores X% on our screening model" | The headline number |
| "Flagged for follow-up" | Above threshold |
| "Not flagged" | Below threshold |
| "Profile consistent with elevated cardiovascular risk factors" | Interpretive line |
| "This profile differs from lower-scoring profiles mainly in ..." | SHAP narrative |
| "Screening estimate from self-reported survey data, not a diagnosis." | Persistent footer |

---

## The footer

Present on **every page**, not just results. Fixed or in the page footer, always
visible without scrolling on a result page.

> Screening estimate from self-reported survey data, not a diagnosis.

---

## Result page specifics

**The score.** Render as `This profile scores 8.4% on our screening model.`
Never as a gauge labelled "risk", never colour-coded red/amber/green — traffic
lights carry a severity claim the model does not make. Use a single neutral bar
with the threshold marked.

**The flag.** `Flagged for follow-up` or `Not flagged`, with one line of
explanation: *"Profiles above 3.3% are flagged so that roughly 86% of
stroke-history cases are captured. Most flagged profiles do not have a stroke
history."*

That second sentence is not optional. Precision at the operating threshold is
about 9% — nine out of ten flagged people have no stroke history. A user who is
flagged and not told this will reasonably assume the opposite.

**SHAP contributions.** Label the section `What distinguishes this profile`.
Each bar reads `<feature> — pushes score up/down`. Never "increases your risk".

---

## LLM narrative constraints

The system prompt must include all of these, and the output must be checked
against them before rendering:

1. Model B output only. Never reference model A or the 7 excluded features.
2. **Zero causal verbs**: no *causes, leads to, results in, increases, reduces,
   raises, lowers, drives, contributes to, protects against*.
3. Never the phrase "risk of future stroke", or any future-tense stroke claim.
4. Never give medical advice, lifestyle recommendations, or next steps.
5. Comparative framing only. Target shape:
   > "This profile differs from lower-scoring profiles mainly in age and blood
   > pressure history."
6. Two sentences maximum.

**Post-generation check.** Run the output through a banned-substring filter before
rendering. On a hit, discard the narrative and render the SHAP bars alone. Never
show unfiltered LLM text on a health result page.

**On failure.** Timeout, error, or filter rejection → render the SHAP bars with no
narrative. The result page must never depend on the LLM being available.

---

## Error and empty states

| Situation | Copy |
|---|---|
| Model unavailable | "The screening model is not available right now. Please try again shortly." |
| Validation failure | Name the field and the valid range. Never "invalid input". |
| BMI out of range | "Please check the height and weight entered." — not "invalid BMI" |
| LLM unavailable | Render nothing. No apology, no placeholder. |

---

## Review checklist

Before marking Module 2 or 3 done, grep the frontend for every banned phrase:

```bash
grep -rniE "your (stroke )?risk|high risk|low risk|risk of future|you will have|chance of stroke|reduce your risk|diagnos" frontend/src/
```

Zero hits required. Record the result in `logs/AUDIT_LOG.md`.
