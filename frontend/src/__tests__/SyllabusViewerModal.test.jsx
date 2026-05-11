import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client'
import SyllabusViewerModal from '../components/SyllabusViewerModal'

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockSyllabus = {
  id: 'syllabus-1',
  file_name: 'linear-algebra.pdf',
  file_type: 'pdf',
  upload_date: '2026-05-03T00:00:00Z',
  course: {
    course_code: 'MATH311L',
  },
}

describe('SyllabusViewerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    if (!URL.createObjectURL) {
      URL.createObjectURL = () => ''
    }

    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {}
    }

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:syllabus-preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    apiClient.delete.mockResolvedValue({ status: 204 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows preview skeleton while syllabus text is loading', () => {
    apiClient.get.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <SyllabusViewerModal
          isOpen
          syllabus={mockSyllabus}
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('syllabus-preview-skeleton')).toBeDefined()
  })

  test('shows PDF preview iframe and deletes syllabus successfully', async () => {
    apiClient.get.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    })
    const onClose = vi.fn()
    const onDelete = vi.fn()

    render(
      <MemoryRouter>
        <SyllabusViewerModal
          isOpen
          syllabus={mockSyllabus}
          onClose={onClose}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('syllabus-pdf-viewer')).toBeDefined()

    expect(apiClient.get).toHaveBeenCalledWith('/syllabi/syllabus-1/file', {
      responseType: 'blob',
    })

    fireEvent.click(screen.getByTestId('delete-syllabus-button'))
    fireEvent.click(screen.getByTestId('confirm-delete-syllabus'))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/syllabi/syllabus-1')
    })
    expect(onDelete).toHaveBeenCalledWith('syllabus-1')
    expect(onClose).toHaveBeenCalled()
  })

  test('shows DOCX message instead of raw text preview', async () => {
    const docxSyllabus = {
      ...mockSyllabus,
      file_name: 'math311l.docx',
      file_type: 'docx',
    }

    render(
      <MemoryRouter>
        <SyllabusViewerModal
          isOpen
          syllabus={docxSyllabus}
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('PDF preview is available only for uploaded PDF files. Use Open in Review for topic matching and extracted content.')).toBeDefined()
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})
