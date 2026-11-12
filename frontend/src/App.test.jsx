import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'

vi.mock('./api', () => ({
  createJob: vi.fn(),
  subscribeToJob: vi.fn(),
  uploadHeadshot: vi.fn()
}))

describe('thumbnail prompt form', () => {
  it('enables generation after a prompt is entered', () => {
    render(<App />)

    const generateButton = screen.getByRole('button', { name: /generate thumbnails/i })
    expect(generateButton).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/describe the scene/i), {
      target: { value: 'A clear, engaging video thumbnail' }
    })

    expect(generateButton).toBeEnabled()
  })

  it('previews a selected reference image', () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:reference-image') })
    render(<App />)

    const file = new File(['image data'], 'creator.png', { type: 'image/png' })
    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: { files: [file] }
    })

    expect(screen.getByAltText('Selected reference')).toHaveAttribute('src', 'blob:reference-image')
    expect(screen.getByText('creator.png')).toBeInTheDocument()
  })
})
