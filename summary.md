# NeuroFlow AI — Complete Report Writing Guide (30+ Pages)

> **HOW TO USE THIS FILE:**
> Each section has a **"Prompt to Gemini"** box. Copy that section's content and paste it to Gemini.
> For code sections, the EXACT FILE PATH and LINE NUMBERS are given — open the file, copy those lines, paste them directly into your report under the relevant heading.
> Target: minimum 30 pages. Each chapter is designed to fill 5-8 pages when written in full academic style.

---

## CONTENTS                                                     PAGE

| # | Section | Target Pages |
|---|---|---|
| — | Abstract | i |
| — | Acknowledgement | ii |
| — | Table of Contents | iii |
| — | List of Figures | iv |
| — | List of Tables | v |
| — | List of Acronyms | vi |
| 1 | CHAPTER 1: Introduction | 1–8 |
| 2 | CHAPTER 2: Background & Literature Survey | 9–16 |
| 3 | CHAPTER 3: System Design & Implementation | 17–26 |
| — | Conclusion & Future Work | 27–29 |
| — | References | 30 |

---
---

## ABSTRACT

**Prompt to Gemini:** "Write a formal one-page academic abstract (250–300 words) for a BE/BTech final year project titled NeuroFlow AI. The abstract should cover motivation, methodology, key results, and significance. Use the following facts."

### Facts for abstract:
- **Full Project Title:** NeuroFlow AI — Stroke-History Classification and Risk Screening Web Application
- **Problem:** Published ML stroke models on CDC survey data falsely report ROC-AUC ~0.96 due to two methodological flaws: (1) reverse causation — including features that are consequences of a stroke, not causes; (2) SMOTE applied to one-hot encoded categorical data, producing 100% physically invalid synthetic samples.
- **What was built:** A full-stack web application that takes 21 self-reported health inputs from a user and returns a calibrated stroke-history screening score with SHAP-based explanations, a causal DAG visualization, and real-time drift monitoring.
- **Dataset:** CDC BRFSS — 2.17 million respondents across five odd-numbered survey years (2015–2023). The model is trained on self-reported lifetime stroke history (CVDSTRK3), not future stroke incidence.
- **Model:** XGBoost with isotonic calibration. Two variants built — Model A (28 features) and Model B (21 features, reverse causation removed). Only Model B is served.
- **Key Measured Results:**
  - Leakage-free ROC-AUC: 0.827 | PR-AUC: 0.180 (vs. published ~0.96)
  - Reverse causation costs 7.9% relative PR-AUC
  - SMOTE costs −0.0445 PR-AUC; every synthetic row is physically invalid
  - Tripling training data gains only +0.0036 PR-AUC
  - Fairness intervention (per-band thresholds) costs ~15,900 extra flags per additional case caught
- **Tech Stack:** FastAPI + React/Vite + PostgreSQL + SHAP + OpenRouter LLM
- **Significance:** The measured cost of each methodological shortcut is the project's academic contribution — not the model itself.

---

## ACKNOWLEDGEMENT

**Prompt to Gemini:** "Write a formal academic acknowledgement section (one page) for a final year project using the following points. Write in humble, formal tone."

- Thanks to the **CDC (Centers for Disease Control and Prevention)** for making the BRFSS dataset publicly available at no cost, enabling reproducible research on stroke epidemiology.
- Thanks to **Google Colab** for providing the compute infrastructure used for model training on ~2.17M rows of BRFSS data.
- Thanks to the developers of **open-source tools**: scikit-learn, XGBoost, SHAP, FastAPI, Uvicorn, React, Vite, PostgreSQL, Pydantic, psycopg, python-dotenv.
- Thanks to **OpenRouter** for providing affordable LLM API access (Claude Haiku, Gemini Flash) used in the guardrailed narrative module.
- Guide/Faculty placeholder: *This project was completed under the valuable guidance of [Prof. Name], [Department], [Institution Name], whose insights were instrumental in shaping the research direction.*
- Teammates placeholder: *The authors also thank their peers and classmates for constructive discussions throughout the project duration.*

---
---

## TABLE OF CONTENTS

```
CONTENTS                                                         PAGE

Abstract                                                          i
Acknowledgement                                                  ii
Table of Contents                                               iii
List of Figures                                                   iv
List of Tables                                                    v
List of Acronyms                                                  vi

CHAPTER 1  INTRODUCTION
  1.1   Introduction                                              1
  1.2   Overview of the Problem Domain                           2
  1.3   Problem Statement                                        4
  1.4   Challenges in Stroke ML on Survey Data                   5
  1.5   Objectives of the Project                                7
  1.6   Scope of the Project                                     7

CHAPTER 2  BACKGROUND AND LITERATURE SURVEY
  2.1   Introduction                                             9
  2.2   CDC BRFSS Dataset Overview                              10
  2.3   Machine Learning in Stroke Classification               11
  2.4   Reverse Causation and Causal Reasoning in Health ML     12
  2.5   SMOTE and Class Imbalance                               13
  2.6   Explainability: SHAP and TreeSHAP                       14
  2.7   Population Stability Index (PSI) for Model Monitoring   15
  2.8   Summary of Literature Survey                            16

CHAPTER 3  SYSTEM DESIGN AND IMPLEMENTATION
  3.1   System Architecture Overview                            17
  3.2   Dataset Preparation and Model Training (ML Component)   18
  3.3   Backend — FastAPI REST API                              20
  3.4   Database Design — PostgreSQL                            22
  3.5   Frontend — React + Vite Web Application                 23
  3.6   SHAP Explainability Module                              24
  3.7   LLM Narrative Module (Guardrailed)                      25
  3.8   Drift Monitoring Dashboard (PSI)                        25
  3.9   Input and Output                                        26

Conclusion and Future Work                                      27
References                                                      30
```

---

## LIST OF FIGURES

| Figure No. | Title | Page |
|---|---|---|
| Figure 1.1 | System Architecture — NeuroFlow AI (FastAPI + React + PostgreSQL) | 17 |
| Figure 1.2 | Module Build Pipeline — 5-phase sequential development | 18 |
| Figure 2.1 | Assumed Causal DAG — Upstream Risk Factors → Stroke → Excluded Descendants | 12 |
| Figure 2.2 | Comparison of PR-AUC across SMOTE, class weighting, and model variants | 13 |
| Figure 2.3 | Data volume vs. PR-AUC — diminishing returns curve | 14 |
| Figure 3.1 | XGBoost + sklearn pipeline: preprocessor, model, calibrator chain | 19 |
| Figure 3.2 | Database schema — assessments table (PostgreSQL, JSONB columns) | 22 |
| Figure 3.3 | NeuroFlow — Step 1 of intake form (Demographics) | 23 |
| Figure 3.4 | NeuroFlow — Step 2 of intake form (Medical History) | 23 |
| Figure 3.5 | NeuroFlow — Step 3 of intake form (Lifestyle) | 24 |
| Figure 3.6 | Results page — score bar, flag status, SHAP diverging bar chart | 24 |
| Figure 3.7 | Causal DAG visualization on results page (inline SVG) | 24 |
| Figure 3.8 | PSI Drift Dashboard — per-feature stability bars with threshold lines | 25 |
| Figure 3.9 | Sample API request and response (POST /api/v1/predict) | 26 |

