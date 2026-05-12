import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

import NavBar from '../NavBar.jsx'
import { clearSession, getStoredUser } from '../../lib/authSession.js'

const directorTabs = [
  { label: 'Analytics', to: '/director' },
  { label: 'Syllabi', to: '/director/syllabi' },
  { label: 'Users', to: '/director/users' },
]

function DirectorLayout() {
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])

  function handleSignOut() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} onSignOut={handleSignOut} subtitle="Director Dashboard" />

      <main className="mx-auto w-full max-w-[1200px] px-px32 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
        <nav className="mb-px24 flex gap-px8 rounded-large border border-border bg-surface p-px8 shadow-card">
          {directorTabs.map((tabItem) => (
            <NavLink
              key={tabItem.to}
              to={tabItem.to}
              end={tabItem.to === '/director'}
              className={({ isActive }) => {
                const activeClass = isActive
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-background-alt'
                return `rounded-micro px-px12 py-px8 text-caption font-semibold transition-colors ${activeClass}`
              }}
            >
              {tabItem.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
    </div>
  )
}

export default DirectorLayout
