# NeuroFlow AI: Presentation Script

A spoken script for presenting the project to faculty, with a reference section at
the end for answering questions. Text under **SAY** is meant to be spoken. Text under
**SHOW** is what goes on screen. The *Notes* are for you only.

Suggested timing is about 15–20 minutes plus questions.

| # | Section | Time |
|---|---|---|
| 1 | Opening: the problem and the one-line pitch | 1.5 min |
| 2 | What the model does and does not do | 1.5 min |
| 3 | The data | 1.5 min |
| 4 | Architecture: how the pieces fit | 2 min |
| 5 | The ML core: XGBoost, calibration, threshold | 4 min |
| 6 | Model A vs Model B: the causal argument | 2 min |
| 7 | Explainability: SHAP + guarded LLM narrative | 2 min |
| 8 | Live demo and how to read the result page | 3 min |
| 9 | Drift monitoring (PSI) | 1.5 min |
| 10 | Novelty and contributions | 1.5 min |
| 11 | Limitations and closing | 1 min |
| A | Code location map (reference) | — |
| B | Likely faculty questions with answers | — |

---

## 1. Opening

**SAY**

> Good morning. Our project is **NeuroFlow AI**, a web application for
> **stroke-history screening**. You answer 21 short survey questions, and a
> machine-learning model trained on **2.17 million** real respondents from the US
> CDC's BRFSS survey gives you a calibrated screening score. It also tells you
> whether the profile is flagged for follow-up, and which answers most
> distinguish it from other profiles.
>
> Our focus is not only on building the classifier. We focused on being honest
> about what such a model can and cannot claim. Many published stroke models on
> this same survey report accuracy figures around 0.96 ROC-AUC. We show that much
> of that comes from methodological shortcuts, and we measure what each shortcut
> costs.

---

## 2. What the model does and does not do

**SAY**

> I want to start with one distinction, because it shapes every design decision
> after it.
>
> The survey question our label comes from is: *"Has a doctor, nurse, or other
> health professional ever told you that you had a stroke?"* That is
> **lifetime history**, not future incidence. The data is cross-sectional, a
> snapshot. There is no follow-up and no date of the stroke.
>
> So our model **classifies whether a profile resembles people who have a stroke
> history**. It does **not** predict a future stroke. That is why the application
> never says "your stroke risk is X%". It says *"This profile scores X% on our
> screening model."* Every page carries the footer *"Screening estimate from
> self-reported survey data, not a diagnosis."*

*Notes: if asked "then why is it useful?", answer that it is a screening tool. It
flags profiles whose risk-factor pattern strongly resembles people with a stroke
history, and those profiles deserve clinical follow-up. That is a legitimate
screening use without making a prognosis claim.*

---

## 3. The data

**SAY**

> The data is the CDC's **Behavioral Risk Factor Surveillance System (BRFSS)**,
> the largest continuously running health survey in the world. We used five survey
> years, about **2.17 million respondents** in total.
>
> We split by **time**, not randomly:
> - **2015, 2017, 2019** for training: 1,305,790 rows, of which 4.29% report a stroke
> - **2021** for validation, split into two halves:
>   - **Val A** for model selection and early stopping
>   - **Val B** for calibration and choosing the threshold
> - **2023** as the held-out test year, scored **once**: 431,849 rows
>
> We used odd years only for a specific reason. Blood pressure and cholesterol are
> "rotating core" questions in BRFSS and are only asked by every state in
> odd-numbered years. In even years they are structurally missing, not randomly
> missing, so they can't be imputed honestly.

**Notes: why a temporal split?** A random split leaks the same year's survey
quirks into both train and test. A temporal split tests whether the model still
works on a future year it has never seen, which is closer to real deployment.

**Notes: class imbalance.** Only about 4% of respondents are positive. We handled
this with **class weighting** (positive cases count more in the loss), not SMOTE.
Section 10 explains why.

---

## 4. Architecture: how the pieces fit

**SHOW** this diagram:

```
 ┌───────────────────────────┐        ┌───────────────────────────────────────┐
 │  FRONTEND (React + Vite)  │        │  BACKEND (FastAPI, Python)            │
 │  frontend/src/            │  HTTP  │  backend/                             │
 │                           │ /api/v1│                                       │
 │  Form.jsx  (3-step form) ─┼───────►│  main.py     routes                   │
 │  api.js    (BMI, payload) │        │  schema.py   validation from config   │
 │  Result.jsx (score, SHAP) │◄───────┼─ model.py    ML inference + SHAP      │
 │  CausalDAG.jsx            │        │  narrative.py LLM sentence (guarded)  │
 │  Drift.jsx (PSI dashboard)│        │  drift.py    PSI monitoring           │
 └───────────────────────────┘        │  db.py       Postgres (plain SQL)     │
                                      └──────────┬───────────────┬────────────┘
                                                 │               │
                                  ┌──────────────▼──┐   ┌────────▼──────────┐
                                  │ models/         │   │ PostgreSQL        │
                                  │ stroke_model.   │   │ table assessments │
                                  │   joblib        │   │ (no identifiers)  │
                                  │ model_config.   │   └───────────────────┘
                                  │   json          │          ▲
                                  └─────────────────┘   OpenRouter LLM (optional)
```

