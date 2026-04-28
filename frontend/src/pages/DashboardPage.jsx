import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../api/client.js'
import NavBar from '../components/NavBar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SyllabusCard from '../components/SyllabusCard.jsx'
import UploadModal from '../components/UploadModal.jsx'
import { clearSession, getStoredUser } from '../lib/authSession.js'

function DashboardPage() {
  const navigate = useNavigate()

  const user = useMemo(() => getStoredUser(), [])
  const [courses, setCourses] = useState([])
  const [syllabi, setSyllabi] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [coursesResponse, syllabiResponse] = await Promise.all([
          apiClient.get('/courses'),
          apiClient.get('/syllabi'),
        ])

        if (!isMounted) {
          return
        }

        setCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data : [])
        setSyllabi(Array.isArray(syllabiResponse.data) ? syllabiResponse.data : [])
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Failed to load dashboard data.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Failed to load dashboard data. Check if backend API is running.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredSyllabi = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) {
      return syllabi
    }

    return syllabi.filter((row) => {
      const haystack = [row.file_name, row.course?.course_code, row.course?.course_title]
      return haystack.some(
        (value) => typeof value === 'string' && value.toLowerCase().includes(needle),
      )
    })
  }, [searchQuery, syllabi])

  const coursePreview = useMemo(() => courses.slice(0, 6), [courses])

  function handleSignOut() {
    clearSession()
    navigate('/login', { replace: true })
  }

  async function handleUploadSuccess() {
    try {
      const syllabiResponse = await apiClient.get('/syllabi')
      setSyllabi(Array.isArray(syllabiResponse.data) ? syllabiResponse.data : [])
      setErrorMessage('')
      setInfoMessage('Syllabus uploaded and processed successfully.')
      setIsUploadModalOpen(false)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const detail =
          typeof error.response.data?.detail === 'string'
            ? error.response.data.detail
            : 'Upload succeeded but failed to refresh syllabi list.'
        setErrorMessage(detail)
      } else {
        setErrorMessage('Upload succeeded but failed to refresh syllabi list.')
      }
      setIsUploadModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <NavBar user={user} onSignOut={handleSignOut} />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          syllabusCount={syllabi.length}
          courseCount={courses.length}
          onUploadClick={() => {
            setInfoMessage('')
            setIsUploadModalOpen(true)
          }}
        />

        {isUploadModalOpen ? (
          <UploadModal
            isOpen={isUploadModalOpen}
            courses={courses}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        ) : null}

        {infoMessage ? (
          <p className="mt-4 rounded-standard border border-border bg-background px-3 py-2 text-caption text-text-secondary">
            {infoMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-standard border border-warning/25 bg-warning-bg px-3 py-2 text-caption text-warning">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-6 rounded-large border border-border bg-surface p-5 shadow-card sm:p-6">
          <h3 className="text-body-semibold text-text-primary">Active Courses</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {coursePreview.length > 0 ? (
              coursePreview.map((course) => (
                <span
                  key={course.id}
                  className="rounded-pill border border-border bg-background-alt px-3 py-1 text-caption text-text-secondary"
                >
                  {course.course_code} - {course.course_title}
                </span>
              ))
            ) : (
              <p className="text-caption-light text-text-secondary">No courses found yet.</p>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-heading-md text-text-primary">Recent Syllabi</h3>
            {searchQuery.trim() ? (
              <p className="text-caption text-text-secondary">
                {filteredSyllabi.length} result{filteredSyllabi.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="rounded-large border border-border bg-surface p-6 text-caption text-text-secondary shadow-card">
              Loading dashboard data...
            </div>
          ) : filteredSyllabi.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSyllabi.map((syllabus) => (
                <SyllabusCard
                  key={syllabus.id}
                  syllabus={syllabus}
                  onContinueMatching={() => {
                    setInfoMessage('Topic review routing will be connected in Phase 5.')
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-large border border-border bg-surface p-6 shadow-card">
              <p className="text-body-semibold text-text-primary">No syllabus uploads yet.</p>
              <p className="mt-1 text-caption-light text-text-secondary">
                Click Upload Syllabus to add your first PDF or DOCX file in Phase 4.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default DashboardPage