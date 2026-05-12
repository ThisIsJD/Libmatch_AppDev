import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client.js'
import DirectorUsersPage from '../pages/DirectorUsersPage.jsx'

vi.mock('../api/client.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

function mockDirectorUsersRequest() {
  apiClient.get.mockImplementation((url) => {
    if (url === '/director/users') {
      return Promise.resolve({
        data: {
          items: [
            {
              id: 'user-1',
              full_name: 'Director User',
              email: 'director@libmatch.dev',
              role: 'director',
              last_upload: null,
            },
            {
              id: 'user-2',
              full_name: 'Faculty User',
              email: 'faculty@libmatch.dev',
              role: 'faculty',
              last_upload: '2026-05-10T00:00:00Z',
            },
          ],
        },
      })
    }

    return Promise.resolve({ data: {} })
  })
}

function renderDirectorUsersPage() {
  return render(
    <MemoryRouter>
      <DirectorUsersPage />
    </MemoryRouter>,
  )
}

describe('DirectorUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDirectorUsersRequest()
  })

  test('renders user table rows from API response', async () => {
    renderDirectorUsersPage()

    expect(await screen.findByText('Director User')).toBeDefined()
    expect(screen.getByText('Faculty User')).toBeDefined()
  })

  test('renders role labels for returned users', async () => {
    renderDirectorUsersPage()

    expect(await screen.findByText('Director')).toBeDefined()
    expect(screen.getByText('Faculty')).toBeDefined()
  })

  test('shows loading skeleton while users request is in flight', () => {
    apiClient.get.mockImplementation((url) => {
      if (url === '/director/users') {
        return new Promise(() => {})
      }

      return Promise.resolve({ data: {} })
    })

    renderDirectorUsersPage()

    expect(screen.getByLabelText('Loading director users')).toBeDefined()
  })
})