---

## LIST OF TABLES

| Table No. | Title | Page |
|---|---|---|
| Table 2.1 | BRFSS Survey Years Used — Training, Validation, Test splits | 10 |
| Table 2.2 | Comparison of Published BRFSS Model Accuracy vs. Leakage-Free Benchmarks | 11 |
| Table 2.3 | Model A (28 features) vs. Model B (21 features) — Feature Comparison | 12 |
| Table 2.4 | Effect of SMOTE vs. Class Weighting on PR-AUC | 13 |
| Table 2.5 | Data Volume Experiment: PR-AUC vs. Number of Training Years | 14 |
| Table 2.6 | Ascertainment Bias: Stroke Prevalence and Recall by Insurance Status | 15 |
| Table 2.7 | Per-Band Threshold Fairness Analysis: Flags per Additional Case Caught | 15 |
| Table 2.8 | Contribution Summary — All Measured Findings | 16 |
| Table 3.1 | All 21 Model B Input Features with Types, Valid Ranges, and Form Questions | 21 |
| Table 3.2 | FastAPI Endpoints — URL, Method, Description, Response | 20 |
| Table 3.3 | PSI Bands and Their Interpretation | 25 |
| Table 3.4 | Categorical Encoding Codes (smoker_status, education, marital) | 21 |
| Table 3.5 | Model B Performance Metrics — 2023 Test Year | 20 |
| Table 3.6 | Technology Stack Summary | 17 |

---

## LIST OF ACRONYMS

| Acronym | Full Form |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| BMI | Body Mass Index |
| BRFSS | Behavioral Risk Factor Surveillance System |
| CDC | Centers for Disease Control and Prevention |
| CI | Confidence Interval |
| COPD | Chronic Obstructive Pulmonary Disease |
| CVDSTRK3 | BRFSS target variable — self-reported lifetime stroke history |
| DAG | Directed Acyclic Graph |
| HTTP | Hypertext Transfer Protocol |
| JSON | JavaScript Object Notation |
| JSONB | JSON Binary (PostgreSQL storage type) |
| KL | Kullback–Leibler divergence |
| LLM | Large Language Model |
| ML | Machine Learning |
| ORM | Object-Relational Mapping |
| PAV | Pool Adjacent Violators (isotonic calibration algorithm) |
| PR-AUC | Precision-Recall Area Under the Curve |
| PSI | Population Stability Index |
| REST | Representational State Transfer |
| ROC-AUC | Receiver Operating Characteristic — Area Under the Curve |
| SHAP | SHapley Additive exPlanations |
| SMOTE | Synthetic Minority Over-sampling Technique |
| SQL | Structured Query Language |
| SVG | Scalable Vector Graphics |
| UI | User Interface |
| XGBoost | Extreme Gradient Boosting |

---
---

## CHAPTER 1 — INTRODUCTION
### (Target: 8 pages. Paste each sub-section to Gemini separately.)

---

### 1.1 INTRODUCTION

**Prompt to Gemini:** "Write section 1.1 Introduction (1.5 pages, academic tone, full paragraphs) for a final year project report on NeuroFlow AI using these facts."

- Stroke is the second leading cause of death globally and a major cause of long-term adult disability.
- Machine learning applied to population-level health survey data offers a scalable, low-cost method for stroke-history screening — without requiring clinical examinations or laboratory tests.
- The CDC BRFSS is the world's largest continuous health survey: ~2.17 million adult respondents across the 5 years used in this project.
- However, a reproducibility crisis exists in this domain: published models frequently report ROC-AUC near 0.96 on BRFSS data. Independent, leakage-free benchmarks sit near 0.794–0.827. This gap is not due to better models — it is due to systematic methodological errors that artificially inflate measured accuracy.
- NeuroFlow AI is a full-stack web application that:
  (a) builds a methodologically rigorous stroke-history classifier on BRFSS data,
  (b) quantifies — in measured, reproducible numbers — the cost of each methodological shortcut that inflates published accuracy,
  (c) serves the rigorous model (Model B) through a user-facing web interface with transparent, guardrailed explanations.
- The system is designed for use by researchers and public health practitioners — not as a diagnostic tool. Every UI element is governed by strict copy rules to prevent misrepresentation.

---

### 1.2 OVERVIEW OF THE PROBLEM DOMAIN

**Prompt to Gemini:** "Write section 1.2 Overview of the Problem Domain (2 pages) for a final year project report on NeuroFlow AI using these facts. Include explanations of BRFSS, stroke history classification, and the difference between incidence and prevalence in health ML."

- **What is a stroke?** A stroke (cerebrovascular accident) occurs when blood supply to part of the brain is blocked (ischemic) or a blood vessel ruptures (hemorrhagic). It causes rapid loss of brain function and is a medical emergency.
- **Stroke burden:** Globally, ~15 million strokes occur annually. ~5 million result in permanent disability. Stroke is responsible for 11% of total global deaths (WHO).
- **Screening vs. prediction vs. diagnosis:**
  - *Prediction* models estimate the future probability of a stroke occurring (requires longitudinal follow-up data).
  - *Screening* models classify whether a person has characteristics associated with a health condition — used to identify who should receive further evaluation.
  - *Diagnosis* is made by a clinician using clinical examination, imaging, and lab results.
  - NeuroFlow AI is a **screening** tool only. It classifies self-reported lifetime stroke *history*, not future risk.
- **CDC BRFSS:**
  - Behavioral Risk Factor Surveillance System — annual telephone survey by the CDC across all 50 US states.
  - Collects data on health behaviors, chronic conditions, and preventive health practices.
  - ~400,000–500,000 adult respondents per year.
  - Odd years only used in this project because hypertension and cholesterol questions (two important stroke risk factors) are only asked by all states in odd-numbered years (BRFSS rotating core design).
