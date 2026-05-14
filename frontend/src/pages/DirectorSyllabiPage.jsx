import axios from 'axios'
import { useEffect, useState } from 'react'

import { apiClient } from '../api/client.js'
import SkeletonBlock from '../components/atoms/SkeletonBlock.jsx'
import DirectorSyllabusPreviewModal from '../components/organisms/DirectorSyllabusPreviewModal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

function formatDate(value) {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return '--'
  }

  return parsedDate.toLocaleDateString()
}

function DirectorSyllabiPage() {
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [semesterInput, setSemesterInput] = useState('')
  const [debouncedSemester, setDebouncedSemester] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [syllabiItems, setSyllabiItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [coverageItems, setCoverageItems] = useState([])
  const [isFiltersLoading, setIsFiltersLoading] = useState(true)
  const [isSyllabiLoading, setIsSyllabiLoading] = useState(true)
  const [isCoverageLoading, setIsCoverageLoading] = useState(true)
  const [previewSyllabusItem, setPreviewSyllabusItem] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSemester(semesterInput.trim())
    }, 300)

    return () => {
      window.clearTimeout(debounceTimer)
    }
  }, [semesterInput])

  useEffect(() => {
    let isCurrentRequest = true

    async function loadFilters() {
      setIsFiltersLoading(true)

      try {
        const response = await apiClient.get('/analytics/filters')
        if (!isCurrentRequest) {
          return
        }

        setDepartments(Array.isArray(response.data?.departments) ? response.data.departments : [])
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setDepartments([])
      } finally {
        if (isCurrentRequest) {
          setIsFiltersLoading(false)
        }
      }
    }

    loadFilters()

    return () => {
      isCurrentRequest = false
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDepartment, debouncedSemester, selectedStatus])

  useEffect(() => {
    let isCurrentRequest = true

    async function loadSyllabi() {
      setIsSyllabiLoading(true)
      setErrorMessage('')

      try {
        const response = await apiClient.get('/analytics/director/syllabi', {
          params: {
            department: selectedDepartment,
            semester: debouncedSemester,
            status: selectedStatus,
            page: currentPage,
            page_size: 50,
          },
        })

        if (!isCurrentRequest) {
          return
        }

        const nextItems = Array.isArray(response.data?.items) ? response.data.items : []
        const nextTotal = Number(response.data?.total) || 0

        setTotalItems(nextTotal)
        setSyllabiItems((existingItems) => {
          if (currentPage === 1) {
            return nextItems
          }

          return [...existingItems, ...nextItems]
        })
      } catch (error) {
        if (!isCurrentRequest) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Failed to load director syllabi.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Failed to load director syllabi. Check backend connectivity.')
        }

        if (currentPage === 1) {
          setSyllabiItems([])
          setTotalItems(0)
        }
      } finally {
        if (isCurrentRequest) {
          setIsSyllabiLoading(false)
        }
      }
    }

    loadSyllabi()

    return () => {
      isCurrentRequest = false
    }
  }, [currentPage, debouncedSemester, selectedDepartment, selectedStatus])

  useEffect(() => {
    let isCurrentRequest = true

    async function loadCoverage() {
      setIsCoverageLoading(true)

      try {
        const response = await apiClient.get('/analytics/director/syllabi/coverage')
        if (!isCurrentRequest) {
          return
        }

        const items = Array.isArray(response.data?.items) ? response.data.items : []
        setCoverageItems(items)
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setCoverageItems([])
      } finally {
        if (isCurrentRequest) {
          setIsCoverageLoading(false)
        }
      }
    }

    loadCoverage()

    return () => {
      isCurrentRequest = false
    }
  }, [])

  const uncoveredCourses = coverageItems.filter((coverageItem) => coverageItem.syllabus_count === 0)
  const canLoadMore = syllabiItems.length < totalItems

  return (
    <section>
      <header className="mb-px24">
        <h1 className="text-heading-lg font-bold tracking-[-0.625px] text-text-primary">
          System Syllabi Oversight
        </h1>
        <p className="mt-px4 text-caption-light text-text-secondary">
          View and filter all uploaded syllabi across departments.
        </p>
      </header>

      <section className="mb-px24 grid grid-cols-1 gap-px12 rounded-large border border-border bg-surface p-px16 shadow-card md:grid-cols-3">
        <label className="block text-caption font-semibold text-text-primary">
          Department
          <select
            aria-label="Department Filter"
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary"
            disabled={isFiltersLoading}
          >
            <option value="">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-caption font-semibold text-text-primary">
          Semester
          <input
            aria-label="Semester Filter"
            type="text"
            value={semesterInput}
            onChange={(event) => setSemesterInput(event.target.value)}
            className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary"
            placeholder="e.g. 1st Sem"
          />
        </label>

        <label className="block text-caption font-semibold text-text-primary">
          Status
          <select
            aria-label="Status Filter"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </label>
      </section>

      {errorMessage ? (
        <p className="mb-px16 rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
          {errorMessage}
        </p>
      ) : null}

      <section className="mb-px24 rounded-large border border-border bg-surface p-px16 shadow-card">
        {isSyllabiLoading ? (
          <div className="space-y-px8" aria-label="Loading director syllabi">
            <SkeletonBlock className="h-px12 w-[220px]" />
            <SkeletonBlock className="h-px48 w-full" />
            <SkeletonBlock className="h-px48 w-full" />
          </div>
        ) : syllabiItems.length === 0 ? (
          <p className="text-caption-light text-text-secondary">No syllabi found for the selected filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-micro uppercase tracking-[0.125px] text-text-muted">
                    <th className="py-px8 pr-px8">File Name</th>
                    <th className="py-px8 pr-px8">Course</th>
                    <th className="py-px8 pr-px8">Department</th>
                    <th className="py-px8 pr-px8">Status</th>
                    <th className="py-px8 pr-px8">Upload Date</th>
                    <th className="py-px8 pr-px8">Uploaded By</th>
                    <th className="py-px8">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {syllabiItems.map((syllabusItem) => (
                    <tr key={syllabusItem.id} className="border-b border-border text-caption text-text-primary">
                      <td className="py-px10 pr-px8">{syllabusItem.file_name}</td>
                      <td className="py-px10 pr-px8">
                        <p className="font-semibold">{syllabusItem.course_code}</p>
                        <p className="text-caption-light text-text-secondary">{syllabusItem.course_title}</p>
                      </td>
                      <td className="py-px10 pr-px8">{syllabusItem.department ?? '--'}</td>
                      <td className="py-px10 pr-px8">
                        <StatusBadge status={syllabusItem.status} />
                      </td>
                      <td className="py-px10 pr-px8">{formatDate(syllabusItem.upload_date)}</td>
                      <td className="py-px10 pr-px8">{syllabusItem.uploaded_by_name}</td>
                      <td className="py-px10">
                        <button
                          type="button"
                          className="rounded-micro border border-border bg-background px-px10 py-px6 text-caption font-semibold text-text-primary transition-colors duration-150 hover:bg-background-alt"
                          onClick={() => setPreviewSyllabusItem(syllabusItem)}
                          aria-label={`Preview ${syllabusItem.file_name}`}
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canLoadMore ? (
              <button
                type="button"
                className="mt-px12 rounded-micro border border-border bg-background px-px12 py-px8 text-caption font-semibold text-text-primary"
                onClick={() => setCurrentPage((previousPage) => previousPage + 1)}
              >
                Load more
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="rounded-large border border-border bg-surface p-px16 shadow-card">
        <h2 className="text-caption font-semibold text-text-primary">Courses Without Syllabi</h2>

        {isCoverageLoading ? (
          <div className="mt-px12 space-y-px8" aria-label="Loading syllabi coverage">
            <SkeletonBlock className="h-px12 w-[200px]" />
            <SkeletonBlock className="h-px40 w-full" />
          </div>
        ) : uncoveredCourses.length === 0 ? (
          <p className="mt-px8 text-caption-light text-text-secondary">All listed courses currently have at least one syllabus.</p>
        ) : (
          <div className="mt-px12 space-y-px8">
            {uncoveredCourses.map((coverageItem) => (
              <article
                key={coverageItem.course_id}
                className="flex items-center justify-between rounded-standard border border-border bg-background px-px12 py-px10"
              >
                <div>
                  <p className="text-caption font-semibold text-text-primary">{coverageItem.course_code}</p>
                  <p className="text-caption-light text-text-secondary">{coverageItem.course_title}</p>
                </div>
                <span className="rounded-pill bg-warning-bg px-px8 py-px4 text-caption font-semibold text-warning">
                  Missing
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <DirectorSyllabusPreviewModal
        isOpen={Boolean(previewSyllabusItem)}
        syllabusItem={previewSyllabusItem}
        onClose={() => setPreviewSyllabusItem(null)}
      />
    </section>
  )
}

export default DirectorSyllabiPage
