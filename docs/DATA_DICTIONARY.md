# DATA_DICTIONARY — the 21 Model B features

Authoritative list of every field the API accepts and the form collects.

**Canonical source of ranges:** `models/model_config.json` → `schema`. This file is
the human-readable companion; where they disagree, the JSON wins and you should
fix this file.

---

## Ordering matters

The preprocessor was fitted on a specific column order. Always reorder before
transforming:

```python
row = pd.DataFrame([payload])[bundle["model_B"]["features"]]
```

Passing columns in a different order produces wrong predictions with **no error
raised**. This is the single most likely silent bug in the whole application.

---

## Tier 1 — dominant predictors (required)

| Field | Type | Valid | Form question |
|---|---|---|---|
| `age` | int | 18–80 | What is your age? |
| `high_bp` | 0/1 | — | Has a doctor ever told you that you have high blood pressure? |
| `chd_or_mi` | 0/1 | — | Has a doctor ever told you that you had a heart attack or coronary heart disease? |
| `diabetes` | 0/1 | — | Has a doctor ever told you that you have diabetes? |
| `kidney_disease` | 0/1 | — | Has a doctor ever told you that you have kidney disease? |

## Tier 2 — solid contributors

| Field | Type | Valid | Form question |
|---|---|---|---|
| `bmi` | float | 12–70 | *Computed — see below. Never asked directly.* |
| `high_chol` | 0/1 | — | Has a doctor ever told you that your blood cholesterol is high? |
| `smoker_status` | int | 1–4 | Which best describes your smoking? |
| `copd` | 0/1 | — | Has a doctor ever told you that you have COPD, emphysema, or chronic bronchitis? |
| `depression` | 0/1 | — | Has a doctor ever told you that you have a depressive disorder? |
| `arthritis` | 0/1 | — | Has a doctor ever told you that you have some form of arthritis? |
| `heavy_drink` | 0/1 | — | Do you average more than 14 drinks per week (men) or 7 (women)? |
| `binge_drink` | 0/1 | — | In the past 30 days, have you had 5+ drinks (men) or 4+ (women) on one occasion? |

## Tier 3 — demographic and access baseline

| Field | Type | Valid | Form question |
|---|---|---|---|
| `is_female` | 0/1 | — | Sex |
| `education` | int | 1–4 | Highest level of education completed |
| `marital` | int | 1–6 | Marital status |
| `own_home` | 0/1 | — | Do you own your home? |
| `veteran` | 0/1 | — | Have you ever served on active duty in the US armed forces? |
| `urban_rural` | 0/1 | — | Do you live in an urban or rural area? |
| `has_insurance` | 0/1 | — | Do you have any kind of health care coverage? |
| `cost_barrier` | 0/1 | — | In the past 12 months, was there a time you needed to see a doctor but could not because of cost? |

---

## Categorical codes — submit integers, never strings

### `smoker_status`
| Code | Label |
|---|---|
| 1 | I smoke every day |
| 2 | I smoke some days |
| 3 | I used to smoke, but not now |
| 4 | I have never smoked |

### `education`
| Code | Label |
|---|---|
| 1 | Did not graduate high school |
| 2 | High school graduate |
| 3 | Some college or technical school |
| 4 | College graduate |

### `marital`
| Code | Label |
|---|---|
| 1 | Married |
| 2 | Divorced |
| 3 | Widowed |
| 4 | Separated |
| 5 | Never married |
| 6 | Member of an unmarried couple |

### Binary fields
`0` = No, `1` = Yes — except:
- `is_female`: `0` = male, `1` = female
- `urban_rural`: `0` = rural, `1` = urban
- `own_home`: `0` = rent or other, `1` = own

`marital` is one-hot encoded inside the preprocessor. `smoker_status` and
`education` are too. Sending the wrong integer silently shifts the prediction.

---

## BMI — computed, never asked

Collect **weight in kg** and **height in cm** on the form. Compute client-side:

```js
const bmi = weightKg / Math.pow(heightCm / 100, 2);
```

Validate the result into 12–70 before submitting. If it falls outside, show an
inline error on the height/weight fields — not on a BMI field, which the user
never sees.

Suggested input bounds: weight 25–300 kg, height 100–250 cm.

---

## Question wording is not cosmetic

Every clinical field must be phrased **"Has a doctor ever told you..."**.

The model was trained on BRFSS, where respondents were asked exactly that. A person
who answers "do you have high blood pressure?" is answering a different question —
they may have it undiagnosed, or be unsure. That shifts the input distribution away
from what the calibrator was fitted on, and the probability the app displays stops
meaning what it says.

This is a correctness requirement, not a style preference.

---

## Fields NOT in Model B

Seven features exist in Model A and are deliberately absent here, because each may
reflect the *consequences* of a stroke rather than prior risk:

`gen_health` · `phys_activity` · `phys_days` · `ment_days` · `employment` ·
`has_doctor` · `last_checkup`

Do not add them to the form, the schema, or the API. If a future session is tempted
to "improve accuracy" by including them, that reverses the project's central
methodological decision. See `docs/ACADEMIC_DOSSIER.md` §3 for the d-separation
argument, and log any such change in `logs/AUDIT_LOG.md`.
