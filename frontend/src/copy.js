// Every user-facing string lives here so the banned-copy grep has one file to audit.
// Rules: docs/UI_COPY_RULES.md. Clinical question wording is copied verbatim from
// docs/DATA_DICTIONARY.md — it must match the BRFSS wording the model was trained on.

export const COPY = {
  appTitle: 'NeuroFlow',
  subtitle: 'Stroke-history screening questionnaire',
  footer: 'Screening estimate from self-reported survey data, not a diagnosis.',
  // Static public-health emergency notice (user request, AUDIT_LOG). Not model output.
  befast: {
    title: 'Stroke is an emergency. Call 112 immediately if these signs are present:',
    signs: [
      ['B', 'Balance Loss'],
      ['E', 'Eye (Vision) Changes'],
      ['F', 'Face Drooping'],
      ['A', 'Arm Weakness'],
      ['S', 'Speech Difficulty'],
      ['T', 'Time to call 112'],
    ],
  },
  steps: ['About you', 'Medical history', 'Lifestyle & access'],
  stepOf: (n, total) => `Step ${n} of ${total}`,
  back: 'Back',
  next: 'Next',
  submit: 'See screening result',
  submitting: 'Scoring…',
  startOver: 'Start a new screening',
  loading: 'Loading…',
  modelUnavailable: 'The screening model is not available right now. Please try again shortly.',
  required: (label) => `Please answer: ${label}.`,
  outOfRange: (label, min, max, unit) =>
    `${label} must be between ${min} and ${max}${unit ? ` ${unit}` : ''}.`,
  wholeNumber: (label, min, max) => `${label} must be a whole number between ${min} and ${max}.`,
  bmiOutOfRange: 'Please check the height and weight entered.',
  // Left-rail notes, one paragraph per item. Checked against docs/UI_COPY_RULES.md (AUDIT_LOG).
  rail: {
    form: [
      'Twenty-one questions, about three minutes. Answers are stored without any name or identifier.',
      'Answer as a doctor has told you — not as you suspect. The model was trained on exactly that phrasing.',
    ],
    result: [
      "This model was trained on 2.17 million survey responses to the question 'has a doctor ever told you that you had a stroke?'",
      'It describes the past. It cannot see forward in time.',
    ],
  },
  result: {
    score: (percent) => `This profile scores ${percent} on our screening model.`,
    flagged: 'Flagged for follow-up',
    notFlagged: 'Not flagged',
    // Both sentences are required (docs/UI_COPY_RULES.md): precision at threshold is ~9%.
    flagNote: (threshold) =>
      `Profiles above ${threshold} are flagged so that roughly 86% of stroke-history cases are captured. Most flagged profiles do not have a stroke history.`,
    thresholdMark: (threshold) => `Follow-up threshold ${threshold}`,
    scoreBarLabel: (percent, threshold) =>
      `Score ${percent} on a scale with the follow-up threshold at ${threshold}`,
    shapHeading: 'What distinguishes this profile',
    shapUp: 'pushes score up',
    shapDown: 'pushes score down',
    shapNote: 'Attribution within the model, not cause and effect.',
  },
  drift: {
    nav: 'Drift dashboard',
    back: 'Back to screening',
    heading: 'Input drift (Population Stability Index)',
    error: 'The drift report is not available right now.',
    count: (n, from, to) => `${n} stored assessments, ${from} to ${to}.`,
    tooFew: (n, min) =>
      `Only ${n} assessments are stored. PSI needs at least ${min} to mean anything, so no values are shown yet.`,
    summary: (s, m, k) => `${s} features stable, ${m} moderate, ${k} significant`,
    smallSample:
      'With few stored assessments, an uncommon answer that nobody has given yet leaves its bin empty, and an empty bin alone adds roughly 0.8 PSI for a 7% category. Small samples therefore overstate drift.',
    bands: { stable: 'Stable (< 0.1)', moderate: 'Moderate (0.1–0.25)', significant: 'Significant (> 0.25)' },
    barLabel: (label, psi, band) => `${label}: PSI ${psi}, ${band}`,
    predHeading: 'Prediction drift',
    flagRate: 'Live flag rate',
    expectedFlagRate: 'Expected flag rate (2023 held-out year)',
    meanProb: 'Mean screening score',
    reference: (source) =>
      `Reference: training-set decile bins (${source}), exported from the training notebook. Exact, not approximate.`,
    approximate:
      'Approximate reference: built from per-feature min, max and median, not from the training data. Treat these PSI values as indicative only.',
  },
  dag: {
    heading: 'Why seven survey questions are not used',
    upstream: 'Upstream factors',
    outcome: 'Stroke history',
    excluded: 'EXCLUDED — descendants of the outcome',
    title: 'Assumed causal diagram: six upstream factors point to stroke history, which points to seven excluded answers',
    caption:
      'The seven greyed nodes are descendants of the outcome. Conditioning on a descendant of the outcome induces association without causation, so they are excluded from the screening model. Removing them costs 7.9% relative PR-AUC — the measured contribution of reverse causation.',
    upstreamNodes: ['Age', 'High blood pressure', 'Diabetes', 'High cholesterol', 'Smoking', 'BMI'],
    excludedNodes: [
      'General health',
      'Physical activity',
      'Physical-health days',
      'Mental-health days',
      'Employment',
      'Has a doctor',
      'Last checkup',
    ],
  },
}

