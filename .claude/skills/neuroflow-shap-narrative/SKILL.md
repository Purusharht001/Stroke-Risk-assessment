---
name: neuroflow-shap-narrative
description: Generate a guardrailed natural-language narrative from SHAP attributions via OpenRouter for the NeuroFlow results page. Use when writing, editing, or debugging the LLM narrative. Enforces zero causal verbs, no future-risk phrasing, comparative framing only, and a mandatory post-generation filter with SHAP-bars fallback.
license: Apache-2.0
---

# SHAP narrative with guardrails

## Why guardrails

The model classifies stroke *history* from cross-sectional data. An LLM describing
SHAP output will default to causal, future-tense phrasing — "your high BMI
increases your risk" — which asserts something the model cannot support, on a
health topic, to a user with no way to know the difference.

## Provider

**OpenRouter** (openrouter.ai). The original project brief said "OpenRoute"; no
such project exists.

```python
from openai import OpenAI
client = OpenAI(base_url="https://openrouter.ai/api/v1",
                api_key=os.environ["OPENROUTER_API_KEY"])
```

Tiered: cheap model first, one fallback, then give up.

## System prompt — all six constraints

1. Model B output only; never mention Model A or the 7 excluded features
2. **Zero causal verbs**: causes, leads to, results in, increases, reduces, raises,
   lowers, drives, contributes to, protects against
3. Never "risk of future stroke" or any future-tense stroke claim
4. No medical advice, lifestyle recommendations, or next steps
5. Comparative framing only
6. Two sentences maximum

Target shape:
> "This profile differs from lower-scoring profiles mainly in age and blood
> pressure history."

## Post-generation filter — mandatory

```python
BANNED = [
    "risk of future", "will have", "chance of stroke", "your risk",
    "causes", "leads to", "results in", "increases", "reduces",
    "raises", "lowers", "drives", "protects against", "contributes to",
    "you should", "recommend", "advise", "diagnos",
]

def passes(text: str) -> bool:
    return not any(b in text.lower() for b in BANNED)
```

Fail → return `None`. The caller renders the SHAP bars alone.

## Fallback behaviour

Timeout (5s), API error, or filter rejection → **bars only**. No apology, no
placeholder, no retry loop. The results page must never depend on the LLM being up.

## Testing

These must all be rejected:
- "Your high BMI causes increased risk"
- "This reduces your chance of stroke"
- "You should lower your blood pressure"
