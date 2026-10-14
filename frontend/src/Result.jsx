import { useEffect, useState } from 'react'
import { getNarrative } from './api.js'
import CausalDAG from './CausalDAG.jsx'
import Rail from './Rail.jsx'
import { COPY, EXTRA_LABELS, FIELDS } from './copy.js'

const PROB_CEILING = 0.99 // mirrors backend/main.py
const pct = (p) =>`${(p * 100).toFixed(1)}%`
const tickPct = (p) => `${+(p * 100).toFixed(1)}%`
const label = (f) => FIELDS[f]?.label ?? EXTRA_LABELS[f] ?? f

// Measurement scale: ticks, the threshold marked, a dot for this profile.
// No red/amber/green: the model makes no severity claim.
function ScoreBar({ probability, percent, threshold }) {
  const max = Math.ceil(Math.max(probability, threshold * 3) * 10) / 10
  const at = (p) => `${Math.min(p / max, 1) * 100}%`
  return (
    <div role="img" aria-label={COPY.result.scoreBarLabel(percent, pct(threshold))} className="scale-track">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <div key={f} className="tick" style={{ left: `${f * 100}%` }}>
          <i>{tickPct(f * max)}</i>
        </div>
      ))}
      <div className="cut" style={{ left: at(threshold) }}>
        <i>{COPY.result.thresholdMark(pct(threshold))}</i>
      </div>
      <div className="dot" style={{ left: at(probability) }} />
    </div>
  )
}

// Diverging bars from a centre axis, the feature named on the opposite side.
// Direction is carried by side and by the text label, not by colour meaning.
function ShapBars({ contributions }) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.shap)), 1e-9)
  return (
    <>
      <ul className="bars">
        <li className="axis" aria-hidden="true" />
        {contributions.map((c) => {
          const up = c.direction === 'up'
          return (
            <li key={c.feature} className="bar-row" data-dir={up ? 'up' : 'down'}>
              <span className="bar-name">
                {label(c.feature)} — {up ? COPY.result.shapUp : COPY.result.shapDown}
              </span>
              <span className="bar" aria-hidden="true">
                <i style={{ width: `${(Math.abs(c.shap) / maxAbs) * 100}%` }} />
              </span>
            </li>
          )
        })}
      </ul>
      <div className="bars-key" aria-hidden="true">
        <span>← {COPY.result.shapDown}</span>
        <span>{COPY.result.shapUp} →</span>
      </div>
    </>
  )
}

export default function Result({ result, onReset }) {
  const contributions = result.contributions.slice(0, 5)
  // The API clamps at 0.99 (isotonic saturation); at the ceiling, don't imply precision.
  const percent = result.probability >= PROB_CEILING ? '>99%' : result.percent
  const [narrative, setNarrative] = useState(null)

  // Fire-and-forget: the page renders immediately and never waits on the LLM.
  useEffect(() => {
    let live = true
    getNarrative(contributions).then((n) => live && setNarrative(n))
    return () => {
      live = false
    }
  }, [result.id])

  return (
    <div className="frame">
      <Rail step={COPY.steps.length} notes={COPY.rail.result} />
      <div className="sheet">
        <div className="result-top">
          <div>
            <div className="figure" aria-hidden="true">
              {percent.replace(/%$/, '')}
              <small>%</small>
            </div>
            <p className="figure-cap">{COPY.result.score(percent)}</p>
          </div>
          <div>
            <p className="verdict">
              <span>{result.flagged ? COPY.result.flagged : COPY.result.notFlagged}</span>
            </p>
            <p className="verdict-note">{COPY.result.flagNote(pct(result.threshold))}</p>
          </div>
        </div>

        <section className="section">
          <ScoreBar probability={result.probability} percent={percent} threshold={result.threshold} />
        </section>

        <section className="section">
          <h2>{COPY.result.shapHeading}</h2>
          {narrative && <p className="narrative">{narrative}</p>}
          <ShapBars contributions={contributions} />
          <p className="bars-note">{COPY.result.shapNote}</p>
        </section>

        <CausalDAG />

        <div className="sheet-foot">
          <button type="button" onClick={onReset} className="btn btn-ghost">
            {COPY.startOver}
          </button>
        </div>
      </div>
    </div>
  )
}
