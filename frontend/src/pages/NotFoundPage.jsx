import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import NavBar from '../components/NavBar.jsx'
import { clearSession, getStoredUser } from '../lib/authSession.js'

function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const storedUser = useMemo(() => getStoredUser(), [])
  const isDirector = storedUser?.role === 'director'
  const primaryDestination = isDirector ? '/director' : '/'
  const primaryActionLabel = isDirector ? 'Go to Director Dashboard' : 'Go to Dashboard'

  function handleSignOut() {
    clearSession()
    navigate('/login', { replace: true })
  }

  function handleGoHome() {
    navigate(primaryDestination, { replace: true })
  }

  function handleGoBack() {
    navigate(-1)
  }

  function handleGoToLogin() {
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background-alt">
      {storedUser ? <NavBar user={storedUser} onSignOut={handleSignOut} /> : null}

      <main className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[1200px] items-center justify-center px-px16 py-px32">
        <section className="w-full max-w-[680px] rounded-large border border-border bg-surface p-px32 text-center shadow-card">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-text-muted">404</p>
          <h1 className="mt-px8 text-heading-lg font-bold tracking-[-0.625px] text-text-primary">
            Page not found
          </h1>
          <p className="mt-px12 text-body text-text-secondary">
            The page you are looking for does not exist or has been moved.
          </p>
          <p className="mt-px8 text-caption-light text-text-muted">
            Requested path: <span className="font-medium text-text-secondary">{location.pathname}</span>
          </p>

          <div className="mt-px24 flex flex-col items-center justify-center gap-px10 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-micro bg-primary px-px24 py-px12 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active"
              onClick={handleGoHome}
            >
              {primaryActionLabel}
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px24 py-px12 text-nav-button font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt"
              onClick={handleGoBack}
            >
              Go back
            </button>

            {!storedUser ? (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-micro border border-border bg-surface px-px24 py-px12 text-nav-button font-semibold text-text-secondary transition-colors duration-150 hover:bg-background-alt"
                onClick={handleGoToLogin}
              >
                Back to Login
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default NotFoundPage