- **Target variable CVDSTRK3:** "Has a doctor ever told you that you had a stroke?" — binary yes/no. This is lifetime prevalence (has it ever happened?), not incidence (did it happen this year?). There is no temporal ordering between the survey features and this outcome. A respondent's 2023 BMI cannot have caused a stroke they reported in 2005.
- **Training split:** 2015, 2017, 2019 (training) → 2021 (validation) → 2023 (held-out test, scored once). Total: ~2.17M respondents, 1.3M training rows, 55,970 positive cases (4.29% prevalence).
- **Two models built:**
  - Model A: 28 features — full BRFSS risk factor set
  - Model B: 21 features — 7 features removed that may reflect post-stroke consequences (reverse causation). Model B is the only one served to users.
- **Model architecture:** XGBoost gradient-boosted classifier → isotonic regression calibration → probability threshold selected on validation set. Column order is fixed; wrong order produces wrong answers with no error raised.

---

### 1.3 PROBLEM STATEMENT

**Prompt to Gemini:** "Write section 1.3 Problem Statement (1.5 pages) for a final year project report. This section must be precise, formal, and clearly define what problem is being solved, why existing solutions are insufficient, and what this project specifically addresses."

#### THE CORE PROBLEM (write this word-for-word in your report):

> Published machine learning models for stroke classification on CDC BRFSS data routinely report ROC-AUC values near 0.96. Independent, leakage-free evaluations of the same dataset yield ROC-AUC near 0.794–0.827. This gap of approximately 0.13–0.17 ROC-AUC points represents a systematic inflation of accuracy arising from two well-documented but underquantified methodological failures:
>
> **(1) Reverse Causation:** Cross-sectional survey data captures a respondent's health status at one point in time. The outcome variable — lifetime stroke history — may have occurred years or decades before the survey. Features such as general health rating, physical activity, mental health days, employment status, and healthcare access may reflect the consequences of having had a stroke, not prior risk factors. Including such features in a stroke classifier introduces post-outcome information into the model's inputs, inflating in-sample performance while making the model inapplicable to people who have not had a stroke — the very population it is meant to screen.
>
> **(2) SMOTE Applied to Categorical Survey Data:** Synthetic Minority Over-sampling Technique (SMOTE) is widely applied to address class imbalance in stroke datasets. SMOTE generates synthetic samples by interpolating between nearest neighbours in feature space. BRFSS features are primarily binary (yes/no) and one-hot encoded categorical variables. Interpolation between binary features produces fractional values (e.g., diabetes = 0.33, marital_divorced = 0.41) that have no real-world interpretation — a patient cannot be 33% diabetic. This study finds that 21% of binary cells and 18% of one-hot cells in SMOTE-generated rows are fractional, making 100% of synthetic samples physically invalid. Despite this, SMOTE is routinely applied in published BRFSS studies without validation.
>
> **The compounding problem** is that neither failure is quantified in the papers that commit it. Authors report the inflated metric without reporting what the leakage-free metric would be, or what the SMOTE-free metric would be. This makes it impossible for a reader to assess how much of the reported accuracy is genuine signal and how much is methodological artifact.
>
> **NeuroFlow AI addresses this problem** by: (a) building two models — one with the full feature set (Model A, academic comparison only) and one with post-outcome features removed (Model B, served to users) — and measuring the PR-AUC difference; (b) evaluating SMOTE and class weighting side-by-side and reporting the PR-AUC difference; (c) running a data-volume ablation to separate the effect of more data from the effect of SMOTE; (d) serving Model B through a production-quality web application with strict guardrails against misrepresenting the screening score as a future-risk prediction or clinical diagnosis.

#### Additional problem statement points:
- There is also no existing open-source reference implementation of a methodologically sound BRFSS stroke-history screener with SHAP-based per-user explanations, causal DAG visualization, and production-grade drift monitoring.
- Existing academic studies do not monitor how their deployed models behave over time. NeuroFlow adds a Population Stability Index (PSI) dashboard that tracks whether the distribution of incoming user profiles has shifted relative to the training data.
- The UI/UX problem: even technically correct ML models can mislead users if their outputs are described with causal or predictive language. NeuroFlow enforces a comprehensive set of UI copy rules to prevent phrases like "your stroke risk is X%" from appearing.

---

### 1.4 CHALLENGES IN STROKE ML ON SURVEY DATA

**Prompt to Gemini:** "Write section 1.4 Challenges (1 page) using the following points in formal academic style."

1. **Reverse causation (addressed):** Seven BRFSS features post-date the stroke outcome for many respondents. Including them in the model inflates performance but destroys applicability. Cost quantified at 7.9% relative PR-AUC.
2. **SMOTE invalidity on categorical data (addressed):** Produces 100% invalid synthetic rows when applied to one-hot encoded features. Cost quantified at −0.0445 PR-AUC.
3. **Calibration requirement:** The model uses an isotonic regression calibrator. The threshold is selected on calibrated probabilities. Skipping calibration and comparing a raw XGBoost score against a calibrated threshold silently destroys recall — the score is still a number, so no error is raised.
4. **Ascertainment bias (documented, not solved):** CVDSTRK3 requires a doctor's diagnosis. Undiagnosed strokes are labelled as negative, concentrated among those with less healthcare access. Uninsured respondents show lower reported stroke prevalence (2.05%) than insured (2.40%) — the opposite of what their risk profiles predict. This is a label-level bias that cannot be corrected by any modelling technique applied to this dataset.
5. **Recall disparity by age (documented, not solved):** Recall is 0.72 for under-65s vs. 0.94 for 65+ at the same global threshold. Per-band thresholds were evaluated and rejected: correcting the recall gap costs ~15,900 additional false positives per additional case caught.
6. **Survivorship bias:** BRFSS surveys living, non-institutionalized adults by telephone. Fatal strokes are absent from the data; severe survivors who cannot use a telephone are under-represented.
7. **Column-order sensitivity:** XGBoost's preprocessor was fitted on a specific feature column order. Passing features in a different order produces wrong predictions with no error — the most likely silent bug in any re-implementation.
8. **LLM safety on health outputs:** An unrestricted LLM asked to narrate a stroke screening result will use causal language ("your blood pressure increases your risk") and may give medical advice. A post-generation banned-substring filter is required, with graceful fallback when the filter rejects the output.

---

### 1.5 OBJECTIVES OF THE PROJECT

**Prompt to Gemini:** "Write section 1.5 Objectives (half a page) as a numbered list with one sentence of explanation each."

1. To build a leakage-free, temporally split stroke-history classifier on ~2.17M CDC BRFSS respondents using XGBoost.
2. To quantify the performance cost of reverse causation by comparing Model A (28 features) to Model B (21 features, post-outcome features removed).
3. To demonstrate — through controlled measurement — that SMOTE applied to one-hot-encoded survey data is harmful and that all synthetic rows are physically invalid.
4. To build a production-quality FastAPI backend that dynamically generates its input validation schema from the trained model's configuration file, ensuring schema and model are always consistent.
5. To build a React/Vite frontend with a 3-step intake form, client-side BMI computation, and full client-side validation.
6. To display per-user SHAP-based feature attributions with a guardrailed LLM narrative using comparative-framing-only language.
7. To visualize the assumed causal DAG showing why 7 features were excluded from Model B.
8. To monitor input distribution drift and prediction distribution drift in real time using Population Stability Index (PSI).
9. To enforce comprehensive UI copy rules that prevent the screening score from being misrepresented as a future-risk prediction or clinical diagnosis.

