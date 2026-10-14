import { useEffect, useState } from 'react'
import { getSchema } from './api.js'
import { COPY } from './copy.js'
import Form from './Form.jsx'
import Result from './Result.jsx'
import Drift from './Drift.jsx'

export default function App() {
  const [schema, setSchema] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [result, setResult] = useState(null)
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    getSchema().then(setSchema, () => setLoadError(true))
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const onDrift = hash === '#drift'
  let body
  if (onDrift) body = <Drift />
  else if (loadError) body = <p className="status">{COPY.modelUnavailable}</p>
  else if (!schema) body = <p className="status">{COPY.loading}</p>
  else if (result) body = <Result result={result} onReset={() => setResult(null)} />
  else body = <Form schema={schema} onResult={setResult} />

  return (
    <>
      <header className="masthead">
        <div className="masthead-in">
          <h1 className="wordmark">{COPY.appTitle}</h1>
          <p className="tagline">{COPY.subtitle}</p>
          <a href={onDrift ? '#' : '#drift'}>{onDrift ? COPY.drift.back : COPY.drift.nav}</a>
        </div>
      </header>
      <main className="shell">{body}</main>
      <footer className="disclaimer">
        <p>{COPY.footer}</p>
      </footer>
    </>
  )
}
