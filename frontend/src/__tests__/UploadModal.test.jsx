import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client'
import UploadModal from '../components/UploadModal'

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

function createMockFile(name, type, bytes = 2048) {
  const file = new File(['x'.repeat(bytes)], name, { type })
  return file
}

describe('UploadModal', () => {
  test('shows file chip after selecting a valid file', async () => {
    render(<UploadModal isOpen onClose={vi.fn()} onUploadSuccess={vi.fn()} />)

    const fileInput = screen.getByTestId('upload-file-input')
    const file = createMockFile('math311l.pdf', 'application/pdf')

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByTestId('selected-file-chip')).toBeDefined()
    expect(screen.getByText('math311l.pdf')).toBeDefined()
    expect(screen.queryByTestId('upload-dropzone')).toBeNull()
  })

  test('clears selected file when remove button is clicked', async () => {
    render(<UploadModal isOpen onClose={vi.fn()} onUploadSuccess={vi.fn()} />)

    const fileInput = screen.getByTestId('upload-file-input')
    const file = createMockFile('math311l.pdf', 'application/pdf')

    fireEvent.change(fileInput, { target: { files: [file] } })

    const removeButton = await screen.findByTestId('remove-selected-file')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.getByTestId('upload-dropzone')).toBeDefined()
    })
    expect(screen.queryByTestId('selected-file-chip')).toBeNull()
  })

  test('shows progress panel with uploading state when submit starts', async () => {
    apiClient.post.mockImplementation(() => new Promise(() => {}))

    render(<UploadModal isOpen onClose={vi.fn()} onUploadSuccess={vi.fn()} />)

    const fileInput = screen.getByTestId('upload-file-input')
    const file = createMockFile('math311l.pdf', 'application/pdf')
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }))

    expect(await screen.findByTestId('upload-progress-panel')).toBeDefined()
    expect(screen.getByText('Uploading file...')).toBeDefined()
  })

  test('returns to idle with error message when upload fails', async () => {
    apiClient.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          detail: 'Upload failed for test.',
        },
      },
    })

    render(<UploadModal isOpen onClose={vi.fn()} onUploadSuccess={vi.fn()} />)

    const fileInput = screen.getByTestId('upload-file-input')
    const file = createMockFile('math311l.pdf', 'application/pdf')
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }))

    expect(await screen.findByText('Upload failed for test.')).toBeDefined()
    expect(screen.getByTestId('selected-file-chip')).toBeDefined()
    expect(screen.queryByTestId('upload-progress-panel')).toBeNull()
  })
})
