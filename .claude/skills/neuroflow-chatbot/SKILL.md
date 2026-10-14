---
name: neuroflow-chatbot
description: Build or debug the optional NeuroFlow result chatbot — a narrowly scoped explainer for one screening result, backed by OpenRouter. Use when working on chat routing, the emergency escalation path, scope classification, or the system prompt. Enforces emergency-first ordering, no medical advice, no future-risk framing, and no message storage.
license: Apache-2.0
---

# NeuroFlow result chatbot

Optional Module 5. The highest-risk surface in the application: the only place a
user types freely and a language model answers, on a page showing a health score.

## The gate — order is non-negotiable

```
message
  |- 1. EMERGENCY  -> fixed card. NO LLM CALL. end turn.
  |- 2. REFUSED    -> canned response. NO LLM CALL.
  |- 3. ALLOWED    -> LLM -> narrative filter -> render
  |- 4. ambiguous  -> treat as REFUSED
```

Rule 4 is the safety default: an unclassifiable message is refused, not passed
through.

## Emergency path

Runs first, before scope classification, on every message. Keyword match on FAST
and related stroke-symptom language. On a hit, return the fixed emergency card and
end the turn — no LLM call, no follow-up question, no "it may be nothing".

Tune the keyword list for false positives, never false negatives. An
over-triggered card is an annoyance; a missed one is not.

Test it by asserting the mocked LLM client's call count is **zero**, not merely
that the output text looked right.

## Reuse, do not rewrite

The `passes()` filter lives in `backend/narrative.py` from Module 3. Import it and
extend the banned list. A second filter will drift out of sync with the first.

## The counterintuitive rule

**Never say "you should see a doctor."** It sounds responsible, but it is clinical
advice from a tool with ~9% precision at its threshold. The canned refusal names a
clinician as the right source without implying this score warrants the visit.

## Context — no vector store

The knowledge base is four markdown files and one database row. Build a fixed
~400-token context block per request from hardcoded constants plus the assessment.
A RAG pipeline here is exactly what `CLAUDE.md` §4 exists to prevent.

Never inject another user's assessment.

## Persistence

**Do not store message content.** Free text on a health page is the likeliest
place an identifier appears. Log only `assessment_id`, `timestamp`, `category`,
`filtered`, `turn_number`.

## Limits

Three sentences per reply. Ten turns per session. Result page only — never a
global floating bubble. LLM unavailable → canned message, page still usable.

## Full taxonomy

`docs/CHATBOT_SCOPE.md` — allow/refuse/emergency categories with example messages
and a 12-case classifier test set.
