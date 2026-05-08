import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../api/client.js'
import SkeletonBlock from '../components/atoms/SkeletonBlock.jsx'
import SyllabusCardSkeleton from '../components/molecules/SyllabusCardSkeleton.jsx'
import NavBar from '../components/NavBar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SyllabusCard from '../components/SyllabusCard.jsx'
import UploadModal from '../components/UploadModal.jsx'
import { clearSession, getStoredUser } from '../lib/authSession.js'

const loadingSyllabusKeys = [
  'loading-syllabus-1',
  'loading-syllabus-2',
  'loading-syllabus-3',
  'loading-syllabus-4',
]

function DashboardPage() {
  const navigate = useNavigate()

  const user = useMemo(() => getStoredUser(), [])
  const [courses, setCourses] = useState([])
  const [syllabi, setSyllabi] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedCourseIds, setSearchedCourseIds] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const trimmedSearchQuery = searchQuery.trim()
  const hasActiveSearchQuery = trimmedSearchQuery.length >= 2
  const isGalleryLoading = isLoading || (hasActiveSearchQuery && isSearchLoading)

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

  useEffect(() => {
    if (!hasActiveSearchQuery) {
      return undefined
    }

    let isCurrentSearch = true

    const searchTimer = window.setTimeout(async () => {
      try {
        const response = await apiClient.get('/courses/search', {
          params: { q: trimmedSearchQuery },
        })

        if (!isCurrentSearch) {
          return
        }

        const nextCourseIds = new Set(
          Array.isArray(response.data) ? response.data.map((course) => course.id) : [],
        )
        setSearchedCourseIds(nextCourseIds)
        setErrorMessage('')
      } catch (error) {
        if (!isCurrentSearch) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Search failed. Please try again.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Search failed. Check if backend API is running.')
        }
        setSearchedCourseIds(new Set())
      } finally {
        if (isCurrentSearch) {
          setIsSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      isCurrentSearch = false
      window.clearTimeout(searchTimer)
    }
  }, [hasActiveSearchQuery, trimmedSearchQuery])

  const filteredSyllabi = useMemo(() => {
    return syllabi.filter((row) => {
      if (
        hasActiveSearchQuery &&
        searchedCourseIds !== null &&
        !searchedCourseIds.has(row.course_id)
      ) {
        return false
      }

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      if (!matchesStatus) {
        return false
      }

      return true
    })
  }, [hasActiveSearchQuery, searchedCourseIds, statusFilter, syllabi])

  function handleSearchQueryChange(nextSearchQuery) {
    setSearchQuery(nextSearchQuery)

    if (nextSearchQuery.trim().length < 2) {
      setSearchedCourseIds(null)
      setIsSearchLoading(false)
      return
    }

    setIsSearchLoading(true)
  }

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
    <div className="min-h-screen bg-background">
      <NavBar user={user} onSignOut={handleSignOut} />

      <main className="mx-auto w-full max-w-[1200px] px-px32 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
        <header className="mb-px24">
          <h1 className="text-heading-lg font-bold tracking-[-0.625px] text-text-primary">
            Syllabus Gallery
          </h1>
          <p className="mt-px4 text-caption-light text-text-secondary">
            Match syllabus topics to specific chapters
          </p>
        </header>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchQueryChange}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
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
          <p className="mt-px16 rounded-standard border border-border bg-background px-px12 py-px8 text-caption font-medium text-text-secondary">
            {infoMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-px16 rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-px32">
          <div className="mb-px12 flex items-center justify-between">
            {isGalleryLoading ? (
              <SkeletonBlock className="h-px12 w-[60px]" />
            ) : trimmedSearchQuery ? (
              <p className="text-caption text-text-secondary">
                {filteredSyllabi.length} result{filteredSyllabi.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>

          {isGalleryLoading ? (
            <div className="grid grid-cols-1 gap-px24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loadingSyllabusKeys.map((skeletonKey) => (
                <SyllabusCardSkeleton key={skeletonKey} />
              ))}
            </div>
          ) : filteredSyllabi.length > 0 ? (
            <div className="grid grid-cols-1 gap-px24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSyllabi.map((syllabus) => (
                <SyllabusCard
                  key={syllabus.id}
                  syllabus={syllabus}
                  onContinueMatching={() => {
                    navigate(`/syllabi/${syllabus.id}/topics`)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-large border border-border bg-surface p-px24 shadow-card">
              <p className="text-body-semibold font-semibold text-text-primary">
                {trimmedSearchQuery ? 'No syllabi match your search.' : 'No syllabus uploads yet.'}
              </p>
              <p className="mt-px8 text-caption-light text-text-secondary">
                {trimmedSearchQuery
                  ? 'Try a different keyword or clear the search.'
                  : 'Click Upload Syllabus to add your first PDF or DOCX file.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default DashboardPage