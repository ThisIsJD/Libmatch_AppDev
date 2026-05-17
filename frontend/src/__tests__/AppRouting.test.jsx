import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAccessToken, getStoredUser } from '../lib/authSession.js'
import App from '../App.jsx'

vi.mock('../pages/LoginPage.jsx', () => ({
  default: function MockLoginPage() {
    return <p>Mock Login</p>
  },
}))

vi.mock('../pages/DashboardPage.jsx', () => ({
  default: function MockDashboardPage() {
    return <p>Mock Dashboard</p>
  },
}))

vi.mock('../pages/TopicReviewPage.jsx', () => ({
  default: function MockTopicReviewPage() {
    return <p>Mock Topic Review</p>
  },
}))

vi.mock('../pages/DirectorDashboard.jsx', () => ({
  default: function MockDirectorDashboard() {
    return <p>Mock Director Dashboard</p>
  },
}))

vi.mock('../pages/DirectorSyllabiPage.jsx', () => ({
  default: function MockDirectorSyllabiPage() {
    return <p>Mock Director Syllabi</p>
  },
}))

vi.mock('../pages/DirectorUsersPage.jsx', () => ({
  default: function MockDirectorUsersPage() {
    return <p>Mock Director Users</p>
  },
}))

vi.mock('../components/templates/DirectorLayout.jsx', () => ({
  default: function MockDirectorLayout() {
    return <p>Mock Director Layout</p>
  },
}))

vi.mock('../lib/authSession.js', () => ({
  clearSession: vi.fn(),
  getAccessToken: vi.fn(),
  getStoredUser: vi.fn(),
}))

describe('App routing fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders Not Found page for unknown route', async () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({
      full_name: 'Faculty User',
      email: 'faculty@libmatch.dev',
      role: 'faculty',
    })

    window.history.pushState({}, '', '/does-not-exist')
    render(<App />)

    expect(await screen.findByText('Page not found')).toBeDefined()
    expect(screen.getByText(/Requested path:/)).toBeDefined()
    expect(screen.getByText('/does-not-exist')).toBeDefined()
    expect(screen.queryByText('Mock Dashboard')).toBeNull()
  })

  test('Not Found primary action navigates to home route', async () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({
      full_name: 'Faculty User',
      email: 'faculty@libmatch.dev',
      role: 'faculty',
    })

    window.history.pushState({}, '', '/wrong-path')
    render(<App />)

    const goHomeButton = await screen.findByRole('button', { name: 'Go to Dashboard' })
    fireEvent.click(goHomeButton)

    expect(await screen.findByText('Mock Dashboard')).toBeDefined()
  })

  test('Not Found primary action navigates directors to director dashboard', async () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({
      full_name: 'Director User',
      email: 'director@libmatch.dev',
      role: 'director',
    })

    window.history.pushState({}, '', '/director/unknown')
    render(<App />)

    const goDirectorButton = await screen.findByRole('button', { name: 'Go to Director Dashboard' })
    fireEvent.click(goDirectorButton)

    expect(await screen.findByText('Mock Director Layout')).toBeDefined()
  })

  test('director route still redirects unauthorized role to home', async () => {
    getAccessToken.mockReturnValue('token-123')
    getStoredUser.mockReturnValue({
      full_name: 'Faculty User',
      email: 'faculty@libmatch.dev',
      role: 'faculty',
    })

    window.history.pushState({}, '', '/director')
    render(<App />)

    expect(await screen.findByText('Mock Dashboard')).toBeDefined()
  })
})
