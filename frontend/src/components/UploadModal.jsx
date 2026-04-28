import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../api/client.js'

const ACCEPTED_FILE_INPUT = '.pdf,.docx'
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx'])

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function UploadModal({ isOpen, courses, onClose, onUploadSuccess }) {
  const [selectedCourseId, setSelectedCourseId] = useState(() => courses[0]?.id ?? '')
  const [selectedFile, setSelectedFile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasCourses = useMemo(() => courses.length > 0, [courses])
  const activeCourseId = selectedCourseId || courses[0]?.id || ''

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) {
    return null
  }

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null
    if (!nextFile) {
      setSelectedFile(null)
      return
    }

    const extension = nextFile.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setSelectedFile(null)
      setErrorMessage('Only PDF and DOCX files are supported.')
      event.target.value = ''
      return
    }

    setErrorMessage('')
    setSelectedFile(nextFile)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!hasCourses || !activeCourseId) {
      setErrorMessage('Please select a course before uploading.')
      return
    }

    if (!selectedFile) {
      setErrorMessage('Please choose a PDF or DOCX file to upload.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('course_id', activeCourseId)
      formData.append('file', selectedFile)

      const response = await apiClient.post('/syllabi/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (typeof onUploadSuccess === 'function') {
        await onUploadSuccess(response.data)
      }

      setSelectedFile(null)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const detail =
          typeof error.response.data?.detail === 'string'
            ? error.response.data.detail
            : 'Upload failed. Please try again.'
        setErrorMessage(detail)
      } else {
        setErrorMessage('Upload failed. Check backend connectivity and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-overlay p-4"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-2xl rounded-large border border-border bg-surface p-6 shadow-deep">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="upload-modal-title" className="text-heading-md text-text-primary">
              Upload Syllabus
            </h3>
            <p className="mt-1 text-caption-light text-text-secondary">
              Upload one PDF or DOCX file and attach it to an existing course.
            </p>
          </div>

          <button
            type="button"
            className="rounded-standard border border-border bg-background px-2.5 py-1 text-caption text-text-secondary transition-colors duration-150 hover:bg-background-alt"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close upload modal"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-caption font-medium text-text-secondary">Course</span>
            <select
              value={activeCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full rounded-standard border border-border bg-background px-3 py-2.5 text-body text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-badge-blue-bg"
              disabled={!hasCourses || isSubmitting}
            >
              {hasCourses ? null : <option value="">No courses available</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-caption font-medium text-text-secondary">Syllabus File</span>
            <input
              type="file"
              accept={ACCEPTED_FILE_INPUT}
              onChange={handleFileChange}
              className="block w-full rounded-standard border border-border bg-background px-3 py-2.5 text-caption text-text-primary file:mr-3 file:rounded-micro file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-caption file:font-medium file:text-white hover:file:bg-primary-hover"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-micro text-text-muted">Accepted formats: PDF, DOCX.</p>
          </label>

          {selectedFile ? (
            <div className="rounded-standard border border-border bg-background-alt px-3 py-2 text-caption text-text-secondary">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          ) : null}

          {!hasCourses ? (
            <div className="rounded-standard border border-warning/25 bg-warning-bg px-3 py-2 text-caption text-warning">
              Add at least one course first before uploading a syllabus.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-standard border border-warning/25 bg-warning-bg px-3 py-2 text-caption text-warning">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-standard border border-border bg-background px-4 py-2.5 text-nav-button text-text-primary transition-colors duration-150 hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-standard bg-primary px-4 py-2.5 text-nav-button text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!hasCourses || !activeCourseId || !selectedFile || isSubmitting}
            >
              {isSubmitting ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadModal