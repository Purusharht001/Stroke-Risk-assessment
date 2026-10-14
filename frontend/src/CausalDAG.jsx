import { COPY } from './copy.js'

// Assumed DAG from docs/ACADEMIC_DOSSIER.md §3.2. Static inline SVG, no graph library.
// Arrows: upstream factor → outcome → excluded descendant. Direction is the claim.

const W = 720
const TOP = { y: 28, w: 104, h: 40, gap: 8 }
const OUT = { x: 270, y: 160, w: 180, h: 44 }
const EXC = { y: 316, w: 94, h: 44, gap: 6 }

const row = (n, w, gap) => {
  const x0 = (W - (n * w + (n - 1) * gap)) / 2
  return Array.from({ length: n }, (_, i) => x0 + i * (w + gap))
}

// Long labels break at the first space.
function Label({ x, y, text, className }) {
  const i = text.indexOf(' ')
  const lines = text.length > 12 && i > 0 ? [text.slice(0, i), text.slice(i + 1)] : [text]
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="11" className={className}>
      {lines.map((l, k) => (
        <tspan key={k} x={x} dy={k === 0 ? (lines.length - 1) * -6.5 + 4 : 13}>
          {l}
        </tspan>
      ))}
    </text>
  )
}

export default function CausalDAG() {
  const { upstreamNodes, excludedNodes } = COPY.dag
  const topX = row(upstreamNodes.length, TOP.w, TOP.gap)
  const excX = row(excludedNodes.length, EXC.w, EXC.gap)
  const outCx = OUT.x + OUT.w / 2

  return (
    <section className="section">
      <h2>{COPY.dag.heading}</h2>
      <svg viewBox={`0 0 ${W} 410`} className="mt-4 w-full" role="img" aria-label={COPY.dag.title}>
        <title>{COPY.dag.title}</title>
        <defs>
          <marker id="dag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-(--ink-2)" />
          </marker>
          <marker id="dag-arrow-grey" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-(--rule-strong)" />
          </marker>
        </defs>

        <text x={W / 2} y={16} textAnchor="middle" fontSize="11" className="fill-(--ink-2)">
          {COPY.dag.upstream}
        </text>

        {/* upstream → outcome */}
        {topX.map((x, i) => (
          <line key={i} x1={x + TOP.w / 2} y1={TOP.y + TOP.h} x2={outCx} y2={OUT.y - 2}
            className="stroke-(--ink-2)" strokeWidth="1.3" markerEnd="url(#dag-arrow)" />
        ))}
        {/* outcome → excluded descendants */}
        {excX.map((x, i) => (
          <line key={i} x1={outCx} y1={OUT.y + OUT.h} x2={x + EXC.w / 2} y2={EXC.y - 2}
            className="stroke-(--rule-strong)" strokeWidth="1.3" markerEnd="url(#dag-arrow-grey)" />
        ))}

        {upstreamNodes.map((t, i) => (
          <g key={t}>
            <rect x={topX[i]} y={TOP.y} width={TOP.w} height={TOP.h} rx="6"
              className="fill-(--sheet) stroke-(--ink-2)" strokeWidth="1.3" />
            <Label x={topX[i] + TOP.w / 2} y={TOP.y + TOP.h / 2} text={t} className="fill-(--ink)" />
          </g>
        ))}

        <rect x={OUT.x} y={OUT.y} width={OUT.w} height={OUT.h} rx="8" className="fill-(--ink)" />
        <text x={outCx} y={OUT.y + OUT.h / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="600" className="fill-(--sheet)">
          {COPY.dag.outcome}
        </text>

        <rect x="4" y={EXC.y - 12} width={W - 8} height={EXC.h + 48} rx="8"
          className="fill-(--paper) stroke-(--rule)" strokeDasharray="5 4" />
        {excludedNodes.map((t, i) => (
          <g key={t}>
            <rect x={excX[i]} y={EXC.y} width={EXC.w} height={EXC.h} rx="6"
              className="fill-(--sheet) stroke-(--rule-strong)" strokeDasharray="4 3" />
            <Label x={excX[i] + EXC.w / 2} y={EXC.y + EXC.h / 2} text={t} className="fill-(--muted)" />
          </g>
        ))}
        <text x={W / 2} y={EXC.y + EXC.h + 24} textAnchor="middle" fontSize="11" fontWeight="600"
          letterSpacing="0.06em" className="fill-(--muted)">
          {COPY.dag.excluded}
        </text>
      </svg>
      <p className="sub mt-3">{COPY.dag.caption}</p>
    </section>
  )
}
