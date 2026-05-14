import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client.js'
import DirectorSyllabusPreviewModal from '../components/organisms/DirectorSyllabusPreviewModal.jsx'

vi.mock('../api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const pdfSyllabusItem = {
  id: 'syllabus-1',
  file_name: 'cs101.pdf',
  file_type: 'pdf',
  upload_date: '2026-05-10T00:00:00Z',
  course_code: 'CS101',
}

describe('DirectorSyllabusPreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    if (!URL.createObjectURL) {
      URL.createObjectURL = () => ''
    }

    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {}
    }

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:director-syllabus-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders PDF preview iframe after loading', async () => {
    apiClient.get.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    })

    render(
      <DirectorSyllabusPreviewModal
        isOpen
        syllabusItem={pdfSyllabusItem}
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByTestId('director-pdf-preview-iframe')).toBeDefined()
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/director/syllabi/syllabus-1/file', {
      responseType: 'blob',
    })
  })

  test('shows docx message and skips fetch', async () => {
    const docxSyllabusItem = {
      ...pdfSyllabusItem,
      file_name: 'cs101.docx',
      file_type: 'docx',
    }

    render(
      <DirectorSyllabusPreviewModal
        isOpen
        syllabusItem={docxSyllabusItem}
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByText('PDF preview is available only for uploaded PDF files.')).toBeDefined()
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  test('closes when backdrop is clicked', async () => {
    const handleClose = vi.fn()

    render(
      <DirectorSyllabusPreviewModal
        isOpen
        syllabusItem={{ ...pdfSyllabusItem, file_type: 'docx' }}
        onClose={handleClose}
      />,
    )

    const backdropElement = await screen.findByTestId('director-syllabus-preview-backdrop')
    fireEvent.mouseDown(backdropElement)

    expect(handleClose).toHaveBeenCalled()
  })
})