**SAY**

> There are three layers.
>
> **The model bundle**, in the `models/` folder. We trained in Google Colab and
> exported one file, `stroke_model.joblib`. It contains the preprocessor, the
> trained XGBoost model, the calibrator, and the threshold, all frozen.
> `model_config.json` holds the valid range of every input and the training
> distribution we use for drift monitoring.
>
> **The backend**, a Python **FastAPI** server in `backend/`. It loads the bundle
> once at startup, validates every input, runs inference, computes the SHAP
> explanation, stores the result in **PostgreSQL**, and serves the drift report.
>
> **The frontend**, a **React** app built with Vite in `frontend/`. It has a
> three-step questionnaire, a results page, and a drift dashboard.
>
> The ML model is never retrained or modified at runtime. The server only loads
> it and calls it.

### Request flow for one screening (walk through this slowly)

1. The user fills in 3 steps in [frontend/src/Form.jsx](frontend/src/Form.jsx).
   Each step is validated on the client.
2. The frontend **computes BMI** from height and weight
   ([frontend/src/api.js](frontend/src/api.js), `computeBmi`). Users are never
   asked for BMI directly.
3. `buildPayload` in `api.js` builds a JSON object with exactly the 21 features in
   the model's order, and sends `POST /api/v1/predict`.
4. The backend validates it with a **Pydantic model generated from
   `model_config.json`** ([backend/schema.py](backend/schema.py)). Wrong ranges,
   missing fields, or **extra fields** are rejected with HTTP 422.
5. [backend/model.py](backend/model.py) `predict()` runs the 4-step inference
   (Section 5) and computes SHAP.
6. [backend/db.py](backend/db.py) stores the inputs and the result. No name, email,
   or IP is stored; each row gets only a random UUID.
7. The response goes back to the frontend, which renders the results page
   ([frontend/src/Result.jsx](frontend/src/Result.jsx)).
8. In parallel, the results page asks `POST /api/v1/narrative` for a one-sentence
   plain-English summary. If that fails, the page still works.

### API endpoints ([backend/main.py](backend/main.py))

| Endpoint | What it does |
|---|---|
| `GET /health` | Liveness check, reports model version |
| `GET /api/v1/schema` | The 21 features in fitted order with min/max. The form reads its bounds from this |
| `POST /api/v1/predict` | Validates input, runs Model B, stores and returns score, flag, and top-5 SHAP |
| `POST /api/v1/narrative` | Guarded LLM sentence about the SHAP result. Returns `null` on any failure |
| `GET /api/v1/drift` | PSI drift report over stored assessments |
| `GET /api/v1/assessments` | Recent stored rows (for inspection) |

---

## 5. The ML core: how the model works

This is the most important section. Take your time here.

### 5.1 The 21 input features

**SAY**

> The model uses 21 features, all from the survey:
>
> - **Demographics:** age, sex, education, marital status, home ownership, veteran
>   status, urban/rural
> - **Medical history** (all phrased *"Has a doctor ever told you…"*): high blood
>   pressure, high cholesterol, diabetes, heart attack or coronary heart disease,
>   kidney disease, COPD, depression, arthritis
> - **Lifestyle and access:** smoking status, heavy drinking, binge drinking, BMI,
>   health insurance, cost barrier to seeing a doctor
>
> The question wording is deliberate and copied word for word from BRFSS. If we
> asked *"Do you have high blood pressure?"* instead of *"Has a doctor ever told
> you…"*, people would answer a different question. The inputs would then drift
> away from what the model was trained on, and the probabilities would lose their
> meaning.

*Where in code:* the questions are in [frontend/src/copy.js](frontend/src/copy.js)
(`FIELDS`), the form steps are in [frontend/src/Form.jsx](frontend/src/Form.jsx)
(`STEPS`), and the documentation is in
[docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md).

### 5.2 The algorithm: XGBoost (gradient-boosted decision trees)

**SAY**

