// Fetch wrapper for the FastAPI backend (proxied to :8000 by Vite) plus the pure
// payload builder, kept here so it can be exercised without a browser.

const CODED = ['smoker_status', 'education', 'marital']

async function request(path, options) {
  const res = await fetch(`/api/v1${path}`, options)
  if (!res.ok) throw new Error(`${path} returned ${res.status}`)
  return res.json()
}

export const getSchema = () => request('/schema')

export const getDrift = () => request('/drift')

export const predict =(payload) =>
  request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

// Resolves to a string or null. Never rejects: the result page must not depend on the LLM.
export const getNarrative = (contributions) =>
  request('/narrative', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contributions }),
    signal: AbortSignal.timeout(7000),
  }).then((r) => r.narrative ?? null, () => null)

// BMI is computed from height and weight, never asked.
export const computeBmi = (weightKg, heightCm) => weightKg / Math.pow(heightCm / 100, 2)

// values: form state (numbers for choices, strings for numeric inputs).
// schema: GET /api/v1/schema response. Keys follow the fitted feature order.
export function buildPayload(values, schema) {
  const payload = {}
  for (const name of schema.features) {
    payload[name] =
      name === 'bmi'
        ? computeBmi(Number(values.weight_kg), Number(values.height_cm))
        : Number(values[name])
    if (!Number.isFinite(payload[name])) throw new Error(`${name} is not a number`)
  }
  for (const name of CODED) {
    const { min, max } = schema.schema[name]
    const v = payload[name]
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
      throw new Error(`${name} must be an integer code ${min}-${max}, got ${v}`)
    }
  }
  if (Object.keys(payload).length !== schema.features.length) {
    throw new Error('payload does not match the schema feature list')
  }
  return payload
}
