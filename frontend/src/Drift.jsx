import { useEffect, useState } from 'react'
import { getDrift } from './api.js'
import { COPY, EXTRA_LABELS, FIELDS } from './copy.js'

const C = COPY.drift
// Sequential neutral scale, deliberately not red/amber/green.
const BAND_COLOR = { stable: 'bg-(--rule-strong)', moderate: 'bg-(--accent)/50', significant: 'bg-(--accent)' }
const label = (f) => FIELDS[f]?.label ?? EXTRA_LABELS[f] ?? f
const pct = (x) => `${(x * 100).toFixed(1)}%`
const day = (iso) => new Date(iso).toLocaleDateString()

export default function Drift() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDrift().then(setReport, () => setError(true))
  }, [])

  if (error) return <p className="text-(--ink)">{C.error}</p>
  if (!report) return <p className="text-(--muted)">{COPY.loading}</p>

  const { n_assessments: n, window: w, features, prediction_drift: pd } = report
  const counts = { stable: 0, moderate: 0, significant: 0 }
  features.forEach((f) => f.band && counts[f.band]++)
  // Axis runs to 0.5, or further if a feature exceeds it, so both thresholds stay visible.
  const axisMax = Math.max(0.5, ...features.map((f) => f.psi ?? 0))
  const at = (v) => `${(v / axisMax) * 100}%`

  return (
    <section className="drift space-y-6">
      <h2>{C.heading}</h2>

      {report.reference === 'approximate' && (
        <p role="alert" className="rounded border border-(--rule-strong) bg-(--paper) p-3 text-sm font-medium text-(--ink)">
          {C.approximate}
        </p>
      )}

      <p className="text-sm text-(--ink-2)">{n > 0 ? C.count(n, day(w.from), day(w.to)) : C.tooFew(0, 30)}</p>

      {!report.sufficient ? (
        n > 0 && <p className="rounded border border-(--rule) bg-(--sheet) p-4 text-(--ink)">{C.tooFew(n, 30)}</p>
      ) : (
        <div className="rounded border border-(--rule) bg-(--sheet) p-4">
          <p className="mb-4 font-medium text-(--ink)">
            {C.summary(counts.stable, counts.moderate, counts.significant)}
          </p>
          <ul className="space-y-1.5">
            {features.map((f) => (
              <li
                key={f.feature}
                className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-2 text-sm"
                aria-label={C.barLabel(label(f.feature), f.psi.toFixed(3), f.band)}
              >
                <span className="truncate text-(--ink-2)" title={label(f.feature)}>{label(f.feature)}</span>
                <span className="relative h-4 rounded-sm bg-(--paper)">
                  <span className={`absolute inset-y-0 left-0 rounded-sm ${BAND_COLOR[f.band]}`} style={{ width: at(f.psi) }} />
                  {[0.1, 0.25].map((t) => (
                    <span key={t} className="absolute -inset-y-0.5 w-px bg-(--ink)" style={{ left: at(t) }} />
                  ))}
                </span>
                <span className="text-right tabular-nums text-(--ink)">{f.psi.toFixed(3)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-(--ink-2)">
            {Object.entries(C.bands).map(([b, text]) => (
              <span key={b} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${BAND_COLOR[b]}`} /> {text}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-px bg-(--ink)" /> 0.1 / 0.25
            </span>
          </div>
          {n < 1000 && <p className="mt-3 text-xs text-(--muted)">{C.smallSample}</p>}
        </div>
      )}

      {report.sufficient && (
        <div className="rounded border border-(--rule) bg-(--sheet) p-4">
          <h3 className="mb-3 font-medium text-(--ink)">{C.predHeading}</h3>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            {[
              [C.flagRate, pct(pd.flag_rate)],
              [C.expectedFlagRate, pct(pd.expected_flag_rate)],
              [C.meanProb, pct(pd.mean_probability)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-(--muted)">{k}</dt>
                <dd className="text-lg font-semibold tabular-nums text-(--ink)">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="text-xs text-(--muted)">
        {report.reference === 'approximate' ? C.approximate : C.reference(report.reference_source)}
      </p>
    </section>
  )
}
