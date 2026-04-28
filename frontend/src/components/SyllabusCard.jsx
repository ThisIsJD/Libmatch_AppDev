import StatusBadge from './StatusBadge.jsx'

function formatUploadDate(rawDate) {
  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

function SyllabusCard({ syllabus, onContinueMatching }) {
  return (
    <article className="rounded-comfortable border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-semibold text-text-primary">{syllabus.file_name}</p>
          <p className="mt-1 text-caption-light text-text-secondary">
            {syllabus.course?.course_code} - {syllabus.course?.course_title}
          </p>
        </div>
        <StatusBadge status={syllabus.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-pill border border-border bg-background-alt px-2.5 py-1 text-micro uppercase tracking-[0.08em] text-text-secondary">
          {syllabus.file_type}
        </span>
        <span className="rounded-pill border border-border bg-background-alt px-2.5 py-1 text-micro text-text-secondary">
          Uploaded {formatUploadDate(syllabus.upload_date)}
        </span>
      </div>

      <button
        type="button"
        className="mt-5 inline-flex w-full items-center justify-center rounded-standard bg-primary px-4 py-2.5 text-nav-button text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active"
        onClick={() => onContinueMatching(syllabus)}
      >
        Continue Matching
      </button>
    </article>
  )
}

export default SyllabusCard