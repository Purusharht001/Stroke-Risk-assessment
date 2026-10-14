# ACADEMIC DOSSIER — NeuroFlow AI

Defence document. Written for a human reader. Agents read §2 (Module 4) or §3
(Module 3) only, never the whole file.

---

## 1. Abstract

Published machine-learning models for stroke on survey data routinely report
ROC-AUC near 0.96. We show that such figures are largely attributable to two
methodological shortcuts, and report what remains when both are removed.

We build a classifier of **self-reported lifetime stroke history** on 2.17 million
CDC BRFSS respondents across five odd-numbered survey years (2015–2023). The
design is temporal: three years train, one validates, one is held out and scored
once. Odd years only, because hypertension and cholesterol are BRFSS *rotating
core* and are structurally absent in even years — not missing at random, and so
not imputable.

The outcome variable, `CVDSTRK3`, asks whether a respondent has ever been *told* by
a health professional that they had a stroke. This is lifetime prevalence, not
incidence. The data is cross-sectional: there is no follow-up, no stroke onset
date, and no temporal ordering between features and outcome. We therefore frame the
system as **stroke-history classification and risk screening**, never as prediction.

Under a leakage-free protocol, test ROC-AUC is 0.827 and PR-AUC 0.180 — consistent
with published leakage-free BRFSS benchmarks (~0.794) and far below the ~0.96
reported by studies retaining post-outcome variables.

Four measurements follow:

1. **Reverse causation costs 7.9% relative PR-AUC.** Removing seven features that
   may reflect post-stroke state (Model A → Model B) drops PR-AUC from 0.1749 to
   0.1611. Present and measurable, but smaller than the methodological concern
   implies: age, hypertension, and cardiac history dominate.
2. **SMOTE on one-hot-encoded survey data is actively harmful.** PR-AUC falls from
   0.1749 (class weighting) to 0.1304. Every synthetic row contains at least one
   physically impossible value — 21% of binary cells and 18% of one-hot cells come
   out fractional, producing "patients" with `diabetes = 0.33`.
3. **More data buys little.** A single survey year reaches 97.9% of full-data
   performance. Tripling training data gains +0.0036 PR-AUC. **The SMOTE decision
   costs twelve times what tripling the data gains.**
4. **Equalising recall across age bands is not worth its price.** Per-band
   thresholds cut the recall spread from 0.428 to 0.029 but caught two additional
   cases while flagging 31,785 more people — ~15,900 extra flags per case. The
   single global threshold was retained, with the cost documented.

---

## 2. Population Stability Index

For a feature binned into $B$ bins, with $E_b$ the expected (training) proportion
and $A_b$ the actual (production) proportion:

$$\mathrm{PSI} = \sum_{b=1}^{B} (A_b - E_b) \ln\!\left(\frac{A_b}{E_b}\right)$$

PSI is the symmetrised Kullback–Leibler divergence — the sum of
$D_{KL}(A\|E) + D_{KL}(E\|A)$ — which is why it is non-negative and zero only when
the distributions coincide.

**Implementation conventions.** $B = 10$, edges from training-distribution deciles;
binary features use two bins split at 0.5; every proportion has $10^{-6}$ added
before the log so an empty bin cannot yield $\ln 0$.

**Bands.** $< 0.1$ stable · $0.1$–$0.25$ moderate · $> 0.25$ significant.

**Prediction drift.** The same statistic applied to the model's output
distribution. Ground truth is unavailable for years, so both are proxy signals:
covariate shift in the inputs, and distributional shift in the outputs.

---

## 3. The causal DAG and the d-separation argument

*(Module 3 reads this section for the DAG structure.)*

### 3.1 The problem

The outcome is lifetime history. Features are measured *today*. A respondent's BMI
in 2023 cannot have preceded a stroke in 2005. So for any feature $X$, the causal
arrow may run either way:

$$X \rightarrow S \qquad\text{or}\qquad S \rightarrow X$$

Including a feature of the second kind inflates apparent performance while
destroying applicability: a screening tool is applied to people who have *not* had
a stroke, and in that population the post-stroke state does not exist.

### 3.2 The assumed DAG

```
        ┌──────────────── upstream risk factors ────────────────┐
        age    high_bp    diabetes    high_chol    smoker    bmi
          │       │          │            │          │        │
          └───────┴──────────┴────┬───────┴──────────┴────────┘
                                  ▼
                        ┌──────────────────┐
                        │  STROKE (S)      │   ← the outcome
                        └────────┬─────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼        ▼        ▼      ▼      ▼        ▼        ▼
  gen_health  phys_   phys_   ment_  employ-  has_    last_
              activity days    days   ment    doctor  checkup
        └──────────── descendants of S — EXCLUDED ──────────┘
```

Direction is assigned from domain knowledge, not learned from data. Edge
orientation is not identifiable from cross-sectional data without strong
assumptions, so **structure learning was explicitly rejected**; a learned DAG here
would be an artifact of the estimator.

### 3.3 The d-separation argument

Let $\mathcal{D}(S)$ be the set of descendants of $S$. For a screening model we
want features $X$ such that any association between $X$ and $S$ arises through
directed paths $X \rightarrow \cdots \rightarrow S$.

