import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createJob, subscribeToJob, uploadHeadshot } from './api'
import './App.css'

const examples = [
  'A bold creator portrait with electric blue lighting and a dramatic red arrow',
  'Minimal productivity setup, warm desk light, high contrast, clean text space',
  'Gaming reaction thumbnail with neon purple energy and expressive face'
]

const Header = memo(function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <span className="brand-mark">✦</span>
        ThumbnailGenerator
      </a>

      <div className="topbar-right">
        <span className="status-dot" />
        AI thumbnail studio
        <button className="avatar">A</button>
      </div>
    </header>
  )
})

const PromptForm = memo(function PromptForm({ onSubmit, busy }) {
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(3)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')

  const inputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const chooseFile = (event) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (prompt.trim()) {
      onSubmit({ prompt, count, file })
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="section-label">
        <span>01</span> Describe your thumbnail
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe the scene, mood, text, and visual style you want..."
        rows="5"
      />

      <div className="examples">
        {examples.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setPrompt(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="section-label">
        <span>02</span> Add a reference <em>optional</em>
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={chooseFile}
      />

      <button
        type="button"
        className={`dropzone ${preview ? 'has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Selected reference" />
            <span>
              {file.name}
              <small>Click to replace</small>
            </span>
          </>
        ) : (
          <>
            <strong>＋</strong>
            <span>
              Upload a face or reference image
              <small>PNG, JPG up to 10MB</small>
            </span>
          </>
        )}
      </button>

      <div className="section-label">
        <span>03</span> Number of concepts
      </div>

      <div className="count-picker">
        {[1, 2, 3].map((number) => (
          <button
            type="button"
            key={number}
            className={count === number ? 'selected' : ''}
            onClick={() => setCount(number)}
          >
            {number}
          </button>
        ))}
      </div>

      <button
        className="generate"
        disabled={busy || !prompt.trim()}
      >
        {busy ? 'Creating concepts…' : 'Generate thumbnails →'}
      </button>
    </form>
  )
})

function Results({ items, status }) {
  const getHeading = () => {
    if (status === 'idle') return 'Ready when you are'
    if (status === 'working') return 'Generating your concepts…'

    return 'Your thumbnail concepts'
  }

  return (
    <section className="results">
      <div className="results-heading">
        <div>
          <div className="section-label">
            <span>04</span> Your concepts
          </div>

          <h2>{getHeading()}</h2>
        </div>

        {items.length > 0 && (
          <span className="result-count">
            {items.length} ready
          </span>
        )}
      </div>

      <div className="concept-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <p>Your generated thumbnails will appear here.</p>
            <span>Start with a clear description on the left.</span>
          </div>
        ) : (
          items.map((item, index) => (
            <article
              className="concept-card"
              key={item.thumbnail_id || index}
            >
              <div className="image-wrap">
                {item.imagekit_url ? (
                  <img
                    src={item.imagekit_url}
                    alt={item.style_name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="loading-card">
                    <span>✦</span>
                    <small>{item.error || 'Generating…'}</small>
                  </div>
                )}
              </div>

              <div className="card-meta">
                <span>
                  {item.style_name || `Concept ${index + 1}`}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    item.imagekit_url &&
                    window.open(item.imagekit_url, '_blank')
                  }
                >
                  ↗
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const generate = useCallback(async ({ prompt, count, file }) => {
    try {
      setError('')
      setStatus('working')
      setItems([])

      let headshotUrl = ''

      if (file) {
        const response = await uploadHeadshot(file)
        headshotUrl = response.url
      }

      const { job_id: jobId } = await createJob({
        prompt,
        numThumbnails: count,
        headshotUrl
      })

      subscribeToJob(jobId, {
        onThumbnailReady: (item) => {
          setItems((current) => [...current, item])
        },

        onThumbnailFailed: (item) => {
          setItems((current) => [...current, item])
        },

        onJobComplete: () => {
          setStatus('complete')
        },

        onError: () => {
          setStatus('error')
          setError('The generation stream disconnected. Please try again.')
        }
      })
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong.')
    }
  }, [])

  return (
    <div className="app-shell">
      <Header />

      <main>
        <section className="intro">
          <p className="eyebrow">AI-POWERED THUMBNAILS</p>

          <h1>
            Make your next video
            <br />
            <span>impossible to ignore.</span>
          </h1>

          <p className="subhead">
            Turn a simple idea into scroll-stopping thumbnail concepts in seconds.
          </p>
        </section>

        <div className="workspace">
          <PromptForm
            onSubmit={generate}
            busy={status === 'working'}
          />

          <Results items={items} status={status} />
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
      </main>

      <footer>
        <span>Built for creators who care about the click.</span>

        <span>
          FrameForge <span className="footer-mark">✦</span>
        </span>
      </footer>
    </div>
  )
}

export default App
