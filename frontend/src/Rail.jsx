import { COPY } from './copy.js'

// Left rail: BE FAST emergency notice, the three form steps as a ticked list, then a short note.
// step = index of the current step; COPY.steps.length means all done (result page).
export default function Rail({ step, notes }) {
  return (
    <aside className="rail">
      <div className="befast" role="note">
        <p className="befast-title">{COPY.befast.title}</p>
        <ul>
          {COPY.befast.signs.map(([letter, sign]) => (
            <li key={letter}><b>{letter}</b> = {sign}</li>
          ))}
        </ul>
      </div>
      <ol className="steps">
        {COPY.steps.map((title, i) => (
          <li
            key={title}
            data-state={i < step ? 'done' : i === step ? 'now' : undefined}
            aria-current={i === step ? 'step' : undefined}
          >
            <b>{i + 1}</b> {title}
          </li>
        ))}
      </ol>
      <div className="rail-note">
        {notes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </div>
    </aside>
  )
}
