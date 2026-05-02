import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { apiClient } from '../api/client.js'
import RoleTabSelector from '../components/RoleTabSelector.jsx'
import { getAccessToken, setSession } from '../lib/authSession.js'

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl) {
    return 'http://localhost:8000'
  }
  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const apiBaseUrl = useMemo(
    () => normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
    [],
  )
  const redirectTo = location.state?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')
    setSuccessMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password,
      })

      const payload = response.data
      setSession(payload.access_token, payload.user)

      setSuccessMessage(
        `Welcome back, ${payload.user.full_name}. Login is complete and your session token is stored.`,
      )
      setPassword('')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const detail =
          typeof error.response.data?.detail === 'string'
            ? error.response.data.detail
            : 'Unable to sign in. Please verify your credentials.'
        setErrorMessage(detail)
      } else {
        setErrorMessage(
          'Cannot reach the backend server. Check if FastAPI is running on your configured API URL.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background-alt px-px16 py-px32 lg:flex lg:items-center lg:justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-circle bg-badge-blue-bg opacity-80 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-circle bg-success-bg opacity-70 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[900px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep lg:flex-row">
        {/* Left Side: Brand Panel §4.10 */}
        <section className="flex w-full flex-col justify-between bg-primary p-px48 text-white lg:w-[45%]">
          <div>
            <div className="flex items-center gap-px8">
              <svg className="h-px32 w-px32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-[22px] font-bold">LibMatch</span>
            </div>
            
            <h1 className="mt-px32 text-heading-lg font-bold leading-[1.23] tracking-[-0.625px]">
              Hello, welcome back!
            </h1>
            <p className="mt-px16 text-body font-normal leading-[1.50] text-white/85">
              LibMatch keeps syllabus matching focused, consistent, and fast. Sign in to your faculty workspace.
            </p>
          </div>

          <p className="mt-px48 text-caption font-normal text-white/65">
            Universidad de Nueva Caceres
          </p>
        </section>

        {/* Right Side: Form Panel §4.10 */}
        <section className="w-full bg-surface p-px48 lg:w-[55%]">
          <p className="text-caption text-text-secondary">Account Access</p>
          <h2 className="mt-px8 text-heading-md font-bold tracking-[-0.25px] text-text-primary">Sign in to continue</h2>

          <div className="mt-px24">
            <RoleTabSelector
              activeRole="faculty"
              onBlockedRoleSelect={(roleLabel) => {
                setInfoMessage(
                  `${roleLabel} login is a placeholder for Capstone and is not active in AppDev.`,
                )
              }}
            />
          </div>

          <form className="mt-px24 space-y-px16" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-px4 block text-caption font-medium text-text-primary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="faculty@libmatch.dev"
                autoComplete="email"
                className="w-full rounded-micro border border-border bg-background px-px12 py-px8 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
              />
            </label>

            <label className="block">
              <span className="mb-px4 block text-caption font-medium text-text-primary">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-micro border border-border bg-background px-px12 py-px8 text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-micro bg-primary px-px24 py-px12 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in as Faculty'}
            </button>
          </form>

          <div className="mt-px16 space-y-px8">
            {errorMessage ? (
              <p className="rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
                {errorMessage}
              </p>
            ) : null}

            {infoMessage ? (
              <p className="rounded-standard border border-border bg-background-alt px-px12 py-px8 text-caption font-medium text-text-secondary">
                {infoMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-standard border border-success/25 bg-success-bg px-px12 py-px8 text-caption font-medium text-success">
                {successMessage}
              </p>
            ) : null}

            <p className="text-micro text-text-muted">API target: {apiBaseUrl}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage