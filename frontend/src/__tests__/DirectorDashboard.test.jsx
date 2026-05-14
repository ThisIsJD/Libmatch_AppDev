import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client.js'
import DirectorDashboard from '../pages/DirectorDashboard.jsx'

vi.mock('../api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.mock('../lib/authSession.js', () => ({
  clearSession: vi.fn(),
  getStoredUser: vi.fn(() => ({
    full_name: 'Library Director',
    email: 'director@libmatch.dev',
    role: 'director',
  })),
}))

function mockAnalyticsRequests({ frequencyItems } = {}) {
  const values =
    frequencyItems ?? [
      { topic_text: 'Programming Basics', count: 6 },
      { topic_text: 'Data Structures', count: 3 },
    ]

  apiClient.get.mockImplementation((url) => {
    if (url === '/analytics/filters') {
      return Promise.resolve({
        data: {
          departments: ['Computer Science', 'Mathematics'],
          course_levels: ['100-level', '200-level'],
        },
      })
    }

    if (url === '/analytics/director/departments/upload-stats') {
      return Promise.resolve({
        data: [
          { department: 'Computer Science', syllabus_count: 7 },
          { department: 'Mathematics', syllabus_count: 3 },
        ],
      })
    }

    if (url === '/analytics/topics/frequency') {
      return Promise.resolve({ data: { items: values } })
    }

    if (url === '/analytics/director/topics/courses') {
      return Promise.resolve({
        data: [
          {
            course_id: 'course-1',
            course_code: 'CS101',
            course_title: 'Course CS101',
            department: 'Computer Science',
            syllabus_id: 'syllabus-1',
          },
        ],
      })
    }

    return Promise.resolve({ data: {} })
  })
}

function renderDirectorDashboard() {
  return render(
    <MemoryRouter>
      <DirectorDashboard />
    </MemoryRouter>,
  )
}

describe('DirectorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAnalyticsRequests()
  })

  test('renders topic frequency table when analytics data loads', async () => {
    renderDirectorDashboard()

    expect(await screen.findByLabelText('Topic frequency table')).toBeDefined()
    expect(screen.queryByText('Relative Frequency')).toBeNull()
  })

  test('populates department filter from analytics filters endpoint', async () => {
    renderDirectorDashboard()

    const departmentSelect = await screen.findByLabelText('Department')
    expect(departmentSelect).toBeDefined()
    expect(screen.getByRole('option', { name: 'Computer Science' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeDefined()
  })

  test('populates course level filter from analytics filters endpoint', async () => {
    renderDirectorDashboard()

    const levelSelect = await screen.findByLabelText('Course Level')
    expect(levelSelect).toBeDefined()
    expect(screen.getByRole('option', { name: '100-level' })).toBeDefined()
    expect(screen.getByRole('option', { name: '200-level' })).toBeDefined()
  })

  test('shows loading skeleton while chart request is in flight', () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/analytics/filters') {
        return Promise.resolve({ data: { departments: [], course_levels: [] } })
      }

      if (url === '/analytics/topics/frequency') {
        return new Promise(() => {})
      }

      return Promise.resolve({ data: {} })
    })

    renderDirectorDashboard()

    expect(screen.getByLabelText('Loading analytics')).toBeDefined()
  })

  test('shows empty state when no confirmed topics are returned', async () => {
    mockAnalyticsRequests({ frequencyItems: [] })
    renderDirectorDashboard()

    expect(await screen.findByText('No confirmed topics yet.')).toBeDefined()
  })

  test('refetches frequency data when department filter changes', async () => {
    renderDirectorDashboard()

    const departmentSelect = await screen.findByLabelText('Department')
    fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } })

    expect(apiClient.get).toHaveBeenCalledWith('/analytics/topics/frequency', {
      params: {
        course_level: '',
        department: 'Computer Science',
        limit: 10,
      },
    })
  })

  test('refetches frequency data when topic limit changes', async () => {
    renderDirectorDashboard()

    const topicLimitSelect = await screen.findByLabelText('Topic Limit')
    fireEvent.change(topicLimitSelect, { target: { value: '50' } })

    expect(apiClient.get).toHaveBeenCalledWith('/analytics/topics/frequency', {
      params: {
        course_level: '',
        department: '',
        limit: 50,
      },
    })
  })

  test('filters topic rows when topic search is used', async () => {
    renderDirectorDashboard()

    const topicSearchInput = await screen.findByLabelText('Filter Topics')
    fireEvent.change(topicSearchInput, { target: { value: 'data' } })

    expect(screen.queryByText('Programming Basics')).toBeNull()
    expect(screen.getByText('Data Structures')).toBeDefined()
  })

  test('renders department upload stats panel after load', async () => {
    renderDirectorDashboard()

    const panelHeading = await screen.findByText('Department Upload Activity')
    const panelSection = panelHeading.closest('section')

    expect(panelSection).toBeTruthy()
    expect(within(panelSection).getByText('Computer Science')).toBeDefined()
    expect(within(panelSection).getByText('7 uploads')).toBeDefined()
  })

  test('opens topic drill-down modal when selecting a topic row', async () => {
    renderDirectorDashboard()

    const topicButton = await screen.findByRole('button', {
      name: 'View courses for Programming Basics',
    })
    fireEvent.click(topicButton)

    expect(await screen.findByText('Courses with “Programming Basics”')).toBeDefined()
    expect(screen.getByText('CS101')).toBeDefined()
  })

  test('closes topic drill-down modal when backdrop is clicked', async () => {
    renderDirectorDashboard()

    const topicButton = await screen.findByRole('button', {
      name: 'View courses for Programming Basics',
    })
    fireEvent.click(topicButton)

    const modalBackdrop = await screen.findByTestId('topic-modal-backdrop')
    fireEvent.click(modalBackdrop)

    expect(screen.queryByText('Courses with “Programming Basics”')).toBeNull()
  })

  test('renders capstone placeholder cards', async () => {
    renderDirectorDashboard()

    expect(await screen.findByText('Essential Resources')).toBeDefined()
    expect(screen.getByText('Resource Utilization by Source Type')).toBeDefined()
    expect(screen.getByText('Semester Trend Analysis')).toBeDefined()
    expect(screen.getByText('Content Provider Sync Status')).toBeDefined()
  })
})
