import libmatchLogo from '../assets/LibmatchLogo.png'

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
        <div className="flex items-center gap-px12">
          <img
            src={libmatchLogo}
            alt="LibMatch logo"
            className="h-[40px] w-[40px] object-contain"
          />
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