> The classifier is **XGBoost**, which stands for eXtreme Gradient Boosting.
>
> Here is how it works. A single decision tree asks a sequence of yes/no questions,
> such as "is age over 63?" or "high blood pressure = yes?", and ends at a leaf
> with a score. One tree on its own is weak.
>
> **Boosting** builds hundreds of small trees **in sequence**. Each new tree is
> trained to correct the mistakes the ensemble so far is still making. Technically,
> it fits the gradient of the log-loss. The final output is the **sum of the leaf
> scores of all trees**. That sum is in **log-odds**, and a sigmoid function turns
> it into a number between 0 and 1.
>
> XGBoost adds regularisation (penalties on tree complexity), shrinkage (each tree
> contributes only a small step), and built-in handling of missing values.

**Why XGBoost fits this scenario.** Faculty will likely ask this.

| Property of our data | Why XGBoost handles it well |
|---|---|
| Tabular, mostly binary (yes/no) and small categorical answers | Tree models are the state of the art on tabular data. They split on 0/1 values naturally and need no scaling |
| Strong **interactions** (for example, high BP matters more at older ages) | Trees capture interactions automatically through nested splits. Logistic regression would need hand-made interaction terms |
| **Non-linear** effects (age, BMI) | Splits learn thresholds directly; no need to assume linearity |
| Real survey data has **missing answers** | XGBoost learns a default direction for missing values at each split |
| **1.3 million** training rows | Fast, parallel histogram-based training |
| Heavy **class imbalance** (4% positive) | Supports class weighting in the loss |
| We need **explanations** | **TreeSHAP** gives exact, fast Shapley values for tree models |

### 5.3 The 4-step inference contract

**SHOW** [backend/model.py](backend/model.py), lines 28–33:

```python
row = pd.DataFrame([payload])[FEATURES].astype(float)   # 1. reorder
X = _M["preprocessor"].transform(row)                   # 2. transform, never refit
raw = float(_M["model"].predict_proba(X)[:, 1][0])
prob = float(_M["calibrator"].predict([raw])[0])        # 3. calibrate
flagged = prob >= THRESHOLD                             # 4. compare on calibrated scale
```

**SAY**

> Every prediction goes through exactly four steps, and each one matters.
>
> **Step 1: reorder.** The preprocessor was fitted on columns in a specific order.
> If we pass them in a different order, scikit-learn does not raise an error; it
> silently gives a wrong number. So we always reorder to the saved feature list.
>
> **Step 2: transform.** The saved, already-fitted preprocessor converts the row.
> For example, it one-hot encodes smoking status and marital status into separate
> 0/1 columns. We call `transform`, never `fit`, so the server never learns
> anything from user input.
>
> **Step 3: calibrate.** XGBoost gives a raw score. Because we trained with class
> weighting to handle the 4% imbalance, that raw score is **not a real
> probability**; it is inflated. We pass it through an **isotonic regression
> calibrator**, fitted on the Val B half of 2021. The calibrator maps raw scores
> to observed frequencies. After calibration, when the model says 7%, about 7% of
> such profiles really have a stroke history. Our subgroup calibration error stays
> under 0.003.
>
> **Step 4: threshold.** We compare the **calibrated** probability to the
> threshold. That order matters: the threshold was chosen on the calibrated scale,
> so comparing a raw score to it would silently break the recall we promise.

### 5.4 Isotonic calibration (if asked for detail)

> Isotonic regression fits a **monotonic, step-shaped** function from raw score to
> probability, using the Pool-Adjacent-Violators algorithm. It never reverses the
> ranking (a higher raw score never gets a lower probability), so ROC-AUC is
> unchanged. It only fixes the scale.
>
> One side effect: in the top block, profiles that answer "yes" to nearly every
> condition, the calibrated value can be exactly 1.0. Showing "100%" would claim
> false certainty, so the API caps the *displayed* value at 0.99 and the page shows
> ">99%". The flag decision and the database still use the raw calibrated value.
> See `PROB_CEILING` in [backend/main.py](backend/main.py), lines 39 and 65–68.

### 5.5 How the threshold was chosen

**SAY**

> The threshold is **0.0278**, about **2.8%**. That looks very low, and that is
> intentional.
>
> For screening, missing a real case is worse than a false alarm. So we chose the
> threshold on the Val B data to reach a **target recall of about 85%**. On the
> 2023 test year, the model catches about **86% of stroke-history cases**.
>
> The cost is precision. Only about **9%** of flagged profiles actually have a
> stroke history. That is not a defect; it follows from the arithmetic. When only
> 4% of people are positive, catching 86% of them means flagging a large share of
> the population. The results page says this openly, in the sentence *"Most
> flagged profiles do not have a stroke history."*

### 5.6 Performance (Model B, 2023 held-out test year)

