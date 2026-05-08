import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client'
import DashboardPage from '../pages/DashboardPage'

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.mock('../lib/authSession', () => ({
  clearSession: vi.fn(),
  getStoredUser: vi.fn(() => ({ full_name: 'Test Faculty', email: 'faculty@test.dev' })),
}))

const mockCourses = [
  {
    id: 'course-1',
    course_code: 'CS101',
    course_title: 'Fundamentals of Programming',
    semester: '1st Sem',
  },
  {
    id: 'course-2',
    course_code: 'MATH311L',
    course_title: 'Linear Algebra Laboratory',
    semester: '2nd Sem',
  },
]

const mockSyllabi = [
  {
    id: 'syllabus-1',
    course_id: 'course-1',
    file_name: 'programming.pdf',
    file_type: 'pdf',
    upload_date: '2026-05-03T00:00:00Z',
    status: 'processed',
    course: mockCourses[0],
  },
  {
    id: 'syllabus-2',
    course_id: 'course-2',
    file_name: 'linear-algebra.pdf',
    file_type: 'pdf',
    upload_date: '2026-05-03T00:00:00Z',
    status: 'confirmed',
    course: mockCourses[1],
  },
]

function mockDashboardRequests({ syllabi = mockSyllabi, searchResults = [mockSyllabi[1].course] } = {}) {
  apiClient.get.mockImplementation((url, config) => {
    if (url === '/syllabi') {
      return Promise.resolve({ data: syllabi })
    }

    if (url === '/courses/search') {
      return Promise.resolve({ data: searchResults, config })
    }

    return Promise.resolve({ data: [] })
  })
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDashboardRequests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders syllabus cards returned by the API', async () => {
    renderDashboard()

    expect(await screen.findByText('Fundamentals of Programming')).toBeDefined()
    expect(screen.getByText('Linear Algebra Laboratory')).toBeDefined()
  })

  test('shows empty upload state when the API returns no syllabi', async () => {
    mockDashboardRequests({ syllabi: [] })

    renderDashboard()

    expect(await screen.findByText('No syllabus uploads yet.')).toBeDefined()
  })

  test('search query triggers backend search after debounce', async () => {
    renderDashboard()

    await screen.findByText('Fundamentals of Programming')

    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'math' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(apiClient.get).toHaveBeenCalledWith('/courses/search', {
      params: { q: 'math' },
    })
  })

  test('empty search result shows a no-match message', async () => {
    mockDashboardRequests({ searchResults: [] })
    renderDashboard()

    await screen.findByText('Fundamentals of Programming')

    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(screen.getByText('No syllabi match your search.')).toBeDefined()
  })

  test('status filter hides non-matching syllabi', async () => {
    renderDashboard()

    await screen.findByText('Fundamentals of Programming')

    fireEvent.change(screen.getByLabelText('Filter syllabi'), { target: { value: 'confirmed' } })

    expect(screen.getByText('Linear Algebra Laboratory')).toBeDefined()
    expect(screen.queryByText('Fundamentals of Programming')).toBeNull()
  })

  test('shows syllabus card skeletons while dashboard data is loading', () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/syllabi') {
        return new Promise(() => {})
      }

      return Promise.resolve({ data: [] })
    })

    renderDashboard()

    expect(screen.getAllByLabelText('Loading syllabus')).toHaveLength(4)
  })
})