---

### 1.6 SCOPE OF THE PROJECT

**Prompt to Gemini:** "Write section 1.6 Scope (half a page) covering both what is included and what is explicitly excluded, in formal academic style."

**In scope:**
- Model training pipeline (XGBoost, sklearn preprocessing, isotonic calibration) — executed in Google Colab, exported as a .joblib bundle
- FastAPI REST API with dynamic Pydantic validation, 6 endpoints, PostgreSQL persistence
- React + Vite 3-step intake form (21 clinical fields, client-side BMI, field-level validation)
- SHAP TreeExplainer for per-user feature attributions (top-5 by absolute SHAP value)
- Guardrailed LLM narrative (OpenRouter — Claude Haiku / Gemini Flash fallback) with post-generation content filter
- PSI-based drift monitoring dashboard for all 21 input features and prediction output distribution
- Strict UI copy rules governing all user-visible text

**Explicitly out of scope:**
- User authentication, login, or patient record management (all sessions are anonymous UUIDs)
- Docker, CI/CD pipelines, or production cloud deployment
- Model retraining, online learning, or automated data ingestion
- Counterfactual "what-if" simulations (cross-sectional data does not support intervention claims)
- General-purpose health chatbot (Module 5, if built, is a narrow result explainer only)
- Survival analysis or time-to-event modelling (BRFSS has no follow-up or time-to-event structure)
- External clinical validation (this is identified as the primary future work item)


---
---

## CHAPTER 2 — BACKGROUND AND LITERATURE SURVEY
### (Target: 8 pages. Paste each sub-section to Gemini separately.)

---

### 2.1 INTRODUCTION

**Prompt to Gemini:** "Write section 2.1 Introduction for Chapter 2 (1 page) of a project report on NeuroFlow AI. Briefly introduce the topics covered in this chapter: BRFSS dataset, existing ML stroke studies, reverse causation, SMOTE, SHAP, PSI, and their relevance to this project."

- Chapter 2 covers the theoretical foundations and prior work for every technique used in NeuroFlow AI.
- The chapter is structured to first establish the data source (BRFSS), then survey the existing literature on ML-based stroke classification (showing the reproducibility problem), then cover the specific techniques used to address the methodological gaps.
- Background topics: CDC BRFSS dataset structure and limitations, the leakage problem in cross-sectional health ML, causal reasoning and DAG-based feature selection, SMOTE and its limitations on categorical data, TreeSHAP for model explainability, Population Stability Index for production model monitoring.

---

### 2.2 CDC BRFSS DATASET OVERVIEW

**Prompt to Gemini:** "Write section 2.2 CDC BRFSS Dataset Overview (1 page) using the following structured facts."

| Property | Value |
|---|---|
| Full name | Behavioral Risk Factor Surveillance System |
| Run by | U.S. Centers for Disease Control and Prevention (CDC) |
| Method | Annual telephone survey (landline + cellular) |
| Coverage | All 50 US states + DC + US territories |
| Annual respondents | ~400,000–500,000 adults |
| Total years used | 2015, 2017, 2019 (train), 2021 (validate), 2023 (test) |
| Total respondents | ~2.17 million |
| Training rows | 1,305,790 |
| Training positive cases | 55,970 (4.29%) |
| Target variable | CVDSTRK3 — "Has a doctor ever told you that you had a stroke?" |
| Odd years only | Hypertension (high_bp) and cholesterol (high_chol) are BRFSS rotating core, asked by ALL states only in odd-numbered years |
| Key limitation | Self-reported data — requires a doctor's diagnosis to be recorded as positive |
| Key limitation | Cross-sectional — no follow-up, no temporal ordering between features and outcome |
| Key limitation | Survivorship — only living, non-institutionalized adults surveyed |

---

### 2.3 MACHINE LEARNING IN STROKE CLASSIFICATION — LITERATURE SURVEY

**Prompt to Gemini:** "Write section 2.3 Literature Survey on ML in Stroke Classification (2 pages). Survey existing approaches, report their claimed accuracy, identify their methodological weaknesses, and compare them to the leakage-free results in this project. Use academic language with citations as placeholders."

**Key talking points:**
- Multiple papers (2019–2022) using Kaggle-redistributed BRFSS subsets report ROC-AUC of 0.95–0.97 using Random Forest, XGBoost, LightGBM.
- These papers typically: (a) use a random 80/20 train-test split on pooled multi-year data (no temporal separation), (b) include features like `gen_health`, `phys_activity`, `phys_days`, `ment_days` that are strongly post-stroke without causal justification, (c) apply SMOTE to one-hot encoded features without checking the validity of generated rows.
- NeuroFlow's leakage-free temporal benchmark: ROC-AUC 0.827, PR-AUC 0.180. Consistent with independent leakage-free BRFSS benchmarks (~0.794 ROC-AUC reported by [CITE leakage-free paper]).
- Summary comparison table:

| Study Type | Reported ROC-AUC | Protocol |
|---|---|---|
| Typical Kaggle BRFSS study | ~0.95–0.97 | Random split, post-outcome features included |
| Leakage-free BRFSS benchmark | ~0.794 | Temporal split, post-outcome features removed |
| This project (Model A) | ~0.87 (val) | Temporal split, all 28 features |
| This project (Model B, served) | ~0.827 (test) | Temporal split, 21 features (reverse causation removed) |

---

### 2.4 REVERSE CAUSATION AND CAUSAL REASONING

**Prompt to Gemini:** "Write section 2.4 Reverse Causation and the Causal DAG (1.5 pages) using the following structured facts and the DAG structure."

- **The problem in one sentence:** A BMI recorded in 2023 cannot have caused a stroke reported in 2005. Cross-sectional data cannot establish temporal ordering.
- **The two types of features:**
  - Upstream (causes): features that plausibly pre-date and contribute to stroke risk — age, high_bp, diabetes, high_chol, smoker_status, bmi, etc.
  - Downstream (consequences): features that may reflect the state of someone who has had a stroke — gen_health (stroke survivors may rate their health lower), phys_activity (post-stroke disability reduces activity), phys_days (poor physical health days), ment_days (post-stroke depression), employment (stroke survivors may be unable to work), has_doctor (follow-up care), last_checkup (regular monitoring post-stroke).