| Metric | Value | Meaning |
|---|---|---|
| ROC-AUC | ~0.827 | Ranks a random positive above a random negative 82.7% of the time |
| PR-AUC | ~0.180 | Compare to a 0.04 baseline (prevalence); about 4.5× better than chance |
| Recall at threshold | ~0.86 | Catches 86% of stroke-history cases |
| Precision at threshold | ~0.09 | 9% of flagged profiles are true positives |
| Brier score | ~0.037 | Low: probabilities are well calibrated |
| Flag rate | ~36–43% | Share of the population flagged (the drift page computes 43.4% from the bundle's test confusion matrix) |

**SAY**

> 0.827 is lower than the 0.96 you see in many papers, and that is the honest
> number. Leakage-free published benchmarks on BRFSS report about 0.79, so we are
> in line with them.

**Notes: why PR-AUC matters more than ROC-AUC here.** With 4% positives, ROC-AUC
can look good even when the model makes many false positives. PR-AUC focuses on
the positive class, so it is the stricter metric for imbalanced data.

---

## 6. Model A vs Model B: the causal argument (our main methodological point)

**SHOW** the causal diagram at the bottom of the results page
([frontend/src/CausalDAG.jsx](frontend/src/CausalDAG.jsx)).

**SAY**

> We trained **two** models.
>
> **Model A** uses **28** features. **Model B** uses **21**. The difference is
> seven features: general health, physical activity, physical-health days,
> mental-health days, employment, having a personal doctor, and last checkup.
>
> Remember, the outcome is *lifetime* stroke history, while the features describe
> the person *today*. For these seven, the arrow plausibly runs the **other way**.
> A stroke makes your general health worse, makes you stop working, reduces your
> physical activity, and puts you in regular contact with doctors. They are
> **consequences of the stroke, not risk factors for it**. This is reverse
> causation.
>
> In causal-graph terms, these are **descendants of the outcome**. If a classifier
> conditions on a descendant of the outcome, it finds a strong association that
> has no predictive value for someone who has *not yet* had a stroke, and that is
> exactly the person a screening tool is for. The feature helps in the test set
> and fails in real use.
>
> So we removed them. Model B is what the application serves. Model A stays in the
> bundle **only for the comparison** and is never exposed through any API route.
>
> **What it cost:** PR-AUC dropped from 0.1749 to 0.1611, which is **7.9%
> relative**. That number is our measurement of how much "accuracy" was coming
> from reverse causation. It is real but small, which tells us the model's skill
> mainly comes from plausible risk factors: age, blood pressure, and cardiac
> history.
>
> We should also be honest that Model B is not perfectly clean. "Has a doctor ever
> told you you have high blood pressure" is also more likely to be "yes" after a
> stroke, because survivors are examined thoroughly. Model B **reduces** reverse
> causation; it does not eliminate it.

*Where in code:* `model.py` line 15 loads only `["model_B"]` from the bundle.
`main.py` lines 28–33 also reject any SHAP feature name that is not a Model B
feature.

*Notes: the DAG direction was set from domain knowledge, not learned from data.
With cross-sectional data, the direction of an edge cannot be identified, so a
learned DAG would be an artifact of the algorithm.*

---

## 7. Explainability: SHAP and the guarded narrative

### 7.1 SHAP

**SAY**

> For every prediction we show **why the model scored this profile the way it
> did**, using **SHAP (SHapley Additive exPlanations)**.
>
> SHAP comes from cooperative game theory. Treat each feature as a "player". Its
> Shapley value is its average marginal contribution to the output, averaged over
> every possible order in which features could be added. The key property is
> **local accuracy**: the base value plus all the SHAP values adds up **exactly**
> to the model's output for this person. So the bars are an exact breakdown of
> this person's score, not a rough illustration.
>
> We use **TreeSHAP**, which computes these values exactly and quickly for tree
> models like XGBoost.

**Implementation detail** ([backend/model.py](backend/model.py), lines 21–39):
- `shap.TreeExplainer(model)` is built once at startup.
- SHAP values are computed on the **raw log-odds scale, before calibration**.
  Because isotonic calibration is monotonic, the direction and ranking of the bars
  stay correct; only the units are log-odds.
- One-hot columns such as `smoker_status_2.0` and `marital_3.0` are **summed back**
  to their original feature, so the user sees "Smoking", not encoded columns.
- The top 5 by absolute value are returned with a direction, `up` or `down`.

**SAY**

> One caveat: SHAP explains the **model**, not the world. A large bar means the
> model leans on that answer. It does not mean the answer *causes* anything. That
> is why the bars say *"pushes score up"* and never *"increases your risk"*.

### 7.2 The LLM narrative (with guardrails)

**SAY**

> On top of the bars we optionally show one or two plain-English sentences written
> by a large language model through **OpenRouter**. A health result page is a
> sensitive place for generated text, so we treat the LLM as untrusted:
>
> 1. **Only the feature names and directions** are sent, never personal data or
>    the score.
> 2. A **strict system prompt** bans causal verbs, future-risk language, medical
>    advice, and any mention of Model A features.
> 3. A **post-generation filter** checks the output against a list of banned
>    substrings, such as "risk", "cause", "increase", "should", "diagnos", and the
>    names of excluded features. On **any** match, the sentence is discarded.
> 4. There is a **5-second budget**, with one fallback model. On timeout, error,
>    or rejection, the endpoint returns `null`.
> 5. The page **never waits** for the LLM. It renders the SHAP bars immediately
>    and only adds the sentence if a safe one arrives.

*Where in code:* [backend/narrative.py](backend/narrative.py). See `SYSTEM_PROMPT`,
`BANNED`, `passes()`, and `generate()`. The frontend call, which never rejects, is
`getNarrative` in [frontend/src/api.js](frontend/src/api.js).

*Notes: in the current setup `OPENROUTER_API_KEY` may be empty. In that case the
narrative is simply absent and the page shows the bars only. That is the designed
fallback, not a bug.*

---

## 8. Live demo and how to read the result page

### 8.1 Demo steps

1. Open the app at `http://127.0.0.1:5173`.
2. **Step 1, About you:** age, sex, height, weight, area, education, marital
   status, home, veteran.
3. **Step 2, Medical history:** the eight "Has a doctor ever told you…" questions.
4. **Step 3, Lifestyle & access:** smoking, drinking, insurance, cost barrier.
5. Click **"See screening result"**.

*Demo tip:* run two profiles to show the contrast. First, a 30-year-old with no
conditions, which should be low and not flagged. Then a 72-year-old with high BP,
diabetes, and a heart condition, which should be high and flagged.

*Also show validation:* enter age 150 and point out that the error names the valid
range. That range is **read from `model_config.json`**, not hard-coded.

### 8.2 How to read the result page (top to bottom)

**SHOW** the result page and walk down it.

**① The big number + caption**
> *"This profile scores 12.4% on our screening model."*

This is the **calibrated probability**: among people in the training data with a
similar profile, about this share reported a stroke history. It is **not** the
chance of a future stroke.

**② The verdict: "Flagged for follow-up" or "Not flagged"**

Flagged means the score is at or above the threshold (~2.8%). The line beneath it
reads: *"Profiles above 2.8% are flagged so that roughly 86% of stroke-history
cases are captured. Most flagged profiles do not have a stroke history."* The
second sentence is required because precision is ~9%.

**③ The score bar (measurement scale)**
- A neutral horizontal scale with tick marks.
- A vertical line marks the **follow-up threshold**.
- A **dot** shows this profile's score.
- There are **no red/amber/green colours** on purpose. Traffic-light colours imply
  a severity judgement that the model cannot make.

**④ "What distinguishes this profile" (SHAP bars)**
- Up to 5 features, the most influential for **this** person.
- Bars to the **right** mean "pushes score up"; bars to the **left** mean
  "pushes score down".
- Bar **length** shows relative influence (scaled to the largest bar).
- Footnote: *"Attribution within the model, not cause and effect."*
- If the LLM sentence is available, it appears above the bars, for example: *"This
  profile differs from lower-scoring profiles mainly in age and blood pressure
  history."*

**⑤ "Why seven survey questions are not used" (causal diagram)**
- Top row: upstream factors (age, BP, diabetes, cholesterol, smoking, BMI) with
  arrows **into** Stroke history.
- Bottom (greyed, dashed): the 7 excluded answers, with arrows **from** Stroke
  history. They are consequences, so they are excluded.
- This shows the Model A vs Model B reasoning directly in the product.

**⑥ Left rail + footer**
- The rail reminds the user that the model was trained on the "ever told" question
  and *"describes the past. It cannot see forward in time."*
- The footer disclaimer appears on every page.

---

## 9. Drift monitoring (PSI)

**SHOW** the "Drift dashboard" link in the header (`#drift`).

**SAY**

> A deployed model can degrade without any error if the people using it differ
> from the people it was trained on. We monitor this with the **Population
> Stability Index**.
>
> For each feature we take the **training distribution**, split into deciles (or
> two bins at 0.5 for yes/no answers), and compare it with the distribution of
> stored assessments:
>
> **PSI = Σ (Actual − Expected) × ln(Actual / Expected)**
>
> PSI is a symmetric form of KL divergence. It is 0 when the two distributions
> match and grows as they separate. We add a tiny epsilon (10⁻⁶) to each bin so an
> empty bin never produces ln(0).
>
> **Bands:** below 0.1 is stable, 0.1–0.25 is moderate, above 0.25 is significant.
>
> We also track **prediction drift**: the live flag rate and mean score compared
> with the flag rate expected from the 2023 test year. True labels for live users
> are not available, so these two proxy signals are the best monitoring we have.

**Points worth mentioning:**
- The reference bins are the **exact training distribution**, exported from the
  Colab notebook into `model_config.json` → `reference_bins`. They are not
  approximated.
- The dashboard refuses to show PSI below **30 assessments**, because small
  samples overstate drift. The page explains this.
- [backend/check_drift.py](backend/check_drift.py) is a test script. It checks
  that PSI of a distribution against itself is 0, that clearly shifted
  distributions exceed 0.25, that empty bins never give inf/NaN, and that the band
  cutoffs are correct.
- [backend/seed_demo.py](backend/seed_demo.py) can generate demo rows sampled from
  the training distribution (tagged `source='seed'`) so the dashboard has data to
  show.

*Where in code:* [backend/drift.py](backend/drift.py) (`psi`, `bin_props`, `band`,
`report`) and [frontend/src/Drift.jsx](frontend/src/Drift.jsx).

---

## 10. Novelty and contributions

**SAY**

> Our contribution is not the classifier itself, which is a standard XGBoost. It
> is the **measurements** and the **honest engineering around it**.

**Research findings (each one measured, not just stated):**

| # | Finding | Number |
|---|---|---|
| 1 | Honest, leakage-free performance with a temporal split | ROC-AUC 0.827, PR-AUC 0.180 (vs ~0.96 claimed with leakage) |
| 2 | **Reverse causation quantified** (Model A → Model B) | 7.9% relative PR-AUC |
| 3 | **SMOTE is harmful** on one-hot survey data | PR-AUC 0.1749 → 0.1304. Every synthetic row contains impossible values such as `diabetes = 0.33` |
| 4 | **More data adds little** | One survey year reaches 97.9% of full performance; 3× data gives only +0.0036 PR-AUC. The SMOTE mistake costs **12×** what tripling the data gains |
| 5 | **Fairness has a price** | Equalising recall across age bands caught 2 extra cases while flagging 31,785 more people, about **15,900 extra flags per extra case**, so a single threshold was kept and the cost documented |
| 6 | **Ascertainment bias is in the label** | Uninsured under-65s *report* fewer strokes (2.05% vs 2.40%) because they are less often diagnosed. Removing access features barely changed anything (−0.43%), so the bias comes from the outcome definition, not the features |

**Engineering novelty:**
1. **Causal reasoning in the product.** The DAG on the results page explains to
   the user why features were excluded.
2. **Calibrated probabilities + recall-targeted threshold**, with precision
   disclosed openly in the UI.
3. **Config-driven validation.** API validators are generated from
   `model_config.json` at startup, so the model and the API can never disagree on
   valid ranges ([backend/schema.py](backend/schema.py)).
4. **Guarded LLM.** Prompt rules, a post-filter, a time budget, and a fallback.
   The LLM can only add a sentence, never break or delay the page.
5. **Responsible-language system.** All user-facing text is in one file
   ([frontend/src/copy.js](frontend/src/copy.js)) and checked against a
   banned-phrase list ([docs/UI_COPY_RULES.md](docs/UI_COPY_RULES.md)).
6. **Built-in drift monitoring** against the exact training distribution.
7. **Privacy by design.** No names, emails, or IPs; only a random UUID per row.
8. **Reproducibility check.** [backend/verify_model.py](backend/verify_model.py)
   reloads the bundle and confirms it reproduces Colab's predictions on 200 sample
   rows to within 10⁻⁶ (measured max difference 1.49 × 10⁻⁸). Library versions
   are pinned exactly (scikit-learn 1.6.1, xgboost 3.4.1, numpy 2.1.3).

---

## 11. Limitations and closing

**SAY**

> We'd like to be clear about the limits:
>
> 1. **Lifetime prevalence, not incidence.** It cannot predict the future.
> 2. **Ascertainment bias.** Undiagnosed strokes count as negatives.
> 3. **Survivorship bias.** It is a telephone survey of living adults; fatal
>    strokes are absent.
> 4. **No clinical measurements.** No atrial fibrillation, measured blood pressure,
>    or lab values.
> 5. **Recall varies with age**: 0.72 under 65 vs 0.94 at 65+, caused by using a
>    single threshold.
> 6. **No external clinical validation yet.** Temporal validation across five years
>    is a strength but does not replace it.
>
> **Future work:** clinical validation on examined data such as NHANES, real
> deployment with HTTPS and a managed database, and an optional result-explainer
> chatbot with an emergency-symptom check.
>
> To sum up: we built a working, explainable, monitored screening application,
> and we measured where the impressive numbers in this field come from. Thank you.
> We're happy to take questions.

---

## Appendix A: Code location map

### ML / model files (`models/`)

| File | What it is |
|---|---|
| [models/stroke_model.joblib](models/stroke_model.joblib) | The trained bundle: `model_A` (comparison only), `model_B` (served: preprocessor, XGBoost model, isotonic calibrator, threshold, 21 feature names, transformed column names, test metrics), and `meta` (years, sizes, library versions) |
| [models/model_config.json](models/model_config.json) | Input schema (type/min/max/median for all 28 features), both thresholds, metadata, and `reference_bins` (training distribution for PSI) |
| [models/sanity_input.csv](models/sanity_input.csv) | 200 test rows |
| [models/sanity_expected.npy](models/sanity_expected.npy) | Their expected Model B probabilities from Colab |

*Training was done in a Google Colab notebook kept outside this repository. The
repo only consumes the exported bundle.*

### Backend (`backend/`, Python FastAPI)

| File | Role | Key lines |
|---|---|---|
| [backend/main.py](backend/main.py) | App entry point; all HTTP routes; display cap at 0.99; disclaimer | Routes 46–94, predict 56–78 |
| [backend/model.py](backend/model.py) | **ML integration.** Loads Model B once, 4-step inference, TreeSHAP, folds one-hot SHAP back, top-5 | Load 15–21, predict 28–51 |
| [backend/schema.py](backend/schema.py) | Builds the Pydantic `PatientInput` validator from `model_config.json`; forbids extra fields | 13–27 |
| [backend/narrative.py](backend/narrative.py) | OpenRouter LLM call with system prompt, banned-word filter, 5s budget, fallback | Prompt 16–26, filter 31–53 |
| [backend/drift.py](backend/drift.py) | PSI computation and drift report | psi 28–30, report 38–58 |
| [backend/db.py](backend/db.py) | PostgreSQL insert/read with plain SQL, no ORM | — |
| [backend/sql/001_init.sql](backend/sql/001_init.sql) | `assessments` table: id (UUID), created_at, inputs (JSONB), probability, flagged, threshold, model_version, shap_top, source | — |
| [backend/verify_model.py](backend/verify_model.py) | Reproducibility check against Colab output | — |
| [backend/check_drift.py](backend/check_drift.py) | PSI correctness tests | — |
| [backend/seed_demo.py](backend/seed_demo.py) | Generates demo rows for the drift dashboard | — |
| [backend/requirements.txt](backend/requirements.txt) | Pinned dependencies | — |

### Frontend (`frontend/src/`, React + Vite + Tailwind)

| File | Role |
|---|---|
| [frontend/src/App.jsx](frontend/src/App.jsx) | Top-level page; switches between Form, Result, and Drift (`#drift`); header and footer |
| [frontend/src/Form.jsx](frontend/src/Form.jsx) | 3-step questionnaire with per-step validation, including the BMI range check |
| [frontend/src/api.js](frontend/src/api.js) | API calls, `computeBmi`, `buildPayload` (orders the 21 features, checks integer codes) |
| [frontend/src/Result.jsx](frontend/src/Result.jsx) | Result page: big score, flag, score bar, SHAP bars, narrative |
| [frontend/src/CausalDAG.jsx](frontend/src/CausalDAG.jsx) | Inline SVG causal diagram |
| [frontend/src/Drift.jsx](frontend/src/Drift.jsx) | PSI dashboard and prediction-drift panel |
| [frontend/src/Rail.jsx](frontend/src/Rail.jsx) | Left-side step tracker and notes |
| [frontend/src/copy.js](frontend/src/copy.js) | **All** user-facing text and question wording |
| [frontend/src/index.css](frontend/src/index.css) | Design tokens, light/dark theme |
| [frontend/vite.config.js](frontend/vite.config.js) | Dev server on 5173; proxies `/api` to the backend on 8000 |

### Documentation

| File | Contents |
|---|---|
| [docs/MODEL_CARD.md](docs/MODEL_CARD.md) | Model purpose, data, bundle structure, metrics, limitations |
| [docs/ACADEMIC_DOSSIER.md](docs/ACADEMIC_DOSSIER.md) | Full research argument: PSI math, DAG and d-separation, SHAP math, ascertainment bias |
| [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) | The 21 features, codes, and question wording |
| [docs/UI_COPY_RULES.md](docs/UI_COPY_RULES.md) | Banned and required phrases |
| [logs/BUILD_LOG.md](logs/BUILD_LOG.md), [logs/AUDIT_LOG.md](logs/AUDIT_LOG.md) | Build history and justification of every rule-relevant decision |

### Tech stack summary

- **ML:** XGBoost 3.4.1, scikit-learn 1.6.1 (preprocessor and isotonic
  calibrator), SHAP (TreeExplainer), pandas, numpy 2.1.3, joblib
- **Backend:** Python 3.12, FastAPI, Pydantic v2, Uvicorn, psycopg (PostgreSQL 17)
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **LLM:** OpenRouter (Claude Haiku 4.5 first, Gemini 2.5 Flash as fallback)
- **Runtime note:** the backend runs in WSL Ubuntu, because the pickled bundle
  would not load on native Windows.

### How to run (in case you're asked to demo live)

```bash
# Backend: in WSL, from the repo root
backend/.venv/bin/uvicorn main:app --app-dir backend --port 8000

# Frontend: from frontend/
npx vite --host 127.0.0.1 --port 5173
```

---

## Appendix B: Likely faculty questions

**Q: Is this predicting whether I will get a stroke?**
No. The label is "ever told by a doctor you had a stroke", which is lifetime
history from cross-sectional data. It is a screening classifier. Section 2.

**Q: Why is the threshold only 2.8%?**
It was chosen on the calibrated scale to catch about 85% of cases. With 4%
prevalence, high recall requires a low cutoff. Precision is ~9%, and we say so on
the page.

**Q: Why not just use accuracy?**
A model that always says "no stroke" is 96% accurate. With 4% positives, accuracy
is meaningless, so we report PR-AUC, recall, precision, and Brier score.

**Q: Why XGBoost and not a neural network or logistic regression?**
On tabular yes/no survey data, gradient-boosted trees are the strongest standard
choice. They capture interactions and non-linearity automatically, handle missing
values, train fast on 1.3M rows, and allow exact SHAP explanations. Neural
networks rarely beat them on this kind of data and are harder to explain. Logistic
regression would need hand-made interaction terms.

**Q: Why calibrate? Isn't XGBoost's output already a probability?**
Class weighting inflates the raw scores, so they don't match real frequencies.
Isotonic calibration fixes the scale without changing the ranking. A displayed
"7%" then really means about 7%.

**Q: Why isotonic and not Platt (sigmoid) scaling?**
Isotonic regression makes no assumption about the shape of the miscalibration,
only that it is monotonic. With hundreds of thousands of validation rows there is
plenty of data to fit it without overfitting.

**Q: Why not use SMOTE for the imbalance?**
We measured it. SMOTE interpolates between rows, which creates impossible values
such as `diabetes = 0.33` and fractional one-hot columns. PR-AUC dropped from
0.1749 to 0.1304. Class weighting was better.

**Q: Why did you remove features that improve accuracy?**
They are consequences of a stroke (reverse causation). They help on the test set
but give no information about someone who hasn't had a stroke yet, which is
exactly the person screening is for. We measured the cost at 7.9% relative
PR-AUC. Section 6.

**Q: Is SHAP showing causes?**
No. It shows how the *model* used each answer for this prediction. That is why the
UI says "pushes score up", not "increases risk".

**Q: Why are SHAP values computed before calibration?**
TreeSHAP works on the tree model's raw log-odds output. Calibration is monotonic,
so direction and ranking are preserved; only the units differ.

**Q: What if the LLM writes something harmful?**
It only receives feature names and directions. A strict prompt bans causal and
future language, and a hard substring filter discards any output that breaks the
rules. Any failure means no sentence; the page never depends on the LLM.

**Q: How do you stop a mismatch between the model and the API inputs?**
Validators are generated from `model_config.json` at startup, extra fields are
rejected, and columns are always reordered to the saved feature list before
transforming.

**Q: How do you know the deployed model matches the trained one?**
`verify_model.py` reproduces Colab's predictions on 200 rows to within 10⁻⁶
(measured 1.49 × 10⁻⁸), and library versions are pinned exactly.

**Q: What personal data do you store?**
Only the 21 answers, the score, and a random UUID. No name, email, IP, or browser
information.

**Q: What is PSI and why does it matter?**
It measures how far live inputs have moved from the training distribution. A
high PSI warns that the model's numbers may no longer be reliable, before we
could ever see true labels.

**Q: Why is recall lower for under-65s?**
At younger ages the base rate is low, so a single global threshold catches fewer
cases there. Per-age thresholds would fix it but flag about 15,900 extra people
per extra case caught, so we kept one threshold and documented the trade-off.

**Q: What is new here compared with existing stroke-prediction projects?**
Section 10. In short: honest leakage-free numbers, a measured cost of reverse
causation, a measured harm of SMOTE, calibrated and disclosed operating
characteristics, causal reasoning shown in the UI, a guarded LLM, and built-in
drift monitoring.
