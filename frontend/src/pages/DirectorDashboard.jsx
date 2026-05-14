import axios from 'axios'
import { useEffect, useState } from 'react'

import { apiClient } from '../api/client.js'
import ComingSoonCard from '../components/atoms/ComingSoonCard.jsx'
import SkeletonBlock from '../components/atoms/SkeletonBlock.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

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
  const [departments, setDepartments] = useState([])
  const [courseLevels, setCourseLevels] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('')
  const [visibleTopicLimit, setVisibleTopicLimit] = useState(10)
  const [topicSearchQuery, setTopicSearchQuery] = useState('')
  const [frequencyItems, setFrequencyItems] = useState([])
  const [departmentStats, setDepartmentStats] = useState([])
  const [isFiltersLoading, setIsFiltersLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(true)
  const [isDepartmentStatsLoading, setIsDepartmentStatsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [drillDownItems, setDrillDownItems] = useState([])
  const [isDrillLoading, setIsDrillLoading] = useState(false)
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

    async function loadDepartmentStats() {
      setIsDepartmentStatsLoading(true)

      try {
        const response = await apiClient.get('/analytics/director/departments/upload-stats')
        if (!isCurrentRequest) {
          return
        }

        setDepartmentStats(Array.isArray(response.data) ? response.data : [])
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setDepartmentStats([])
      } finally {
        if (isCurrentRequest) {
          setIsDepartmentStatsLoading(false)
        }
      }
    }

    loadDepartmentStats()

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
            limit: visibleTopicLimit,
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
  }, [selectedCourseLevel, selectedDepartment, visibleTopicLimit])

  useEffect(() => {
    if (!selectedTopic) {
      return undefined
    }

    let isCurrentRequest = true

    async function loadTopicDrillDown() {
      setIsDrillLoading(true)

      try {
        const response = await apiClient.get('/analytics/director/topics/courses', {
          params: { topic_text: selectedTopic },
        })

        if (!isCurrentRequest) {
          return
        }

        setDrillDownItems(Array.isArray(response.data) ? response.data : [])
      } catch {
        if (!isCurrentRequest) {
          return
        }

        setDrillDownItems([])
      } finally {
        if (isCurrentRequest) {
          setIsDrillLoading(false)
        }
      }
    }

    loadTopicDrillDown()

    return () => {
      isCurrentRequest = false
    }
  }, [selectedTopic])

  function openTopicDrillDown(topicText) {
    if (!topicText) {
      return
    }

    setSelectedTopic(topicText)
  }

  function closeTopicDrillDown() {
    setSelectedTopic(null)
    setDrillDownItems([])
    setIsDrillLoading(false)
  }

  const normalizedSearchQuery = topicSearchQuery.trim().toLowerCase()
  const filteredFrequencyItems = frequencyItems.filter((frequencyItem) =>
    frequencyItem.topic_text.toLowerCase().includes(normalizedSearchQuery),
  )

  return (
    <section>
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
          Top {visibleTopicLimit} confirmed topics
        </div>
      </header>

      <section className="mb-px24 rounded-large border border-border bg-surface p-px16 shadow-card">
        <h2 className="text-caption font-semibold text-text-primary">Department Upload Activity</h2>

        {isDepartmentStatsLoading ? (
          <div className="mt-px12 space-y-px8" aria-label="Loading department upload stats">
            <SkeletonBlock className="h-px10 w-[160px]" />
            <SkeletonBlock className="h-px10 w-[220px]" />
          </div>
        ) : departmentStats.length > 0 ? (
          <div className="mt-px12 grid grid-cols-1 gap-px8 md:grid-cols-2">
            {departmentStats.map((statItem) => (
              <div
                key={statItem.department}
                className="flex items-center justify-between rounded-standard bg-background-alt px-px12 py-px8"
              >
                <span className="text-caption font-medium text-text-primary">{statItem.department}</span>
                <span className="rounded-pill bg-badge-blue-bg px-px8 py-px4 text-caption font-semibold text-primary">
                  {statItem.syllabus_count} uploads
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-px12 text-caption-light text-text-secondary">
            No department upload activity available yet.
          </p>
        )}
      </section>

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
        <div className="mb-px16 grid grid-cols-1 gap-px12 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-end">
          <label className="block text-caption font-semibold text-text-primary">
            Topic Limit
            <select
              aria-label="Topic Limit"
              value={String(visibleTopicLimit)}
              onChange={(event) => setVisibleTopicLimit(Number(event.target.value) || 10)}
              className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
              disabled={isChartLoading}
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </label>

          <label className="block text-caption font-semibold text-text-primary">
            Filter Topics
            <input
              aria-label="Filter Topics"
              type="text"
              value={topicSearchQuery}
              onChange={(event) => setTopicSearchQuery(event.target.value)}
              placeholder="Filter topics"
              className="mt-px8 h-[40px] w-full rounded-micro border border-border bg-background px-px12 text-caption font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgba(0,117,222,0.15)]"
              disabled={isChartLoading || frequencyItems.length === 0}
            />
          </label>

          <p className="text-caption-light text-text-secondary">
            Showing {filteredFrequencyItems.length} of {frequencyItems.length} topics
          </p>
        </div>

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
        ) : filteredFrequencyItems.length === 0 ? (
          <div className="rounded-standard border border-border bg-background-alt px-px16 py-px24 text-center">
            <p className="text-body-semibold font-semibold text-text-primary">No topics match your filter.</p>
            <p className="mt-px8 text-caption-light text-text-secondary">
              Clear the topic filter to see all confirmed topics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" aria-label="Topic frequency table">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-micro uppercase tracking-[0.125px] text-text-muted">
                  <th className="w-[64px] py-px8 pr-px8">Rank</th>
                  <th className="py-px8 pr-px8">Topic</th>
                  <th className="w-[100px] py-px8 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredFrequencyItems.map((frequencyItem, rowIndex) => {
                  return (
                    <tr
                      key={frequencyItem.topic_text}
                      className="border-b border-border text-caption text-text-primary"
                    >
                      <td className="py-px10 pr-px8 text-text-secondary">{rowIndex + 1}</td>
                      <td className="py-px10 pr-px8">
                        <button
                          type="button"
                          className="text-left font-medium text-primary hover:underline"
                          onClick={() => openTopicDrillDown(frequencyItem.topic_text)}
                          aria-label={`View courses for ${frequencyItem.topic_text}`}
                        >
                          {frequencyItem.topic_text}
                        </button>
                      </td>
                      <td className="py-px10 text-right font-semibold">{frequencyItem.count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-px24 grid grid-cols-1 gap-px12 rounded-large border border-border bg-surface p-px16 shadow-card md:grid-cols-2">
        <ComingSoonCard title="Essential Resources" />
        <ComingSoonCard title="Resource Utilization by Source Type" />
        <ComingSoonCard title="Semester Trend Analysis" />
        <ComingSoonCard title="Content Provider Sync Status" />
      </section>

      {selectedTopic ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-px16"
          onClick={closeTopicDrillDown}
          data-testid="topic-modal-backdrop"
        >
          <div
            className="max-h-[90vh] w-full max-w-[760px] overflow-auto rounded-large border border-border bg-surface p-px24 shadow-deep"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-px16 flex items-start justify-between gap-px12">
              <div>
                <h2 className="text-heading-md font-bold text-text-primary">
                  Courses with “{selectedTopic}”
                </h2>
                <p className="mt-px4 text-caption-light text-text-secondary">
                  Courses where this topic is already confirmed.
                </p>
              </div>

              <button
                type="button"
                className="rounded-micro border border-border bg-background px-px12 py-px4 text-caption font-medium text-text-primary"
                onClick={closeTopicDrillDown}
              >
                Close
              </button>
            </div>

            {isDrillLoading ? (
              <div className="space-y-px8" aria-label="Loading topic drill-down">
                <SkeletonBlock className="h-px12 w-[220px]" />
                <SkeletonBlock className="h-px48 w-full" />
                <SkeletonBlock className="h-px48 w-full" />
              </div>
            ) : drillDownItems.length === 0 ? (
              <div className="rounded-standard border border-border bg-background-alt px-px16 py-px16 text-caption-light text-text-secondary">
                No courses found for this topic.
              </div>
            ) : (
              <div className="space-y-px8">
                {drillDownItems.map((drillDownItem) => (
                  <article
                    key={`${drillDownItem.course_id}-${drillDownItem.syllabus_id}`}
                    className="rounded-standard border border-border bg-background px-px12 py-px12"
                  >
                    <div className="flex items-start justify-between gap-px12">
                      <div>
                        <p className="text-caption font-semibold text-text-primary">
                          {drillDownItem.course_code}
                        </p>
                        <p className="text-caption-light text-text-secondary">
                          {drillDownItem.course_title}
                        </p>
                        <p className="mt-px4 text-micro text-text-muted">
                          {drillDownItem.department ?? 'No Department'}
                        </p>
                      </div>
                      <StatusBadge status="confirmed" />
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-px16">
              <ComingSoonCard title="Matched Resources" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default DirectorDashboard
