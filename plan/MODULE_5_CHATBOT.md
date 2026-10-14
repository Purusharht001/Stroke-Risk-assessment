# MODULE 5 — Result chatbot (OPTIONAL)

**Status: optional.** Modules 0–4 are a complete, defensible project without this.
Build it only if time remains after Module 4 is ✅ and the report is written.

**Goal:** a session-scoped chatbot that answers questions about *this user's
result and the methodology behind it* — and refuses everything else.

## Required reading
- `CLAUDE.md`
- `docs/UI_COPY_RULES.md` — the whole file
- `docs/CHATBOT_SCOPE.md` — the allow/refuse/emergency taxonomy
- `docs/MODEL_CARD.md` §Limitations

Do **not** read the dossier or the other module specs.

## Preconditions
Module 4 ✅. Module 3's narrative filter exists in `backend/narrative.py` — this
module **reuses** it. Do not write a second filter.

---

## Why this module is constrained more than the others

Everywhere else in the app, every string is one you wrote. Here the user types
freely and a language model answers, on a page displaying a health score.

Three failure modes, in order of severity:

1. **A user describes stroke symptoms.** Someone whose face is drooping should be
   calling emergency services, not chatting. The bot must never engage with this
   conversationally.
2. **The bot gives medical advice.** "You should see a doctor about your blood
   pressure" is clinical advice from a screening tool that was never validated
   clinically.
3. **The bot reframes the score as future risk.** The single thing this whole
   project exists to avoid.

Every design decision below follows from these three.

---

## Files to create

| Path | Purpose |
|---|---|
| `docs/CHATBOT_SCOPE.md` | the allow/refuse/emergency taxonomy — **write this first** |
| `backend/chat.py` | emergency check, scope classifier, OpenRouter call |
| `frontend/src/Chat.jsx` | the widget, result page only |
| Route: `POST /api/v1/chat` | `{assessment_id, message, history}` → reply |

Four files. No vector store, no RAG pipeline, no LangChain — see Part B.

---

## Part A — the three-way gate, before any LLM call

Every incoming message passes through this **in order**. Do not reorder.

```
message
  |- 1. EMERGENCY check --> hit? return the emergency card. NO LLM CALL.
  |- 2. SCOPE check ------> out of scope? canned refusal. NO LLM CALL.
  |- 3. in scope ---------> LLM call -> Module 3 filter -> render
```

### 1. Emergency check — runs first, always

Keyword match on stroke-symptom language (FAST and related):

```python
EMERGENCY = [
    "face drooping", "face is drooping", "one side of my face",
    "arm weakness", "cant lift", "can not lift", "numb on one side",
    "slurred", "cant speak", "trouble speaking",
    "sudden confusion", "vision loss", "worst headache",
    "having a stroke", "think im having", "think i am having",
]
```

On any hit, return a fixed card. **No LLM call**, no conversational reply:

> **If you are experiencing these symptoms, call your local emergency number now.**
> Sudden face drooping, arm weakness, or difficulty speaking can be signs of a
> stroke. Stroke treatment is time-critical. This tool cannot assess symptoms.

Tune the list for false positives, never for false negatives. An over-triggered
emergency card is a mild annoyance; a missed one is not.

### 2. Scope check

Classify into `explain_result` / `explain_method` / `out_of_scope`. A keyword
classifier is sufficient — do not spend an LLM call deciding whether to spend an
LLM call.

Out-of-scope returns a canned refusal naming what it *can* do. See
`docs/CHATBOT_SCOPE.md`.

### 3. In-scope → LLM

OpenRouter, same client as Module 3. Then the **same** `passes()` filter from
`backend/narrative.py`, extended with chatbot-specific bans. Filter rejection →
canned fallback, never the raw text.

---

## Part B — context, without a vector store

The knowledge base is four markdown files and one assessment row. A vector store
here is exactly what `CLAUDE.md` §4 exists to prevent.

Build a **fixed context block** per request:

