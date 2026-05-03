import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client'
import SyllabusViewerModal from '../components/SyllabusViewerModal'

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const mockSyllabus = {
  id: 'syllabus-1',
  file_name: 'linear-algebra.pdf',
  upload_date: '2026-05-03T00:00:00Z',
  course: {
    course_code: 'MATH311L',
  },
}

describe('SyllabusViewerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
