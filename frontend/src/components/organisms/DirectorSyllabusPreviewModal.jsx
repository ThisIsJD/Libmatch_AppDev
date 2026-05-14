import axios from 'axios'
import { useEffect, useRef, useState } from 'react'

import { apiClient } from '../../api/client.js'
import SkeletonBlock from '../atoms/SkeletonBlock.jsx'

function formatUploadDate(rawDate) {
  const parsedDate = new Date(rawDate)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate)
}

function DirectorSyllabusPreviewModal({ isOpen, syllabusItem, onClose }) {
  const objectUrlRef = useRef(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen || !syllabusItem?.id) {
      return undefined
    }

    let isMounted = true

    async function loadSyllabusPreview() {
      setIsLoading(true)
      setErrorMessage('')

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPdfPreviewUrl('')

      if (syllabusItem.file_type !== 'pdf') {
        setIsLoading(false)
        return
      }

      try {
        const response = await apiClient.get(`/analytics/director/syllabi/${syllabusItem.id}/file`, {
          responseType: 'blob',
        })
        if (!isMounted) {
          return
        }

        const nextObjectUrl = URL.createObjectURL(response.data)
        objectUrlRef.current = nextObjectUrl
        setPdfPreviewUrl(nextObjectUrl)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          setErrorMessage('PDF preview could not be loaded.')
        } else {
          setErrorMessage('PDF preview could not be loaded. Check backend connectivity and try again.')
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
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, syllabusItem?.file_type, syllabusItem?.id])

  if (!isOpen || !syllabusItem) {
    return null
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-px16"
      onMouseDown={handleBackdropMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="director-syllabus-preview-title"
      data-testid="director-syllabus-preview-backdrop"
    >
      <div className="flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep">
        <div className="flex items-start justify-between gap-px16 border-b border-border px-px24 py-px16">
          <div className="min-w-0">
            <h2
              id="director-syllabus-preview-title"
              className="truncate text-body-semibold font-bold text-text-primary"
            >
              {syllabusItem.file_name}
            </h2>
            <div className="mt-px8 flex flex-wrap gap-px8">
              <span className="rounded-pill bg-background-alt px-px12 py-px4 text-micro font-medium text-text-secondary">
                {syllabusItem.course_code ?? 'Course code unavailable'}
              </span>
              <span className="rounded-pill bg-background-alt px-px12 py-px4 text-micro font-medium text-text-secondary">
                Uploaded {formatUploadDate(syllabusItem.upload_date)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-px32 w-px32 shrink-0 items-center justify-center rounded-micro text-text-muted transition-colors duration-150 hover:bg-background-alt hover:text-text-secondary"
            onClick={onClose}
            aria-label="Close director syllabus preview"
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
              aria-label="Loading director syllabus preview"
              data-testid="director-syllabus-preview-skeleton"
              className="rounded-standard border border-border bg-background-alt p-px16"
            >
              <div className="space-y-px8">
                <SkeletonBlock className="h-px16 w-[92%]" />
                <SkeletonBlock className="h-px16 w-full" />
                <SkeletonBlock className="h-px16 w-[88%]" />
                <SkeletonBlock className="h-px16 w-[95%]" />
              </div>
            </div>
          ) : errorMessage ? (
            <p className="rounded-standard border border-warning/25 bg-warning-bg p-px16 text-caption-light leading-[1.6] text-warning">
              {errorMessage}
            </p>
          ) : syllabusItem.file_type !== 'pdf' ? (
            <p className="rounded-standard border border-border bg-background-alt p-px16 text-caption-light leading-[1.6] text-text-secondary">
              PDF preview is available only for uploaded PDF files.
            </p>
          ) : pdfPreviewUrl ? (
            <iframe
              title="Director syllabus PDF preview"
              src={pdfPreviewUrl}
              className="h-[60vh] w-full rounded-standard border border-border bg-background"
              data-testid="director-pdf-preview-iframe"
            />
          ) : (
            <p className="rounded-standard border border-border bg-background-alt p-px16 text-caption-light leading-[1.6] text-text-secondary">
              PDF preview is not available right now.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DirectorSyllabusPreviewModal