- **The d-separation argument (Pearl, 2009):** For a screening model applied to people without stroke history, conditioning on a descendant of the outcome (D(S)) introduces spurious association without any causal pathway from that feature to S. The feature is predictive in-sample but inapplicable out-of-sample.
- **The assumed DAG:**
  ```
  Upstream: age, high_bp, diabetes, high_chol, smoker_status, bmi
      |
      v
  STROKE (S) — outcome
      |
      v
  Excluded descendants:
  gen_health, phys_activity, phys_days, ment_days, employment, has_doctor, last_checkup
  ```
- **Why domain knowledge, not structure learning:** DAG orientation is not identifiable from cross-sectional data without strong assumptions. Structure learning algorithms would produce an artifact of the estimator. All edge directions are assigned from clinical domain knowledge.
- **Measured cost:** Removing the 7 descendants (Model A → Model B) costs 0.0138 PR-AUC (7.9% relative). This is the measured contribution of reverse causation. Smaller than feared: age, hypertension, and cardiac history dominate the model.
- **Honest caveat:** Model B is not perfectly clean. `high_bp` and `high_chol` ask whether a doctor has told the respondent. Stroke survivors undergo thorough investigation afterward, so they are more likely to have been told. Model B reduces but does not eliminate reverse causation.

---

### 2.5 SMOTE AND CLASS IMBALANCE

**Prompt to Gemini:** "Write section 2.5 SMOTE and Class Imbalance (1 page) using the following structured facts."

- **SMOTE (Chawla et al., 2002):** Generates synthetic minority-class samples by interpolating between a sample and one of its k nearest neighbours in feature space.
- **The categorical data problem:** BRFSS features are primarily binary (yes/no) or categorical (one-hot encoded integer codes). Interpolation between two binary values (0 and 1) produces a fractional value (e.g., 0.43) that has no real-world meaning. "diabetes = 0.43" is not a valid clinical state.
- **Measurement in this study:**
  - 21% of binary feature cells in SMOTE-generated rows were fractional.
  - 18% of one-hot-encoded feature cells were fractional.
  - 100% of synthetic rows contained at least one physically impossible value.
- **PR-AUC comparison:**

| Method | PR-AUC (Val A) |
|---|---|
| Class weighting (used) | 0.1749 |
| SMOTE + class weighting | 0.1304 |
| SMOTE only | Lower |
| Loss from SMOTE | -0.0445 |

- **The SMOTE decision costs 12x what tripling data gains:** Adding two more training years (+0.0036 PR-AUC) vs. SMOTE loss (-0.0445 PR-AUC).
- **Alternative approaches evaluated:** Class weighting (selected — weights inversely proportional to class frequency), threshold adjustment (separate step after calibration), ADASYN (similar interpolation problem). Class weighting was retained as it imposes no invalid samples.

---

### 2.6 EXPLAINABILITY: SHAP AND TREESHAP

**Prompt to Gemini:** "Write section 2.6 SHAP Explainability (1 page) using the following facts. Include the SHAP formula."

- **SHAP (Lundberg & Lee, 2017):** Game-theoretic framework for explaining ML model predictions. Assigns each feature a contribution (Shapley value) to the model's output for a given instance.
- **Mathematical definition:**
  ```
  f(x) = phi_0 + sum(phi_j(x)), where phi_0 = E[f(X)]

  phi_j = sum over T ⊆ F\{j}:
          [ |T|! × (M - |T| - 1)! / M! ] × [ f_{T∪{j}}(x) - f_T(x) ]
  ```
  where phi_j is the Shapley value for feature j, T ranges over all subsets of features excluding j, M is total features.
- **Local accuracy property:** The sum of all Shapley values equals the difference between the model's prediction for this instance and its expected output. This makes the SHAP waterfall a true decomposition, not an approximation.
- **TreeSHAP:** Efficient algorithm for tree-based models (including XGBoost). Exact Shapley values in polynomial time.
- **What SHAP is NOT:** SHAP attributes the *model's output* to its inputs. It says nothing about causation in the world. A feature with large |phi_j| is one the model relies on. This is why the UI says "pushes score up" and never "increases your risk."
- **Implementation in NeuroFlow:**
  - TreeExplainer initialized at startup (one-time, from backend/model.py)
  - SHAP values computed per prediction call on the transformed feature matrix X
  - One-hot columns folded back to their source feature (e.g., "marital_2.0" → "marital")
  - Top-5 by absolute SHAP value returned in the API response
  - Displayed as diverging bar chart on the results page

---

### 2.7 POPULATION STABILITY INDEX (PSI) FOR MODEL MONITORING

**Prompt to Gemini:** "Write section 2.7 Population Stability Index (1 page) using the following facts and formula."

- **The monitoring problem:** After deployment, the distribution of incoming user inputs may drift away from the training data distribution. If users in the application have systematically different profiles from the BRFSS training population, the model's calibration and recall guarantees may no longer hold.
- **PSI definition:** For a feature binned into B bins, with E_b the expected (training) proportion and A_b the actual (production) proportion:
  ```
  PSI = sum_b (A_b - E_b) × ln(A_b / E_b)
  ```
  PSI is the symmetrised Kullback–Leibler divergence: D_KL(A||E) + D_KL(E||A). Non-negative. Zero only when distributions coincide.
- **Implementation conventions:**
  - B = 10 bins; edges = decile quantiles from training distribution
  - Binary features: 2 bins split at 0.5
  - Epsilon 1e-6 added to both proportions before log (prevents ln(0) when a bin is empty)
  - Minimum 30 assessments required before PSI is reported (prevents noise from small samples)
- **PSI bands:**

| PSI Value | Band | Interpretation |
|---|---|---|
| < 0.1 | Stable | No significant drift |
| 0.1 – 0.25 | Moderate | Monitor; potential drift |
| > 0.25 | Significant | Investigate; model may be unreliable |

- **Prediction drift:** PSI applied to the model's output (probability) distribution. The mean probability and flag rate are also compared to the expected flag rate from the test year (~36–39%).
- **Relevance in NeuroFlow:** The 2021 BRFSS methodology change (survey mode shift) causes expected covariate shift between training (2015–2019) and later years. This shift sits across the train/test boundary by design — it tests whether the model degrades under a known distribution shift.

---

### 2.8 SUMMARY OF LITERATURE SURVEY

**Prompt to Gemini:** "Write a half-page summary of the literature survey for Chapter 2, highlighting the key gaps that NeuroFlow AI addresses."

