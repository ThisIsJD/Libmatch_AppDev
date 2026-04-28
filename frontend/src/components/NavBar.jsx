function getInitials(name) {
  if (!name || typeof name !== 'string') {
    return 'LM'
  }

  const segments = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (segments.length === 0) {
    return 'LM'
  }

  return segments.map((part) => part[0].toUpperCase()).join('')
}

function NavBar({ user, onSignOut }) {
  const initials = getInitials(user?.full_name)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-standard bg-primary text-sm font-semibold text-white">
            L
          </div>
          <div>
            <p className="text-body-semibold text-text-primary">LibMatch</p>
            <p className="text-micro text-text-secondary">Faculty Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-caption font-medium text-text-primary">{user?.full_name ?? 'Faculty User'}</p>
            <p className="text-micro text-text-secondary">{user?.email ?? '-'}</p>
          </div>

          <div className="inline-flex h-8 w-8 items-center justify-center rounded-circle border border-border bg-background-alt text-caption font-semibold text-text-primary">
            {initials}
          </div>

          <button
            type="button"
            className="rounded-micro border border-border bg-background px-3 py-1.5 text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default NavBar