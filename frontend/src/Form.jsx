import { useState } from 'react'
import { buildPayload, computeBmi, predict } from './api.js'
import { COPY, FIELDS } from './copy.js'
import Rail from './Rail.jsx'

const STEPS = [
  ['age', 'is_female', 'height_cm', 'weight_kg', 'urban_rural', 'education', 'marital', 'own_home', 'veteran'],
  ['high_bp', 'high_chol', 'diabetes', 'chd_or_mi', 'kidney_disease', 'copd', 'depression', 'arthritis'],
  ['smoker_status', 'heavy_drink', 'binge_drink', 'has_insurance', 'cost_barrier'],
]

// Height and weight are form-only inputs (not model features), so their bounds are
// not in model_config.json. Suggested bounds from docs/DATA_DICTIONARY.md.
const BODY_BOUNDS = { height_cm: [100, 250], weight_kg: [25, 300] }

const bounds = (name, schema) =>
  BODY_BOUNDS[name] ?? [schema.schema[name].min, schema.schema[name].max]

function validateStep(fields, values, schema) {
  const errors = {}
  for (const name of fields) {
    const field = FIELDS[name]
    const raw = values[name]
    if (raw === undefined || raw === '') {
      errors[name] = COPY.required(field.label)
    } else if (field.kind === 'number') {
      const [min, max] = bounds(name, schema)
      const n = Number(raw)
      if (name === 'age' && !(Number.isInteger(n) && n >= min && n <= max)) {
        errors[name] = COPY.wholeNumber(field.label, min, max)
      } else if (!(n >= min && n <= max)) {
        errors[name] = COPY.outOfRange(field.label, min, max, field.unit)
      }
    }
  }
  // BMI range lives in the config; its error goes on the fields the user actually sees.
  if (fields.includes('height_cm') && !errors.height_cm && !errors.weight_kg) {
    const bmi = computeBmi(Number(values.weight_kg), Number(values.height_cm))
    const { min, max } = schema.schema.bmi
    if (!(bmi >= min && bmi <= max)) errors.height_cm = errors.weight_kg = COPY.bmiOutOfRange
  }
  return errors
}

function Field({ name, value, error, schema, onChange }) {
  const field = FIELDS[name]
  const errorId = `${name}-error`
  const errorText = error && (
    <p id={errorId} className="err">
      {error}
    </p>
  )

  if (field.kind === 'number') {
    const [min, max] = bounds(name, schema)
    return (
      <div className="q">
        <label htmlFor={name} className="q-label">
          {field.question}
        </label>
        <div className="q-value num">
          <input
            id={name}
            name={name}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={name === 'age' ? 1 : 'any'}
            value={value ?? ''}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange(name, e.target.value)}
          />
          <span>{field.unit}</span>
        </div>
        {errorText}
      </div>
    )
  }

  return (
    <fieldset className="q" aria-describedby={error ? errorId : undefined}>
      <legend className="q-label">{field.question}</legend>
      <div className="q-value choices">
        {field.options.map((opt) => (
          <label key={opt.value} className="choice">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(name, opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {errorText}
    </fieldset>
  )
}

export default function Form({ schema, onResult }) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fields = STEPS[step]
  const last = step === STEPS.length - 1
  const setValue = (name, v) => setValues((prev) => ({ ...prev, [name]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    const stepErrors = validateStep(fields, values, schema)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length) return
    if (!last) {
      setStep(step + 1)
      window.scrollTo(0, 0)
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = buildPayload(values, schema)
      console.log('predict payload', payload)
      onResult(await predict(payload))
    } catch (err) {
      console.error(err)
      setSubmitError(COPY.modelUnavailable)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="frame">
      <Rail step={step} notes={COPY.rail.form} />
      <form onSubmit={handleSubmit} noValidate className="sheet">
      <div className="sheet-head">
        <h2>{COPY.steps[step]}</h2>
        <p>{COPY.stepOf(step + 1, STEPS.length)}</p>
      </div>

      {fields.map((name) => (
        <Field
          key={name}
          name={name}
          value={values[name]}
          error={errors[name]}
          schema={schema}
          onChange={setValue}
        />
      ))}

      {submitError && <p className="err">{submitError}</p>}

      <div className="sheet-foot">
        <button
          type="button"
          onClick={() => {
            setErrors({})
            setStep(step - 1)
          }}
          disabled={step === 0}
          className="btn btn-ghost"
        >
          {COPY.back}
        </button>
        <button type="submit" disabled={submitting} className="btn btn-solid">
          {last ? (submitting ? COPY.submitting : COPY.submit) : COPY.next}
        </button>
      </div>
      </form>
    </div>
  )
}