| Gap in Literature | NeuroFlow AI's Response |
|---|---|
| Published ROC-AUC ~0.96 inflated by reverse causation | Built Model A and B; measured 7.9% relative PR-AUC cost |
| SMOTE applied without categorical validity check | Measured invalid rows; showed −0.0445 PR-AUC harm |
| No data-volume ablation to separate SMOTE effect | Tripling data gains +0.0036; SMOTE loss 12x worse |
| No causal DAG to justify feature exclusion | Assumed DAG from domain knowledge; d-separation argument |
| No per-user explanation in public BRFSS screeners | SHAP top-5 displayed on results page |
| No drift monitoring in published BRFSS screeners | PSI dashboard for all 21 features + predictions |
| UI language risks misrepresenting screening as prediction | Binding UI copy rules; LLM output filter |


---
---

## CHAPTER 3 — SYSTEM DESIGN AND IMPLEMENTATION
### (Target: 10 pages. Each sub-section = 1–1.5 pages. Paste each to Gemini separately.)
### CODE INSTRUCTIONS: For each code block below, the EXACT FILE and LINE RANGE are given.
### Open the file in VS Code, select those lines, copy, and paste into your report.

---

### 3.1 SYSTEM ARCHITECTURE OVERVIEW

**Prompt to Gemini:** "Write section 3.1 System Architecture Overview (1 page) for a project report. Describe the three-tier web architecture and the data flow between components."

**Architecture — three tiers:**
```
[USER BROWSER]
  React + Vite SPA
  Hash-based routing (#drift for dashboard)
  Fetches schema at startup; all text in copy.js
       |
       | HTTP/JSON
       |
[BACKEND SERVER]
  FastAPI + Uvicorn (Python)
  6 REST endpoints
  Dynamic Pydantic validation from model_config.json
  SHAP inference on each request
  OpenRouter LLM call (async, optional)
       |
       | psycopg (v3)
       |
[DATABASE]
  PostgreSQL
  Single table: assessments
  JSONB columns for inputs and SHAP values
  All sessions anonymous
       |
       | joblib.load at startup
       |
[MODEL BUNDLE]
  models/stroke_model.joblib
  models/model_config.json
  (Generated by Google Colab training notebook — not in repo)
```

**Technology Stack Table:**

| Layer | Technology | Key Detail |
|---|---|---|
| ML Model | XGBoost 3.4.1 | Pinned — must match Colab training runtime |
| Preprocessing | scikit-learn 1.6.1 | Pinned — same reason |
| Calibration | IsotonicRegression (sklearn) | PAV algorithm |
| Explainability | SHAP TreeExplainer | Computed per request |
| Backend | FastAPI + Uvicorn | 6 REST endpoints |
| Validation | Pydantic v2 | Dynamic from model_config.json |
| Database | PostgreSQL + psycopg v3 | JSONB for inputs and SHAP |
| Frontend | React 18 + Vite | Hash-based routing |
| LLM | OpenRouter | Claude Haiku (primary), Gemini Flash (fallback) |
| Data source | CDC BRFSS | 2015, 2017, 2019, 2021, 2023 |

---

### 3.2 ML COMPONENT — MODEL TRAINING AND BUNDLE

**Prompt to Gemini:** "Write section 3.2 ML Component (1.5 pages) describing the model training pipeline, the two-model design, calibration, SHAP setup, and sanity testing. Use the following structured facts."

**Training pipeline (done in Google Colab, not in this repo):**
1. Load BRFSS annual files for 2015, 2017, 2019, 2021, 2023
2. Filter to odd years only; drop even years with structurally missing rotating core
3. Encode target variable CVDSTRK3: yes→1, no→0; drop refused/unknown
4. Feature engineering: compute BMI from height/weight; encode smoking, education, marital as integers
5. Remove 14 leakage features (post-outcome proxies, data-collection artifacts)
6. Split validation 2021 into Val A (model selection) and Val B (calibration + threshold)
7. Fit sklearn ColumnTransformer preprocessor on train set: StandardScaler for numeric, passthrough for binary, OneHotEncoder for categorical
8. Train XGBoost with class_weight='balanced' (no SMOTE)
9. Train isotonic regression calibrator on Val A raw scores
10. Select threshold on Val B calibrated probabilities to hit ~86% recall
11. Pack into bundle: {model_A: {...}, model_B: {...}, meta: {...}}
12. Export: stroke_model.joblib, model_config.json, sanity_input.csv, sanity_expected.npy

**Model bundle structure:**
```python
{
  "model_B": {
    "preprocessor",     # sklearn ColumnTransformer (fitted)
    "model",            # XGBoost XGBClassifier (fitted)
    "calibrator",       # IsotonicRegression (fitted)
    "threshold",        # float — calibrated probability cutoff
    "features",         # list[str] — 21 feature names in fitted order
    "transformed_names",# list[str] — 43 one-hot column names
    "test_metrics",     # dict — TP, FP, TN, FN from 2023 test year
    "task",             # "stroke_history_classification"
  },
  "model_A": {...},     # academic comparison only — NEVER SERVED
  "meta": {
    "train_years", "val_year", "test_year",
    "n_train", "n_test", "train_prevalence",
    "sklearn", "xgboost", "numpy",  # version pins
    "excluded_leakage",
    "suspect_features_removed_in_B",
  }
}
```

**Sanity verification (Module 0):**
- Load sanity_input.csv (200 test rows from 2023 BRFSS)
- Run inference pipeline on all 200 rows
- Compare to sanity_expected.npy (pre-computed expected probabilities)
- Max absolute difference must be < 1e-6
- Verifies that library versions match training runtime

**>> CODE FOR REPORT — Sanity verification script:**
```
FILE: backend/verify_model.py
COPY LINES: ALL (1–end, approximately 60 lines)
This shows: joblib loading, column reordering, transform, calibrate, compare to expected
```

**>> CODE FOR REPORT — Inference pipeline (THE most important code block):**
```
FILE: backend/model.py
COPY LINES: ALL (1–52)
This shows: bundle loading (singleton), FEATURES list, THRESHOLD, TreeExplainer setup,
            predict() function with all 4 steps, SHAP aggregation, top-5 selection
```

---

### 3.3 BACKEND — FASTAPI REST API

**Prompt to Gemini:** "Write section 3.3 Backend FastAPI REST API (1.5 pages) describing all 6 API endpoints, the dynamic schema design, and the request-response flow."

**API Endpoints Table:**

| Method | Endpoint | Request Body | Response | Purpose |
|---|---|---|---|---|
| GET | /health | — | {status, model_loaded, model_version} | Health check |
| GET | /api/v1/schema | — | {features, schema} | Form initialization |
| POST | /api/v1/predict | PatientInput (21 fields) | {id, probability, percent, flagged, threshold, contributions, disclaimer} | Main inference |
| POST | /api/v1/narrative | {contributions: [...]} | {narrative: str or null} | LLM sentence |
| GET | /api/v1/drift | — | Full PSI report | Drift dashboard |
| GET | /api/v1/assessments | ?limit=N | List of recent predictions | Assessment log |

