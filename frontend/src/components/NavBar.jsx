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
      <div className="mx-auto flex h-px56 w-full max-w-[1200px] items-center justify-between px-px32">
        <div className="flex items-center gap-px8">
          <div className="inline-flex h-px32 w-px32 items-center justify-center rounded-standard bg-[#c0392b] text-sm font-bold text-white transition-colors hover:bg-primary">
            <svg className="h-px20 w-px20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-bold text-text-primary">LibMatch</p>
            <p className="text-micro text-text-secondary">Faculty Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-px12">
          <div className="hidden text-right sm:block">
            <p className="text-caption font-medium text-text-primary">{user?.full_name ?? 'Faculty User'}</p>
            <p className="text-micro text-text-secondary">{user?.email ?? '-'}</p>
          </div>

          <div className="inline-flex h-px32 w-px32 items-center justify-center rounded-circle border border-border bg-background-alt text-caption font-semibold text-text-primary">
            {initials}
          </div>

          <button
            type="button"
            className="rounded-micro border border-border bg-background px-px12 py-px4 text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt active:scale-[0.97]"
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