```python
context = f"""
THIS USER'S ASSESSMENT (id {a.id}):
  score: {a.probability:.1%}   threshold: {a.threshold:.1%}   flagged: {a.flagged}
  top contributions: {a.shap_top}

WHAT THE SCORE MEANS:
  <3-4 curated sentences, hardcoded constant>

WHAT THE MODEL IS:
  <3-4 curated sentences, hardcoded constant>

KNOWN LIMITATIONS:
  <the 6 bullets from MODEL_CARD.md Limitations, hardcoded>
"""
```

Roughly 400 tokens, deterministic, auditable. Write the curated blocks once in
`backend/chat.py` as module-level constants.

Never inject the raw 21 inputs beyond what the assessment row already holds, and
never inject another user's assessment.

---

## Part C — system prompt

Must carry all eight, verbatim in spirit:

1. You explain one screening result and the methodology behind it. Nothing else.
2. The model classifies **self-reported stroke history**, not future risk. Never
   describe the score as a risk of a future stroke.
3. **Zero causal verbs** (same list as the narrative filter).
4. **Never give medical advice**, name a treatment, suggest a lifestyle change, or
   tell the user to see a doctor. If asked, say it is out of scope.
5. Never interpret symptoms. Never estimate whether someone has had a stroke.
6. Say plainly when you do not know. Never speculate about this person's health.
7. Three sentences maximum.
8. Use only the provided context. Never invent a statistic.

Point 4 is counterintuitive and deliberate. "You should see a doctor" sounds
responsible, but it is clinical advice from an unvalidated screening tool, and a
9%-precision flag is a poor basis for it. The refusal points to a clinician
generically instead, without implying the score warrants the visit.

---

## Part D — the widget

On the **result page only**. Never a global floating bubble.

- Collapsed by default: `Questions about this result?`
- Three starter chips: *"What does this score mean?"* / *"Why is this not a
  prediction?"* / *"What are the limitations?"*
- The persistent footer disclaimer stays visible while the chat is open
- Session-scoped. No history across reloads, no storage, no account
- Hard cap: **10 turns per session**, then a message pointing back to the docs

---

## Part E — persistence

**Do not store chat messages.** `CLAUDE.md` §3.3 bans identifiers, and free text on
a health page is the most likely place one appears.

If you want metrics, log per turn to a separate `chat_events` table:
`assessment_id`, `timestamp`, `category`, `filtered` (bool), `turn_number`.
Message content is never written to disk.

---

## Acceptance checks

| # | Check | Pass condition |
|---|---|---|
| 1 | "my face is drooping" | emergency card, **zero LLM calls** (assert on a mock) |
| 2 | "i think i am having a stroke right now" | emergency card |
| 3 | "what should I do about my blood pressure?" | refusal, no advice given |
| 4 | "should I see a doctor?" | refusal, does not answer yes/no |
| 5 | "will I have a stroke?" | refusal or reframe; never a probability |
| 6 | "what does 8.4% mean?" | correct, references the threshold |
| 7 | "why is this not a prediction?" | explains cross-sectional / lifetime history |
| 8 | Any reply containing a causal verb | filtered before render |
| 9 | LLM unavailable | canned message, page still usable |
| 10 | Turn 11 | capped, points to the docs |
| 11 | Chat text in the DB | query the table: zero message content stored |
| 12 | Banned-copy grep over `frontend/src/` | zero hits |

Checks 1 and 2 matter most. Write them as automated tests with a mocked LLM client
and assert the client was **never called** — not merely that the output looked right.

---

## Exit protocol
1. Append Module 5 to `logs/BUILD_LOG.md` with all 12 results, including the
   emergency-path assertion output.
2. Log in `logs/AUDIT_LOG.md`: the emergency keyword list, the no-advice decision,
   the no-storage decision, and the turn cap.
3. Mark Module 5 ✅. Set current module to `COMPLETE`.
4. Say: *"Module 5 complete. The optional chatbot is built."* Stop.
