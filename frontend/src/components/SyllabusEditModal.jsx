import { useEffect, useState } from 'react'

function SyllabusEditModal({ isOpen, syllabus, onSave, onClose }) {
  const [fileName, setFileName] = useState(() => syllabus?.file_name ?? '')
  const [courseTitle, setCourseTitle] = useState(() => syllabus?.course?.course_title ?? '')
  const [courseCode, setCourseCode] = useState(() => syllabus?.course?.course_code ?? '')

  useEffect(() => {
    if (!isOpen || !syllabus) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, syllabus])

  if (!isOpen || !syllabus) {
    return null
  }

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-px16"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="syllabus-edit-title"
    >
      <div className="w-full max-w-[520px] rounded-large border border-border bg-surface p-px24 shadow-deep">
        <div className="flex items-start justify-between gap-px16">
          <div className="flex items-center gap-px8">
            <svg className="h-px16 w-px16 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m16.862 4.487 1.688-1.688a1.875 1.875 0 1 1 2.652 2.652L8.75 17.903 4.5 19.5l1.597-4.25L16.862 4.487z" />
            </svg>
            <h2 id="syllabus-edit-title" className="text-body-semibold font-bold text-text-primary">
              Edit Syllabus
            </h2>
          </div>

          <button
            type="button"
            className="inline-flex h-px32 w-px32 shrink-0 items-center justify-center rounded-micro text-text-muted transition-colors duration-150 hover:bg-background-alt hover:text-text-secondary"
            onClick={onClose}
            aria-label="Close edit syllabus modal"
          >
            <svg className="h-[20px] w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form
          className="mt-px24 space-y-px16"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({
              fileName: fileName.trim(),
              courseTitle: courseTitle.trim(),
              courseCode: courseCode.trim(),
            })
          }}
        >
          <label className="block">
            <span className="mb-px4 block text-caption font-medium text-text-primary">File Name</span>
            <input
              type="text"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              className="w-full rounded-micro border border-border bg-background px-px12 py-px8 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
            />
          </label>

          <label className="block">
            <span className="mb-px4 block text-caption font-medium text-text-primary">Card Title</span>
            <input
              type="text"
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
              className="w-full rounded-micro border border-border bg-background px-px12 py-px8 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
            />
          </label>

          <label className="block">
            <span className="mb-px4 block text-caption font-medium text-text-primary">Course Code</span>
            <input
              type="text"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              className="w-full rounded-micro border border-border bg-background px-px12 py-px8 text-body text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
            />
          </label>

          <p className="rounded-standard border border-border bg-background-alt px-px12 py-px8 text-caption-light text-text-secondary">
            These edits update the card for this session. Persistent saving requires backend update support.
          </p>

          <div className="flex flex-col-reverse gap-px8 pt-px8 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px16 py-px8 text-nav-button font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt active:scale-[0.97]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-micro bg-primary px-px16 py-px8 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!courseTitle.trim() || !courseCode.trim() || !fileName.trim()}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SyllabusEditModal