// Display labels for features that have no form field of their own.
export const EXTRA_LABELS = { bmi: 'BMI' }

const YES_NO = [
  { value: 1, label: 'Yes' },
  { value: 0, label: 'No' },
]

// kind: 'number' → numeric input; 'choice' → radio group whose value is the integer code.
export const FIELDS = {
  // Step 1 — About you
  age: { label: 'Age', question: 'What is your age?', kind: 'number', unit: 'years' },
  is_female: {
    label: 'Sex',
    question: 'Sex',
    kind: 'choice',
    options: [
      { value: 0, label: 'Male' },
      { value: 1, label: 'Female' },
    ],
  },
  height_cm: { label: 'Height', question: 'What is your height?', kind: 'number', unit: 'cm' },
  weight_kg: { label: 'Weight', question: 'What is your weight?', kind: 'number', unit: 'kg' },
  urban_rural: {
    label: 'Urban or rural area',
    question: 'Do you live in an urban or rural area?',
    kind: 'choice',
    options: [
      { value: 1, label: 'Urban' },
      { value: 0, label: 'Rural' },
    ],
  },
  education: {
    label: 'Education',
    question: 'Highest level of education completed',
    kind: 'choice',
    options: [
      { value: 1, label: 'Did not graduate high school' },
      { value: 2, label: 'High school graduate' },
      { value: 3, label: 'Some college or technical school' },
      { value: 4, label: 'College graduate' },
    ],
  },
  marital: {
    label: 'Marital status',
    question: 'Marital status',
    kind: 'choice',
    options: [
      { value: 1, label: 'Married' },
      { value: 2, label: 'Divorced' },
      { value: 3, label: 'Widowed' },
      { value: 4, label: 'Separated' },
      { value: 5, label: 'Never married' },
      { value: 6, label: 'Member of an unmarried couple' },
    ],
  },
  own_home: {
    label: 'Home ownership',
    question: 'Do you own your home?',
    kind: 'choice',
    options: [
      { value: 1, label: 'Own' },
      { value: 0, label: 'Rent or other' },
    ],
  },
  veteran: {
    label: 'Active duty service',
    question: 'Have you ever served on active duty in the armed forces?',
    kind: 'choice',
    options: YES_NO,
  },

  // Step 2 — Medical history (clinical: must start "Has a doctor ever told you")
  high_bp: {
    label: 'High blood pressure',
    question: 'Has a doctor ever told you that you have high blood pressure?',
    kind: 'choice',
    options: YES_NO,
  },
  high_chol: {
    label: 'High cholesterol',
    question: 'Has a doctor ever told you that your blood cholesterol is high?',
    kind: 'choice',
    options: YES_NO,
  },
  diabetes: {
    label: 'Diabetes',
    question: 'Has a doctor ever told you that you have diabetes?',
    kind: 'choice',
    options: YES_NO,
  },
  chd_or_mi: {
    label: 'Heart attack or coronary heart disease',
    question: 'Has a doctor ever told you that you had a heart attack or coronary heart disease?',
    kind: 'choice',
    options: YES_NO,
  },
  kidney_disease: {
    label: 'Kidney disease',
    question: 'Has a doctor ever told you that you have kidney disease?',
    kind: 'choice',
    options: YES_NO,
  },
  copd: {
    label: 'COPD',
    question: 'Has a doctor ever told you that you have COPD, emphysema, or chronic bronchitis?',
    kind: 'choice',
    options: YES_NO,
  },
  depression: {
    label: 'Depressive disorder',
    question: 'Has a doctor ever told you that you have a depressive disorder?',
    kind: 'choice',
    options: YES_NO,
  },
  arthritis: {
    label: 'Arthritis',
    question: 'Has a doctor ever told you that you have some form of arthritis?',
    kind: 'choice',
    options: YES_NO,
  },

  // Step 3 — Lifestyle & access
  smoker_status: {
    label: 'Smoking',
    question: 'Which best describes your smoking?',
    kind: 'choice',
    options: [
      { value: 1, label: 'I smoke every day' },
      { value: 2, label: 'I smoke some days' },
      { value: 3, label: 'I used to smoke, but not now' },
      { value: 4, label: 'I have never smoked' },
    ],
  },
  heavy_drink: {
    label: 'Weekly drinking',
    question: 'Do you average more than 14 drinks per week (men) or 7 (women)?',
    kind: 'choice',
    options: YES_NO,
  },
  binge_drink: {
    label: 'Single-occasion drinking',
    question: 'In the past 30 days, have you had 5+ drinks (men) or 4+ (women) on one occasion?',
    kind: 'choice',
    options: YES_NO,
  },
  has_insurance: {
    label: 'Health care coverage',
    question: 'Do you have any kind of health care coverage?',
    kind: 'choice',
    options: YES_NO,
  },
  cost_barrier: {
    label: 'Cost barrier',
    question:
      'In the past 12 months, was there a time you needed to see a doctor but could not because of cost?',
    kind: 'choice',
    options: YES_NO,
  },
}
