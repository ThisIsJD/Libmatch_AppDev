import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client.js'
import DirectorSyllabiPage from '../pages/DirectorSyllabiPage.jsx'

vi.mock('../api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

function createMockSyllabiResponse() {
  return {
    total: 2,
    items: [
      {
        id: 'syllabus-1',
        file_name: 'cs101.pdf',
        file_type: 'pdf',
        status: 'confirmed',
        upload_date: '2026-05-10T00:00:00Z',
        course_code: 'CS101',
        course_title: 'Course CS101',
        department: 'Computer Science',
        uploaded_by_name: 'Faculty A',
      },
      {
        id: 'syllabus-2',
        file_name: 'math101.pdf',
        file_type: 'pdf',
        status: 'processed',
        upload_date: '2026-05-11T00:00:00Z',
        course_code: 'MATH101',
        course_title: 'Course MATH101',
        department: 'Mathematics',
        uploaded_by_name: 'Faculty B',
      },
    ],
  }
}

function mockDirectorSyllabiRequests() {
  apiClient.get.mockImplementation((url) => {
    if (url === '/analytics/filters') {
      return Promise.resolve({
        data: {
          departments: ['Computer Science', 'Mathematics'],
          course_levels: ['100-level'],
        },
      })
    }

    if (url === '/analytics/director/syllabi') {
      return Promise.resolve({ data: createMockSyllabiResponse() })
    }

    if (url === '/analytics/director/syllabi/coverage') {
      return Promise.resolve({
        data: {
          items: [
            {
              course_id: 'course-1',
              course_code: 'CS999',
              course_title: 'Special Topics',
              department: 'Computer Science',
              syllabus_count: 0,
            },
          ],
        },
      })
    }

    return Promise.resolve({ data: {} })
  })
}

function renderDirectorSyllabiPage() {
  return render(
    <MemoryRouter>
      <DirectorSyllabiPage />
    </MemoryRouter>,
  )
}

describe('DirectorSyllabiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDirectorSyllabiRequests()
  })

  test('renders syllabi table rows from API response', async () => {
    renderDirectorSyllabiPage()

    expect(await screen.findByText('cs101.pdf')).toBeDefined()
    expect(screen.getByText('math101.pdf')).toBeDefined()
    expect(screen.getAllByRole('button', { name: /^Preview /i })).toHaveLength(2)
  })

  test('department filter triggers request with department param', async () => {
    renderDirectorSyllabiPage()

    const departmentSelect = await screen.findByLabelText('Department Filter')
    fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } })

    expect(apiClient.get).toHaveBeenCalledWith('/analytics/director/syllabi', {
      params: {
        department: 'Computer Science',
        page: 1,
        page_size: 50,
        semester: '',
        status: '',
      },
    })
  })

  test('status filter triggers request with status param', async () => {
    renderDirectorSyllabiPage()

    const statusSelect = await screen.findByLabelText('Status Filter')
    fireEvent.change(statusSelect, { target: { value: 'processed' } })

    expect(apiClient.get).toHaveBeenCalledWith('/analytics/director/syllabi', {
      params: {
        department: '',
        page: 1,
        page_size: 50,
        semester: '',
        status: 'processed',
      },
    })
  })

  test('renders courses without syllabi in coverage panel', async () => {
    renderDirectorSyllabiPage()

    expect(await screen.findByText('Courses Without Syllabi')).toBeDefined()
    expect(screen.getByText('CS999')).toBeDefined()
  })

  test('shows loading skeleton while syllabi request is in flight', () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/analytics/director/syllabi') {
        return new Promise(() => {})
      }

      if (url === '/analytics/filters') {
        return Promise.resolve({ data: { departments: [], course_levels: [] } })
      }

      if (url === '/analytics/director/syllabi/coverage') {
        return Promise.resolve({ data: { items: [] } })
      }

      return Promise.resolve({ data: {} })
    })

    renderDirectorSyllabiPage()

    expect(screen.getByLabelText('Loading director syllabi')).toBeDefined()
  })
})
