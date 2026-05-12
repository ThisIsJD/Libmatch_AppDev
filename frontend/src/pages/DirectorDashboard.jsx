import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../api/client.js'
import SkeletonBlock from '../components/atoms/SkeletonBlock.jsx'
import NavBar from '../components/NavBar.jsx'
import { clearSession, getStoredUser } from '../lib/authSession.js'

function normalizeFrequencyItems(payload) {
  if (!payload || !Array.isArray(payload.items)) {
    return []
  }

  return payload.items.map((item) => ({
    topic_text: item.topic_text,
    count: Number(item.count) || 0,
  }))
}

function DirectorDashboard() {
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])
  const [departments, setDepartments] = useState([])
  const [courseLevels, setCourseLevels] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('')
  const [frequencyItems, setFrequencyItems] = useState([])
  const [isFiltersLoading, setIsFiltersLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    async function loadFilters() {
      setIsFiltersLoading(true)
      setErrorMessage('')

      try {
        const response = await apiClient.get('/analytics/filters')
        if (!isCurrentRequest) {
          return
        }

        setDepartments(Array.isArray(response.data?.departments) ? response.data.departments : [])
        setCourseLevels(
          Array.isArray(response.data?.course_levels) ? response.data.course_levels : [],
        )
      } catch (error) {
        if (!isCurrentRequest) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Failed to load analytics filters.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Failed to load analytics filters. Check backend connectivity.')
        }
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
    let isCurrentRequest = true

    async function loadTopicFrequency() {
      setIsChartLoading(true)
      setErrorMessage('')

      try {
        const response = await apiClient.get('/analytics/topics/frequency', {
          params: {
            department: selectedDepartment,
            course_level: selectedCourseLevel,
            limit: 20,
          },
        })

        if (!isCurrentRequest) {
          return
        }

        setFrequencyItems(normalizeFrequencyItems(response.data))
      } catch (error) {
        if (!isCurrentRequest) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Failed to load topic analytics.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Failed to load topic analytics. Check backend connectivity.')
        }
        setFrequencyItems([])
      } finally {
        if (isCurrentRequest) {
          setIsChartLoading(false)
        }
      }
    }

    loadTopicFrequency()

    return () => {
      isCurrentRequest = false
    }
  }, [selectedCourseLevel, selectedDepartment])

  function handleSignOut() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} onSignOut={handleSignOut} subtitle="Director Dashboard" />

      <main className="mx-auto w-full max-w-[1200px] px-px32 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
        <header className="mb-px24 flex flex-col gap-px8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-heading-lg font-bold tracking-[-0.625px] text-text-primary">
              Topic Frequency Analytics
            </h1>
            <p className="mt-px4 text-caption-light text-text-secondary">
              Confirmed topics across uploaded syllabi
            </p>
          </div>
          <div className="rounded-standard border border-border bg-surface px-px12 py-px8 text-caption font-medium text-text-secondary">
            Top 20 confirmed topics
          </div>
        </header>

        <section className="mb-px24 grid grid-cols-1 gap-px12 rounded-large border border-border bg-surface p-px16 shadow-card md:grid-cols-2">
          <label className="block text-caption font-semibold text-text-primary">
            Department
            <select
              aria-label="Department"
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
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
            Course Level
            <select
              aria-label="Course Level"
              value={selectedCourseLevel}
              onChange={(event) => setSelectedCourseLevel(event.target.value)}
              className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
              disabled={isFiltersLoading}
            >
              <option value="">All Levels</option>
              {courseLevels.map((courseLevel) => (
                <option key={courseLevel} value={courseLevel}>
                  {courseLevel}
                </option>
              ))}
            </select>
          </label>
        </section>

        {errorMessage ? (
          <p className="mb-px16 rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
            {errorMessage}
          </p>
        ) : null}

        <section className="rounded-large border border-border bg-surface p-px24 shadow-card">
          {isChartLoading ? (
            <div className="space-y-px12" aria-label="Loading analytics">
              <SkeletonBlock className="h-px12 w-[180px]" />
              <SkeletonBlock className="h-[320px] w-full" />
            </div>
          ) : frequencyItems.length === 0 ? (
            <div className="rounded-standard border border-border bg-background-alt px-px16 py-px32 text-center">
              <p className="text-body-semibold font-semibold text-text-primary">
                No confirmed topics yet.
              </p>
              <p className="mt-px8 text-caption-light text-text-secondary">
                Confirmed faculty topics will appear here after review.
              </p>
            </div>
          ) : (
            <div className="h-[360px] min-w-0" aria-label="Topic frequency chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={frequencyItems}
                  layout="vertical"
                  margin={{ top: 8, right: 24, bottom: 8, left: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="topic_text" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0075de" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default DirectorDashboard
