"""Guardrailed SHAP narrative via OpenRouter (openrouter.ai).

Any failure — no key, timeout, HTTP error, filter rejection — returns None and the
results page renders the SHAP bars alone. Rules: docs/UI_COPY_RULES.md.
"""
import json
import os
import re
import time
import urllib.request

URL = "https://openrouter.ai/api/v1/chat/completions"
MODELS = ["anthropic/claude-haiku-4.5", "google/gemini-2.5-flash"]  # cheap first, one fallback
BUDGET_S = 5.0

SYSTEM_PROMPT = """You write one or two plain sentences describing a stroke-history screening score.
The model classifies whether a survey respondent was ever told by a doctor they had a stroke. It does not predict the future.
You receive the features that most distinguish this profile, with the direction each pushes the score.

Rules, all mandatory:
1. Mention only the features you are given. Never mention any other model or any other feature.
2. Use zero causal verbs: never write causes, leads to, results in, increases, reduces, raises, lowers, drives, contributes to, protects against.
3. Never write "risk of future stroke" or make any claim about a future stroke. Do not use the word "risk".
4. Never give medical advice, lifestyle recommendations, or next steps.
5. Use comparative framing only, in this shape: "This profile differs from lower-scoring profiles mainly in age and blood pressure history."
6. Two sentences maximum. Output only the sentences."""

# Lowercased substrings; any hit discards the narrative. Stems catch inflections
# ("increas" → increased/increasing). "lowers"/"lowered"/"lowering" rather than
# "lower" so the required "lower-scoring profiles" framing passes.
BANNED = [
    # future / incidence framing
    "risk", "future", "will have", "will ", "likely", "chance", "predict",
    # causal verbs
    "caus", "leads to", "led to", "result in", "results in", "resulted in", "increas",
    "reduc", "raise", "raising", "lowers", "lowered", "lowering", "drive", "driving",
    "contribut", "protect", "because", "due to",
    # advice
    "you should", "should", "recommend", "advise", "advice", "consult", "see a doctor",
    "consider", "try to",
    # diagnosis
    "diagnos",
    # Model A and its seven excluded features
    "model a", "general health", "physical activity", "exercise", "mental health",
    "employ", "checkup", "check-up", "personal doctor",
]


def passes(text: str) -> bool:
    t = text.lower()
    if any(b in t for b in BANNED):
        return False
    return len([s for s in re.split(r"[.!?]+", t) if s.strip()]) <= 2


def _call(model: str, user: str, key: str, timeout: float) -> str:
    body = json.dumps({
        "model": model,
        "max_tokens": 120,
        "temperature": 0,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT},
                     {"role": "user", "content": user}],
    }).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)["choices"][0]["message"]["content"].strip()


def generate(contributions: list[dict]) -> str | None:
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key or not contributions:
        return None
    user = "\n".join(
        f"- {c['feature'].replace('_', ' ')}: pushes score {c['direction']}" for c in contributions)
    deadline = time.monotonic() + BUDGET_S
    for model in MODELS:
        remaining = deadline - time.monotonic()
        if remaining <= 0.2:
            return None
        try:
            text = _call(model, user, key, remaining)
        except Exception:
            continue
        return text if passes(text) else None   # a rejected output is not retried
    return None
