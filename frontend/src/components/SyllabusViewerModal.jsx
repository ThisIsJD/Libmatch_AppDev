import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../api/client.js'
import SkeletonBlock from './atoms/SkeletonBlock.jsx'

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

function SyllabusViewerModal({ isOpen, syllabus, onClose }) {
  const navigate = useNavigate()
  const [rawText, setRawText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen || !syllabus?.id) {
      return undefined
    }

    let isMounted = true

    async function loadSyllabusPreview() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await apiClient.get(`/syllabi/${syllabus.id}`)
        if (!isMounted) {
          return
        }

        setRawText(typeof response.data?.raw_text === 'string' ? response.data.raw_text : '')
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          setErrorMessage('Preview could not be loaded.')
        } else {
          setErrorMessage('Preview could not be loaded. Check backend connectivity and try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSyllabusPreview()

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      isMounted = false
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, syllabus?.id])

  if (!isOpen || !syllabus) {
    return null
  }

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function handleOpenReview() {
    onClose()
    navigate(`/syllabi/${syllabus.id}/topics`)
  }

  const previewText = rawText || 'Preview not available yet. Use Open in Review to view extracted syllabus content and topics.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-px16"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="syllabus-viewer-title"
    >
      <div className="flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep">
        <div className="flex items-start justify-between gap-px16 border-b border-border px-px24 py-px16">
          <div className="min-w-0">
            <div className="flex items-center gap-px8 text-text-secondary">
              <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.5L19 9.5V19a2 2 0 0 1-2 2z" />
              </svg>
              <h2 id="syllabus-viewer-title" className="truncate text-body-semibold font-bold text-text-primary">
                {syllabus.file_name}
              </h2>
            </div>
            <div className="mt-px8 flex flex-wrap gap-px8">
              <span className="rounded-pill bg-background-alt px-px12 py-px4 text-micro font-medium text-text-secondary">
                {syllabus.course?.course_code ?? 'Course code unavailable'}
              </span>
              <span className="rounded-pill bg-background-alt px-px12 py-px4 text-micro font-medium text-text-secondary">
                Uploaded {formatUploadDate(syllabus.upload_date)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-px32 w-px32 shrink-0 items-center justify-center rounded-micro text-text-muted transition-colors duration-150 hover:bg-background-alt hover:text-text-secondary"
            onClick={onClose}
            aria-label="Close syllabus preview"
          >
            <svg className="h-[20px] w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-px24">
          {isLoading ? (
            <div
              role="status"
              aria-label="Loading syllabus preview"
              data-testid="syllabus-preview-skeleton"
              className="rounded-standard border border-border bg-background-alt p-px16"
            >
              <div className="space-y-px8">
                <SkeletonBlock className="h-px16 w-[92%]" />
                <SkeletonBlock className="h-px16 w-full" />
                <SkeletonBlock className="h-px16 w-[88%]" />
                <SkeletonBlock className="h-px16 w-[95%]" />
                <SkeletonBlock className="h-px16 w-[76%]" />
                <SkeletonBlock className="h-px16 w-[84%]" />
              </div>
            </div>
          ) : (
            <pre className="max-h-[52vh] whitespace-pre-wrap rounded-standard border border-border bg-background-alt p-px16 font-sans text-caption-light leading-[1.6] text-text-secondary">
              {errorMessage || previewText}
            </pre>
          )}
        </div>

        <div className="flex flex-col-reverse gap-px8 border-t border-border px-px24 py-px16 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px16 py-px8 text-nav-button font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt active:scale-[0.97]"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-micro bg-primary px-px16 py-px8 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active"
            onClick={handleOpenReview}
          >
            Open in Review
          </button>
        </div>
      </div>
    </div>
  )
}

export default SyllabusViewerModal