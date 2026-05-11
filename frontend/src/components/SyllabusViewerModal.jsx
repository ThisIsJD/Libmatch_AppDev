import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
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

function SyllabusViewerModal({ isOpen, syllabus, onClose, onDelete }) {
  const navigate = useNavigate()
  const objectUrlRef = useRef(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen || !syllabus?.id) {
      return undefined
    }

    let isMounted = true

    async function loadSyllabusPreview() {
      setIsLoading(true)
      setErrorMessage('')
      setDeleteErrorMessage('')
      setIsDeleteConfirming(false)

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setPdfPreviewUrl('')

      if (syllabus.file_type !== 'pdf') {
        setIsLoading(false)
        return
      }

      try {
        const response = await apiClient.get(`/syllabi/${syllabus.id}/file`, {
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
  }, [isOpen, onClose, syllabus?.file_type, syllabus?.id])

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

  function handleDeleteRequest() {
    setDeleteErrorMessage('')
    setIsDeleteConfirming(true)
  }

  async function handleConfirmDelete() {
    if (!syllabus?.id || isDeleting) {
      return
    }

    setIsDeleting(true)
    setDeleteErrorMessage('')

    try {
      await apiClient.delete(`/syllabi/${syllabus.id}`)
      if (typeof onDelete === 'function') {
        onDelete(syllabus.id)
      }
      onClose()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setDeleteErrorMessage('Delete failed. Please try again.')
      } else {
        setDeleteErrorMessage('Delete failed. Check backend connectivity and try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-px16"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="syllabus-viewer-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep">
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
          ) : errorMessage ? (
            <p className="rounded-standard border border-warning/25 bg-warning-bg p-px16 text-caption-light leading-[1.6] text-warning">
              {errorMessage}
            </p>
          ) : syllabus.file_type !== 'pdf' ? (
            <p className="rounded-standard border border-border bg-background-alt p-px16 text-caption-light leading-[1.6] text-text-secondary">
              PDF preview is available only for uploaded PDF files. Use Open in Review for topic matching and extracted content.
            </p>
          ) : pdfPreviewUrl ? (
            <iframe
              title="Syllabus PDF preview"
              src={pdfPreviewUrl}
              className="h-[60vh] w-full rounded-standard border border-border bg-background"
              data-testid="syllabus-pdf-viewer"
            />
          ) : (
            <p className="rounded-standard border border-border bg-background-alt p-px16 text-caption-light leading-[1.6] text-text-secondary">
              PDF preview is not available right now.
            </p>
          )}
        </div>

        <div className="border-t border-border px-px24 py-px16">
          {deleteErrorMessage ? (
            <p className="mb-px8 rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
              {deleteErrorMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-px8 sm:flex-row sm:items-center sm:justify-between">
            {isDeleteConfirming ? (
              <div className="flex flex-col gap-px8 sm:flex-row sm:items-center">
                <p className="text-caption font-medium text-text-secondary">Delete this syllabus permanently?</p>
                <div className="flex gap-px8">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px12 py-px8 text-caption font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => setIsDeleteConfirming(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-micro border border-warning/40 bg-warning-bg px-px12 py-px8 text-caption font-semibold text-warning transition-colors duration-150 hover:bg-warning-bg disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    data-testid="confirm-delete-syllabus"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-micro border border-warning/40 bg-warning-bg px-px16 py-px8 text-nav-button font-semibold text-warning transition-colors duration-150 hover:bg-warning-bg"
                onClick={handleDeleteRequest}
                data-testid="delete-syllabus-button"
              >
                Delete Syllabus
              </button>
            )}

            <div className="flex flex-col-reverse gap-px8 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px16 py-px8 text-nav-button font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={onClose}
                disabled={isDeleting}
              >
                Close
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-micro bg-primary px-px16 py-px8 text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleOpenReview}
                disabled={isDeleting || isDeleteConfirming}
              >
                Open in Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyllabusViewerModal