const FILTER_OPTIONS = [
  { value: 'all', label: 'All Syllabi' },
  { value: 'confirmed', label: 'Complete' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
]

function SearchBar({ value, onChange, onUploadClick, filterValue, onFilterChange }) {
  return (
    <section className="flex flex-col gap-px12 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block w-full lg:max-w-[480px] lg:flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-px12 text-text-muted">
          <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search syllabi..."
          className="w-full rounded-micro border border-border bg-background py-[10px] pl-[36px] pr-[14px] text-body text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
        />
      </label>

      <div className="flex flex-col gap-px8 sm:flex-row sm:items-center sm:justify-end">
        <label className="relative inline-flex items-center text-caption font-medium text-text-primary">
          <span className="pointer-events-none absolute left-px12 text-text-secondary">
            <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 4h18l-7 8v5l-4 3v-8L3 4z" />
            </svg>
          </span>
          <select
            aria-label="Filter syllabi"
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            className="h-[40px] appearance-none rounded-micro border border-border bg-background py-px8 pl-[36px] pr-px32 text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-px12 text-text-muted">
            <svg className="h-[14px] w-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </label>

        <button
          type="button"
          className="inline-flex h-[40px] items-center justify-center gap-px8 rounded-micro bg-primary px-px16 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active"
          onClick={onUploadClick}
        >
          <svg className="h-[14px] w-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
          </svg>
          Add Syllabus
        </button>
      </div>
    </section>
  )
}

export default SearchBar