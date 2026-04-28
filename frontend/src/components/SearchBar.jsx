function SearchBar({
  value,
  onChange,
  onUploadClick,
  syllabusCount,
  courseCount,
}) {
  return (
    <section className="rounded-large border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-heading-md text-text-primary">Syllabus Dashboard</h2>
          <p className="mt-1 text-caption-light text-text-secondary">
            Track uploaded syllabi, review pending work, and prepare matching workflows.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-micro bg-primary px-5 py-2.5 text-nav-button text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active"
          onClick={onUploadClick}
        >
          Upload Syllabus
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="block">
          <span className="mb-1.5 block text-caption font-medium text-text-secondary">Search</span>
          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search by file name, course code, or title"
            className="w-full rounded-standard border border-border bg-background px-3 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:border-focus focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
          />
        </label>

        <div className="flex items-center gap-2 text-caption text-text-secondary lg:pt-6">
          <span className="rounded-pill bg-background-alt px-3 py-1">
            {syllabusCount} syllabi
          </span>
          <span className="rounded-pill bg-background-alt px-3 py-1">
            {courseCount} courses
          </span>
        </div>
      </div>
    </section>
  )
}

export default SearchBar