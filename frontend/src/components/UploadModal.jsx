import axios from 'axios'
import { useEffect, useState } from 'react'

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

function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (!selectedFile) {
      setErrorMessage('Please choose a PDF or DOCX file to upload.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
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
      <div className="w-full max-w-[480px] rounded-large border border-border bg-surface p-px24 shadow-deep">
        <div className="flex items-start justify-between gap-px12">
          <div>
            <h3 id="upload-modal-title" className="text-body-semibold font-bold text-text-primary">
              Upload New Syllabus
            </h3>
            <p className="mt-px4 text-caption-light text-text-secondary">
              Upload a PDF or DOCX file. Course info is automatically extracted.
            </p>
          </div>

          <button
            type="button"
            className="rounded-standard border border-border bg-background px-px12 py-px4 text-caption font-medium text-text-secondary transition-colors duration-150 hover:bg-background-alt"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close upload modal"
          >
            Close
          </button>
        </div>

        <form className="mt-px24 space-y-px16" onSubmit={handleSubmit}>
          <div className="relative cursor-pointer overflow-hidden rounded-large border-[1.5px] border-dashed border-border bg-background-alt px-px32 py-px48 text-center transition-all duration-150 hover:border-primary hover:bg-badge-blue-bg">
            <div className="mx-auto mb-px16 flex h-[40px] w-[40px] items-center justify-center rounded-circle bg-[#e8f4ff] text-primary">
              <svg className="h-px24 w-px24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <p className="text-body-semibold font-semibold text-text-primary">Choose Syllabus File</p>
            <p className="mt-px4 text-caption-light text-text-muted">Upload PDF or Word document</p>

            <input
              type="file"
              accept={ACCEPTED_FILE_INPUT}
              onChange={handleFileChange}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              disabled={isSubmitting}
            />
          </div>

          {selectedFile ? (
            <div className="rounded-standard border border-border bg-background-alt px-px12 py-px8 text-caption font-medium text-text-secondary">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-standard bg-background-alt px-px12 py-px12">
            <p className="text-caption font-semibold text-text-primary">Syllabus Upload Tips:</p>
            <ul className="mt-px8 list-disc space-y-px4 pl-px16 text-[13px] font-normal leading-[1.6] text-text-secondary">
              <li>Course details are extracted automatically from the file</li>
              <li>Include clear course objectives and topics</li>
              <li>Supported formats: PDF, DOCX</li>
              <li>Max file size: 10MB</li>
              <li>Ensure text is readable for AI processing</li>
            </ul>
          </div>

          <div className="flex flex-col-reverse gap-px8 pt-px8 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-micro border border-border bg-background px-px16 py-[10px] text-nav-button font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-micro bg-primary px-px16 py-[10px] text-nav-button font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!selectedFile || isSubmitting}
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