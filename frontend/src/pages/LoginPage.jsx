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
    <main className="relative isolate min-h-screen overflow-hidden bg-background-alt px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-circle bg-badge-blue-bg opacity-80 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-circle bg-success-bg opacity-70 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-large border border-border bg-surface px-6 py-7 shadow-card sm:px-8 sm:py-10">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Universidad de Nueva Caceres
          </p>
          <h1 className="mt-4 max-w-lg text-heading-lg text-text-primary sm:text-display sm:leading-[1.03] sm:tracking-[-1.1px]">
            LibMatch keeps syllabus matching focused, consistent, and fast.
          </h1>
          <p className="mt-4 max-w-xl text-body text-text-secondary sm:text-body-lg sm:font-medium">
            Sign in as Faculty to upload syllabi, review topic suggestions, and keep your
            course indexing flow organized in one workspace.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="rounded-comfortable border border-border bg-background p-4">
              <p className="text-micro uppercase tracking-[0.12em] text-text-muted">Upload</p>
              <p className="mt-1 text-body-medium text-text-primary">PDF and DOCX support</p>
            </article>
            <article className="rounded-comfortable border border-border bg-background p-4">
              <p className="text-micro uppercase tracking-[0.12em] text-text-muted">Extract</p>
              <p className="mt-1 text-body-medium text-text-primary">Raw text + NLP topics</p>
            </article>
            <article className="rounded-comfortable border border-border bg-background p-4">
              <p className="text-micro uppercase tracking-[0.12em] text-text-muted">Search</p>
              <p className="mt-1 text-body-medium text-text-primary">Sub-5 second lookup</p>
            </article>
          </div>
        </section>

        <section className="rounded-large border border-border bg-surface p-6 shadow-card sm:p-8">
          <p className="text-caption text-text-secondary">Account Access</p>
          <h2 className="mt-2 text-heading-md text-text-primary">Sign in to continue</h2>

          <div className="mt-5">
            <RoleTabSelector
              activeRole="faculty"
              onBlockedRoleSelect={(roleLabel) => {
                setInfoMessage(
                  `${roleLabel} login is a placeholder for Capstone and is not active in AppDev.`,
                )
              }}
            />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="faculty@libmatch.dev"
                autoComplete="email"
                className="w-full rounded-standard border border-border bg-background px-3 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:border-focus focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-text-secondary">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-standard border border-border bg-background px-3 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:border-focus focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-micro bg-primary px-5 py-2.5 text-nav-button text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in as Faculty'}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {errorMessage ? (
              <p className="rounded-standard border border-warning/25 bg-warning-bg px-3 py-2 text-caption text-warning">
                {errorMessage}
              </p>
            ) : null}

            {infoMessage ? (
              <p className="rounded-standard border border-border bg-background-alt px-3 py-2 text-caption text-text-secondary">
                {infoMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-standard border border-success/25 bg-success-bg px-3 py-2 text-caption text-success">
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