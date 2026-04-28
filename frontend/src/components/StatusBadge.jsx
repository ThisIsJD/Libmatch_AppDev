const STATUS_LABELS = {
  pending: 'Pending',
  processed: 'Processed',
  confirmed: 'Confirmed',
}

const STATUS_STYLES = {
  pending: 'bg-warning-bg text-warning',
  processed: 'bg-badge-blue-bg text-badge-blue-text',
  confirmed: 'bg-success-bg text-success',
}

function StatusBadge({ status }) {
  const normalized = typeof status === 'string' ? status.toLowerCase() : 'pending'
  const label = STATUS_LABELS[normalized] ?? 'Pending'
  const styleClass = STATUS_STYLES[normalized] ?? STATUS_STYLES.pending

  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-badge tracking-[0.08em] ${styleClass}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge