import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAccessToken, getStoredUser } from '../lib/authSession'
import ProtectedRoute from '../routes/ProtectedRoute'

vi.mock('../lib/authSession', () => ({
  getAccessToken: vi.fn(),
  getStoredUser: vi.fn(),
}))

function renderProtectedRoute({ initialPath = '/protected', allowedRoles } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />

        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>

        <Route path="/login" element={<p>Login screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('redirects unauthenticated users to login', () => {
    getAccessToken.mockReturnValue(null)
    getStoredUser.mockReturnValue(null)

    renderProtectedRoute()

    expect(screen.getByText('Login screen')).toBeDefined()
  })

  test('renders protected content when a token exists', () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({ role: 'faculty' })

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeDefined()
  })

  test('redirects to home when role is not allowed', () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({ role: 'faculty' })

    renderProtectedRoute({ allowedRoles: ['director'] })

    expect(screen.getByText('Home screen')).toBeDefined()
  })

  test('renders protected content when role is allowed', () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({ role: 'director' })

    renderProtectedRoute({ allowedRoles: ['director'] })

    expect(screen.getByText('Protected content')).toBeDefined()
  })
})