**Dynamic schema design:**
- `schema.py` reads `models/model_config.json` at import time
- `create_model()` from Pydantic v2 generates `PatientInput` with field types and valid ranges from the config
- `ConfigDict(extra="forbid")` rejects any fields not in the 21 clinical inputs
- No ranges are hardcoded in Python — changing the model changes the API validation automatically

**Key design decisions:**
- Probability clamped to 0.99 in the response only (isotonic saturation edge case). The DB stores the raw calibrated value; the flag decision was made on the raw value.
- The disclaimer ("Screening estimate from self-reported survey data, not a diagnosis.") is appended to every /predict response — it cannot be omitted.
- Narrative endpoint returns null on any failure — the results page must not depend on the LLM.

**>> CODE FOR REPORT — FastAPI routes:**
```
FILE: backend/main.py
COPY LINES: 1–95 (entire file)
This shows: all route definitions, Contribution model, NarrativeRequest model,
            probability ceiling, disclaimer, error handling
```

**>> CODE FOR REPORT — Dynamic Pydantic schema:**
```
FILE: backend/schema.py
COPY LINES: 1–28 (entire file)
This shows: CONFIG loading from JSON, SCHEMA filtering to 21 Model B features,
            dynamic create_model() call with types and ranges
```

---

### 3.4 DATABASE DESIGN — POSTGRESQL

**Prompt to Gemini:** "Write section 3.4 Database Design (half a page) describing the PostgreSQL schema and data access layer."

**Table: assessments**

| Column | Type | Description |
|---|---|---|
| id | UUID (primary key) | Anonymous session identifier |
| created_at | TIMESTAMPTZ | Auto-set at insert |
| inputs | JSONB | All 21 clinical fields as JSON object |
| probability | FLOAT | Calibrated model probability (raw, pre-clamp) |
| flagged | BOOLEAN | Whether probability >= threshold |
| threshold | FLOAT | The threshold at time of prediction |
| model_version | TEXT | Always "model_B" for served predictions |
| shap_top | JSONB | Top-5 SHAP contributions as JSON array |
| source | TEXT | "form" (default) or "demo" (seeded data) |

**Design decisions:**
- JSONB for inputs and shap_top: avoids 21+ separate columns; allows adding new features without schema migration
- No patient identifiers ever stored — not name, not IP, not session cookie
- No ORM used — plain SQL via psycopg v3 for simplicity and auditability

**>> CODE FOR REPORT — Database access layer:**
```
FILE: backend/db.py
COPY LINES: 1–49 (entire file)
This shows: connect(), insert() with JSONB, recent() for assessments log,
            for_drift() query (model_B only), count()
```

**SQL schema (from backend/sql/ directory):**
```
FILE: backend/sql/ (check this directory for .sql files)
COPY: The CREATE TABLE statement for the assessments table
```

---

### 3.5 FRONTEND — REACT + VITE WEB APPLICATION

**Prompt to Gemini:** "Write section 3.5 Frontend (2 pages) describing the React application structure, the 3-step intake form, the results page, and the drift dashboard."

**Application structure:**
- Single Page Application, hash-based routing:
  - Default route: Form → Result flow
  - `#drift`: PSI dashboard
- Schema fetched at startup from `GET /api/v1/schema`; form fields and valid ranges come from the API, not hardcoded in frontend
- All user-visible text is in `frontend/src/copy.js` — a single source of truth (no strings scattered in components)

**3-Step Intake Form (Form.jsx):**
- Step 1 (9 fields): Demographics — age (number input), sex (radio), height_cm (number), weight_kg (number), urban_rural (radio), education (radio), marital (radio), own_home (radio), veteran (radio)
- Step 2 (8 fields): Medical history — high_bp, high_chol, diabetes, chd_or_mi, kidney_disease, copd, depression, arthritis (all radio yes/no)
- Step 3 (5 fields): Lifestyle — smoker_status (4-option radio), heavy_drink (radio), binge_drink (radio), has_insurance (radio), cost_barrier (radio)
- BMI computed client-side after Step 1 validation: `bmi = weightKg / (heightCm/100)^2`
- BMI is never shown to the user; it is computed and included in the API payload silently
- Validation: each step validates before advancing. Errors are field-specific (e.g., "Age must be a whole number between 18 and 80."). No generic "invalid input" messages.

**Results page (Result.jsx):**
- Score: displayed as "This profile scores 8.4% on our screening model." (exact phrasing required by UI_COPY_RULES.md)
- Flag: "Flagged for follow-up" or "Not flagged" with one explanatory line
- Score bar: neutral single colour, no red/green/amber, threshold marker shown explicitly
- SHAP bars: diverging bar chart, each bar labeled "[feature name] — pushes score up/down"
- LLM narrative: fetched asynchronously after page renders; if null/error → bars shown alone
- Causal DAG: inline SVG below SHAP bars

**Drift dashboard (Drift.jsx):**
- Fetched from `GET /api/v1/drift`
- Horizontal bar per feature, scaled to max PSI in the report
- Threshold lines at PSI 0.1 and 0.25 always visible on all bars
- Summary: flag rate, expected flag rate, mean probability

**>> CODE FOR REPORT — React App root:**
```
FILE: frontend/src/App.jsx
COPY LINES: 1–45 (entire file)
This shows: schema fetch at startup, hash-based routing, conditional rendering of Form/Result/Drift
```

**>> CODE FOR REPORT — 3-Step Form component:**
```
FILE: frontend/src/Form.jsx
COPY LINES: 1–44 (STEPS array + BMI bounds + validateStep function)
Then also: COPY LINES: 105–182 (Form component — handleSubmit, render with Rail)
This shows: step structure, BMI client-side computation, field validation, multi-step navigation
```

**>> CODE FOR REPORT — Results page:**
```
FILE: frontend/src/Result.jsx
COPY LINES: 1–60 (ScoreBar and ShapBars components)
Then also: COPY LINES: 62–119 (Result component — narrative, flag, causal DAG)
This shows: score bar design, SHAP diverging bars, async narrative, reset button
```

**>> CODE FOR REPORT — API calls (frontend):**
```
FILE: frontend/src/api.js
COPY LINES: 1–end (entire file, approx 60 lines)
This shows: getSchema, predict (with buildPayload), getNarrative, getDrift, computeBmi
```

---

### 3.6 SHAP EXPLAINABILITY MODULE

**Prompt to Gemini:** "Write section 3.6 SHAP Explainability (half a page) describing how SHAP is integrated into the inference pipeline and displayed in the UI."