For $X \in \mathcal{D}(S)$ the only path is $S \rightarrow \cdots \rightarrow X$.
Conditioning on such an $X$ — which is what a classifier does when it splits on it
— induces association without any causal contribution to $S$. The feature is
predictive in-sample and inapplicable out-of-sample.

Model B therefore excludes $\mathcal{D}(S)$, giving 21 features from 28.

### 3.4 What the exclusion cost

| | Model A | Model B |
|---|---|---|
| Features | 28 | 21 |
| Val A PR-AUC | 0.1749 | 0.1611 |
| Drop | — | 0.0138 (7.9% relative) |

**7.9% is the measured contribution of reverse causation.** Smaller than the
concern suggests, which is itself the finding: the model's skill rests mainly on
temporally plausible risk factors.

### 3.5 Honest residual

Model B is not perfectly clean. `high_bp` and `high_chol` ask whether a doctor ever
*told* the respondent — and stroke survivors are investigated thoroughly afterward,
so they are more likely to have been told. Model B **reduces but does not
eliminate** reverse causation. Claiming otherwise would overstate the result.

---

## 4. SHAP local accuracy

For model $f$ and instance $x$, TreeSHAP decomposes the output additively:

$$f(x) = \phi_0 + \sum_{j=1}^{M} \phi_j(x), \qquad \phi_0 = \mathbb{E}[f(X)]$$

with each $\phi_j$ the Shapley value of feature $j$:

$$\phi_j = \sum_{T \subseteq F \setminus \{j\}} \frac{|T|!\,(M - |T| - 1)!}{M!}\left[f_{T \cup \{j\}}(x) - f_T(x)\right]$$

**Local accuracy** — the attributions sum exactly to the prediction — is what makes
the waterfall on the results page a decomposition rather than an illustration.

**What SHAP is not.** It attributes the *model's* output to its inputs. It says
nothing about causation in the world. A feature with large $|\phi_j|$ is one the
model leans on, which is why the UI says *"pushes score up"* and never *"increases
your risk"*.

---

## 5. Ascertainment bias

`CVDSTRK3` requires having been *told*. The label is therefore
$S \land \text{diagnosed}$, not $S$. Undiagnosed strokes are recorded as negatives,
concentrated among people with less healthcare access.

Evidence, under-65s only:

| Stratum | Reported prevalence | Model recall |
|---|---|---|
| Insured | 2.40% | 0.726 |
| Uninsured | 2.05% | 0.602 |

Uninsured respondents appear *healthier* — the opposite of what their risk profiles
predict. The marginal insured/uninsured recall gap is 0.222; within age bands it
falls to 0.124 (<65) and 0.032 (65+), so roughly half is age confounding via
Medicare eligibility.

**An ablation showed the bias is label-level, not feature-level.** Removing the four
healthcare-access features changed test PR-AUC by −0.43% overall, and bootstrap 95%
CIs for the subgroup differences included zero in both strata (insured
[−0.0034, +0.0005]; uninsured [−0.0108, +0.0043]). The access features contribute
negligibly to discrimination; the disparity originates in the outcome definition,
which no modelling choice available here can repair.

Testing it properly requires clinical ascertainment — e.g. NHANES, which examines
participants rather than only asking them.

---

## 6. Limitations

1. **Lifetime prevalence, not incidence.** No temporal ordering between features
   and outcome.
2. **Reverse causation**, quantified at 7.9% and reduced but not eliminated in
   Model B.
3. **Ascertainment bias**, shown above to be label-level.
4. **Survivorship bias.** Living, non-institutionalised adults only; fatal strokes
   absent, severe survivors under-represented.
5. **No clinical measurements.** No atrial fibrillation, no measured BP, no labs —
   several Framingham Stroke Risk Profile components cannot be captured.
6. **Methodology shifts across years.** Questionnaire and sampling-mode changes at
   2021, quantified by PSI; the break sits across the train/test boundary by design.
7. **Class-imbalance trade-off**, stated as a chosen operating point: ~86% recall,
   ~9% precision, ~36% of the population flagged.
8. **SMOTE with categorical features**, quantified rather than asserted.
9. **Subgroup recall disparity**, measured and priced at ~15,900 flags per case.
10. **Validation reuse**, mitigated by splitting 2021 into Val A and Val B.
11. **Survey weights unused** — the objective is individual-level classification,
    not population prevalence estimation. No figure here is a national estimate.
12. **External clinical validation remains future work.** Temporal validation across
    five survey years is a real strength but does not establish clinical
    transportability.

---

## 7. Contribution summary

| Finding | Measured |
|---|---|
| Honest leakage-free performance | ROC-AUC 0.827, PR-AUC 0.180 |
| Reverse causation | 7.9% relative PR-AUC |
| SMOTE harm on encoded survey data | −0.0445 PR-AUC; 100% of synthetic rows invalid |
| Data-volume return | +0.0036 for 3× data; one year = 97.9% |
| Fairness intervention cost | ~15,900 extra flags per additional case |
| Ascertainment bias locus | Label-level; feature ablation null with CIs |

The model itself is unremarkable. The measurements are the contribution: they show
*why* published models report 0.96, and what each shortcut costs.
