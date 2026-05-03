import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { apiClient } from '../api/client'
import LoginPage from '../pages/LoginPage'
import { setSession } from '../lib/authSession'

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('../lib/authSession', () => ({
  getAccessToken: vi.fn(() => null),
  setSession: vi.fn(),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Dashboard loaded</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders email and password inputs', () => {
    renderLoginPage()

    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByLabelText('Password')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Sign in as Faculty' })).toBeDefined()
  })

  test('shows inline error when submitted empty', () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: 'Sign in as Faculty' }))

    expect(screen.getByText('Please enter both email and password.')).toBeDefined()
  })

  test('shows error message on invalid credentials', async () => {
    apiClient.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'Invalid email or password' } },
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'faculty@libmatch.dev' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in as Faculty' }))

    expect(await screen.findByText('Invalid email or password')).toBeDefined()
  })

  test('stores session and navigates to dashboard after successful login', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        access_token: 'token-123',
        user: {
          id: 'user-1',
          full_name: 'Faculty User',
          email: 'faculty@libmatch.dev',
          role: 'faculty',
        },
      },
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'faculty@libmatch.dev' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'libmatch123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in as Faculty' }))

    expect(await screen.findByText('Dashboard loaded')).toBeDefined()
    expect(setSession).toHaveBeenCalledWith('token-123', expect.objectContaining({
      email: 'faculty@libmatch.dev',
    }))
  })
})