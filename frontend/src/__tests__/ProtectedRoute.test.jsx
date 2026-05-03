import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAccessToken } from '../lib/authSession'
import ProtectedRoute from '../routes/ProtectedRoute'

vi.mock('../lib/authSession', () => ({
  getAccessToken: vi.fn(),
}))

function renderProtectedRoute(initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
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

    renderProtectedRoute()

    expect(screen.getByText('Login screen')).toBeDefined()
  })

  test('renders protected content when a token exists', () => {
    getAccessToken.mockReturnValue('token-123')

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeDefined()
  })
})