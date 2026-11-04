
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

// Upload reference image
export async function uploadHeadshot(file) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${API_BASE}/upload-headshot`, {
    method: 'POST',
    body: form
  })

  if (!response.ok) {
    throw new Error('Failed to upload reference image')
  }

  return response.json()
}

// Create thumbnail generation job
export async function createJob({ prompt, numThumbnails, headshotUrl }) {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      num_thumbnails: numThumbnails,
      headshot_url: headshotUrl
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create thumbnail job')
  }

  return response.json()
}

// Subscribe to job updates using Server-Sent Events
export function subscribeToJob(
  jobId,
  { onThumbnailReady, onThumbnailFailed, onJobComplete, onError }
) {
  const eventSource = new EventSource(
    `${API_BASE}/jobs/${jobId}/stream`
  )

  eventSource.addEventListener('thumbnail_ready', (event) => {
    onThumbnailReady(JSON.parse(event.data))
  })

  eventSource.addEventListener('thumbnail_failed', (event) => {
    onThumbnailFailed(JSON.parse(event.data))
  })

  eventSource.addEventListener('job_completed', (event) => {
    onJobComplete(JSON.parse(event.data))
    eventSource.close()
  })

  eventSource.addEventListener('error', (event) => {
    onError(event)
    eventSource.close()
  })

  return eventSource
}