- TreeExplainer initialized once at startup from the XGBoost model object (singleton in model.py)
- On each /predict call: SHAP values computed on the 43-column transformed feature matrix X
- One-hot columns folded back to source: "marital_2.0" → "marital" (aggregated by summing SHAP values)
- Top-5 features by |SHAP| returned in the API response as: {feature, value, shap, direction}
- UI: each feature displayed as a horizontal bar with direction label — no colour carries meaning (same colour for up and down — direction is in the text only)
- LLM narrative call: top-5 contributions passed to /api/v1/narrative; LLM writes 1–2 comparative sentences

**>> CODE FOR REPORT — SHAP in model.py:**
```
FILE: backend/model.py
COPY LINES: 21–51 (from "_EXPLAINER = shap.TreeExplainer..." to end of predict())
Specifically shows: explainer setup, one-hot fold-back logic, top-5 selection
```

---

### 3.7 LLM NARRATIVE MODULE (GUARDRAILED)

**Prompt to Gemini:** "Write section 3.7 LLM Narrative Module (half a page) describing the system prompt, the banned-substring filter, and the fallback strategy."

**Design:**
- Calls OpenRouter API with model priority: Claude Haiku first, Gemini Flash if time budget remains
- Total time budget: 5 seconds. If budget exhausted → return None
- System prompt enforces: no causal verbs, no future-risk language, no medical advice, comparative framing only, max 2 sentences
- User prompt: list of top-5 SHAP contributions as: "feature_name: pushes score up/down"
- Post-generation filter: 30+ banned substrings. On any hit → discard and return None
- Frontend: narrative rendered only if not null; no placeholder, no apology, no loading spinner that blocks the page

**>> CODE FOR REPORT — Narrative module:**
```
FILE: backend/narrative.py
COPY LINES: 1–87 (entire file)
Specifically shows: SYSTEM_PROMPT, BANNED list, passes() filter, _call() HTTP request, generate() orchestration
```

---

### 3.8 DRIFT MONITORING MODULE (PSI)

**Prompt to Gemini:** "Write section 3.8 Drift Monitoring (half a page) describing the PSI implementation."

**>> CODE FOR REPORT — Drift module:**
```
FILE: backend/drift.py
COPY LINES: 1–59 (entire file)
This shows: REFERENCE bins loading from model_config.json, bin_props(), psi(), band(), report()
```

---

### 3.9 INPUT AND OUTPUT

**Prompt to Gemini:** "Write section 3.9 Input and Output (1.5 pages) showing all 21 input features and the full API response format."

#### Input — 21 Clinical Features (Model B) — full table for the report:

| Tier | Field | Type | Valid Range | Form Question (exact wording) |
|---|---|---|---|---|
| 1 | age | int | 18–80 | What is your age? |
| 1 | high_bp | 0/1 | binary | Has a doctor ever told you that you have high blood pressure? |
| 1 | chd_or_mi | 0/1 | binary | Has a doctor ever told you that you had a heart attack or coronary heart disease? |
| 1 | diabetes | 0/1 | binary | Has a doctor ever told you that you have diabetes? |
| 1 | kidney_disease | 0/1 | binary | Has a doctor ever told you that you have kidney disease? |
| 2 | bmi | float | 12–70 | Computed from height (cm) and weight (kg) — not shown to user |
| 2 | high_chol | 0/1 | binary | Has a doctor ever told you that your blood cholesterol is high? |
| 2 | smoker_status | int | 1–4 | Which best describes your smoking? |
| 2 | copd | 0/1 | binary | Has a doctor ever told you that you have COPD? |
| 2 | depression | 0/1 | binary | Has a doctor ever told you that you have a depressive disorder? |
| 2 | arthritis | 0/1 | binary | Has a doctor ever told you that you have some form of arthritis? |
| 2 | heavy_drink | 0/1 | binary | Do you average more than 14 drinks/week (men) or 7 (women)? |
| 2 | binge_drink | 0/1 | binary | Have you had 5+ drinks on one occasion in the past 30 days? |
| 3 | is_female | 0/1 | binary | Sex (0=male, 1=female) |
| 3 | education | int | 1–4 | Highest level of education (1=no HS, 2=HS grad, 3=some college, 4=college grad) |
| 3 | marital | int | 1–6 | Marital status (1=married … 6=couple) |
| 3 | own_home | 0/1 | binary | Do you own your home? |
| 3 | veteran | 0/1 | binary | Have you ever served on active duty in the US armed forces? |
| 3 | urban_rural | 0/1 | binary | Urban (1) or Rural (0) area? |
| 3 | has_insurance | 0/1 | binary | Do you have any kind of health care coverage? |
| 3 | cost_barrier | 0/1 | binary | Was there a time you could not see a doctor due to cost? |

#### Sample JSON Request (POST /api/v1/predict):
```json
{
  "age": 67, "high_bp": 1, "chd_or_mi": 0, "diabetes": 1,
  "kidney_disease": 0, "bmi": 28.4, "high_chol": 1,
  "smoker_status": 3, "copd": 0, "depression": 0,
  "arthritis": 1, "heavy_drink": 0, "binge_drink": 0,
  "is_female": 0, "education": 3, "marital": 1,
  "own_home": 1, "veteran": 0, "urban_rural": 1,
  "has_insurance": 1, "cost_barrier": 0
}
```

#### Sample JSON Response:
```json
{
  "id": "3a7f1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "probability": 0.084,
  "percent": "8.4%",
  "flagged": true,
  "threshold": 0.033,
  "model_version": "model_B",
  "contributions": [
    {"feature": "age", "value": 67, "shap": 0.412, "direction": "up"},
    {"feature": "high_bp", "value": 1, "shap": 0.287, "direction": "up"},
    {"feature": "chd_or_mi", "value": 0, "shap": -0.103, "direction": "down"},
    {"feature": "diabetes", "value": 1, "shap": 0.089, "direction": "up"},
    {"feature": "is_female", "value": 0, "shap": -0.054, "direction": "down"}
  ],
  "disclaimer": "Screening estimate from self-reported survey data, not a diagnosis."
}
```

#### Sample PSI Drift Report (GET /api/v1/drift):
```json
{
  "n_assessments": 150,
  "sufficient": true,
  "window": {"from": "2026-10-01T00:00:00Z", "to": "2026-10-14T00:00:00Z"},
  "features": [
    {"feature": "age", "psi": 0.032, "band": "stable"},
    {"feature": "high_bp", "psi": 0.114, "band": "moderate"},
    {"feature": "diabetes", "psi": 0.011, "band": "stable"}
  ],
  "prediction_drift": {
    "mean_probability": 0.072,
    "flag_rate": 0.341,
    "expected_flag_rate": 0.369
  }
}
```

