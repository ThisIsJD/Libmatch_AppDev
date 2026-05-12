import { fireEvent, render, screen } from '@testing-library/react'
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

    if (url === '/analytics/topics/frequency') {
      return Promise.resolve({ data: { items: values } })
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

  test('renders chart container when analytics data loads', async () => {
    renderDirectorDashboard()

    expect(await screen.findByLabelText('Topic frequency chart')).toBeDefined()
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
        limit: 20,
      },
    })
  })
})
