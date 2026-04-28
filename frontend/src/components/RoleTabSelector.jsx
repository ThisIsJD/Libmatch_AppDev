const ROLE_TABS = [
  {
    key: 'faculty',
    label: 'Faculty',
    enabled: true,
  },
  {
    key: 'cataloger',
    label: 'Cataloger',
    enabled: false,
  },
  {
    key: 'librarian',
    label: 'Librarian',
    enabled: false,
  },
]

function RoleTabSelector({ activeRole = 'faculty', onBlockedRoleSelect }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-pill border border-border bg-background-alt p-1">
      {ROLE_TABS.map((role) => {
        const isActive = role.key === activeRole
        const isBlocked = !role.enabled

        return (
          <button
            key={role.key}
            type="button"
            className={[
              'rounded-pill px-4 py-1.5 text-badge transition-colors duration-150',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent text-text-secondary hover:text-text-primary',
              isBlocked ? 'cursor-not-allowed opacity-70' : '',
            ].join(' ')}
            onClick={() => {
              if (isBlocked && onBlockedRoleSelect) {
                onBlockedRoleSelect(role.label)
              }
            }}
            aria-disabled={isBlocked}
          >
            {role.label}
          </button>
        )
      })}
    </div>
  )
}

export default RoleTabSelector