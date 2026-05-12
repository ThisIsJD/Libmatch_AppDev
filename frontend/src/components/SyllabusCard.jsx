import { useEffect, useRef, useState } from 'react'

import SyllabusEditModal from './SyllabusEditModal.jsx'
import SyllabusViewerModal from './SyllabusViewerModal.jsx'
import StatusBadge from './StatusBadge.jsx'

function GraduationCapIcon() {
  return (
    <svg className="h-[20px] w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m22 10-10-5-10 5 10 5 10-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 12v5c3.4 2 8.6 2 12 0v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 10v6" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  )
}

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

function SyllabusCard({ syllabus, onContinueMatching, onSyllabusDeleted, isHighlighted = false }) {
  const [cardDetails, setCardDetails] = useState(() => ({
    fileName: syllabus.file_name ?? '',
    courseTitle: syllabus.course?.course_title ?? syllabus.file_name,
    courseCode: syllabus.course?.course_code ?? 'Course code unavailable',
  }))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const menuRef = useRef(null)
  const displaySyllabus = {
    ...syllabus,
    file_name: cardDetails.fileName,
    course: {
      ...syllabus.course,
      course_title: cardDetails.courseTitle,
      course_code: cardDetails.courseCode,
    },
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function handleDocumentMouseDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  return (
    <article
      className={`rounded-comfortable border bg-surface p-px24 shadow-card transition-all duration-200 hover:border-[rgba(0,0,0,0.15)] hover:shadow-deep ${
        isHighlighted
          ? 'border-primary ring-2 ring-[rgba(0,117,222,0.25)]'
          : 'border-border'
      }`}
      data-testid={`syllabus-card-${syllabus.id}`}
      data-highlighted={isHighlighted ? 'true' : 'false'}
    >
      <div className="flex items-start justify-between gap-px12">
        <div className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-standard bg-background-alt text-text-secondary">
          <GraduationCapIcon />
        </div>

        <div className="flex items-start gap-px4">
          {isHighlighted ? (
            <span
              className="inline-flex items-center rounded-pill border border-primary/20 bg-badge-blue-bg px-px8 py-px4 text-micro font-semibold uppercase tracking-[0.4px] text-primary"
              data-testid={`new-upload-badge-${syllabus.id}`}
            >
              New upload
            </span>
          ) : null}
          <StatusBadge status={syllabus.status} />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={`Open actions for ${cardDetails.courseTitle}`}
              className="inline-flex h-px32 w-px32 items-center justify-center rounded-micro text-text-muted transition-colors duration-150 hover:bg-[rgba(0,0,0,0.05)] hover:text-text-secondary active:scale-[0.95]"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <svg className="h-[20px] w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.75h.01M12 12h.01M12 17.25h.01" />
              </svg>
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-full z-30 mt-px4 w-[168px] rounded-standard border border-border bg-surface py-px4 shadow-deep">
                <button
                  type="button"
                  className="flex w-full items-center gap-px8 px-px12 py-px8 text-left text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsViewerOpen(true)
                  }}
                >
                  <svg className="h-px16 w-px16 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.5L19 9.5V19a2 2 0 0 1-2 2z" />
                  </svg>
                  View Syllabus
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-px8 px-px12 py-px8 text-left text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsEditOpen(true)
                  }}
                >
                  <svg className="h-px16 w-px16 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m16.862 4.487 1.688-1.688a1.875 1.875 0 1 1 2.652 2.652L8.75 17.903 4.5 19.5l1.597-4.25L16.862 4.487z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-px8 px-px12 py-px8 text-left text-caption font-medium text-text-primary transition-colors duration-150 hover:bg-background-alt"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="h-px16 w-px16 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h10v10M17 7 7 17" />
                  </svg>
                  Export
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <h2 className="mt-px12 line-clamp-2 min-h-[48px] text-body-semibold font-semibold text-text-primary">
        {cardDetails.courseTitle}
      </h2>
      <p className="mt-px4 truncate text-caption-light text-text-secondary">{cardDetails.courseCode}</p>

      <div className="mt-px12 flex items-center justify-between gap-px12 text-micro text-text-muted">
        <span>Uploaded {formatUploadDate(syllabus.upload_date)}</span>
        <span className="shrink-0 font-medium text-text-secondary">- Topics</span>
      </div>

      <div className="mt-px12 h-px4 overflow-hidden rounded-pill bg-background-alt">
        <div className="h-full w-0 rounded-pill bg-background-alt" />
      </div>

      <button
        type="button"
        className="mt-px16 inline-flex w-full items-center justify-center gap-px8 rounded-standard bg-primary px-px16 py-[10px] text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active"
        onClick={() => onContinueMatching(syllabus)}
      >
        <EyeIcon />
        Continue Matching
      </button>

      {isViewerOpen ? (
        <SyllabusViewerModal
          isOpen={isViewerOpen}
          syllabus={displaySyllabus}
          onDelete={onSyllabusDeleted}
          onClose={() => setIsViewerOpen(false)}
        />
      ) : null}
      {isEditOpen ? (
        <SyllabusEditModal
          isOpen={isEditOpen}
          syllabus={displaySyllabus}
          onSave={(nextDetails) => {
            setCardDetails(nextDetails)
            setIsEditOpen(false)
          }}
          onClose={() => setIsEditOpen(false)}
        />
      ) : null}
    </article>
  )
}

export default SyllabusCard