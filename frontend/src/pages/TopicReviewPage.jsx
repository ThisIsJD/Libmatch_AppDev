import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import NavBar from '../components/NavBar'
import SyllabusViewerModal from '../components/SyllabusViewerModal'
import TopicReviewSkeleton from '../components/templates/TopicReviewSkeleton'

function TopicMatchBadge({ isConfirmed }) {
  const label = isConfirmed ? 'Matched' : 'Pending'
  const styleClass = isConfirmed ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'

  return (
    <span className={`inline-flex items-center rounded-pill px-px12 py-px4 text-badge font-semibold tracking-[0.125px] ${styleClass}`}>
      {label}
    </span>
  )
}

function TopicListIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.5L19 9.5V19a2 2 0 0 1-2 2z" />
    </svg>
  )
}

function BookIcon({ className = 'h-px16 w-px16' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5c1.75 0 3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18c-1.75 0-3.33.48-4.5 1.25" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.75h.01M12 12h.01M12 17.25h.01" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75 10.5 18.75 19.5 5.25" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.25 3.75H6.75A2.25 2.25 0 0 0 4.5 6v15.75l7.5-4.5 7.5 4.5V6a2.25 2.25 0 0 0-2.25-2.25Z" />
    </svg>
  )
}

function ArrowUpTrayIcon() {
  return (
    <svg className="h-px16 w-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-12-9 3-3m0 0 3 3m-3-3V15" />
    </svg>
  )
}

const TopicReviewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [syllabus, setSyllabus] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(null)
  const [editingTopicIndex, setEditingTopicIndex] = useState(null)
  const [activeMenuIndex, setActiveMenuIndex] = useState(null)
  const [isRawTextOpen, setIsRawTextOpen] = useState(false)
  const storedUser = JSON.parse(localStorage.getItem('libmatch_user'))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [syllabusRes, topicsRes] = await Promise.all([
          apiClient.get(`/syllabi/${id}`),
          apiClient.get(`/syllabi/${id}/topics`)
        ])
        setSyllabus(syllabusRes.data)
        setTopics(topicsRes.data)
        setSelectedTopicIndex(topicsRes.data.length > 0 ? 0 : null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load syllabus data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddTopic = () => {
    const newTopic = {
      topic_text: 'New Topic',
      source: 'manual',
      keywords: [],
      is_confirmed: false
    }
    const newTopicIndex = topics.length
    setTopics([...topics, newTopic])
    setSelectedTopicIndex(newTopicIndex)
    setEditingTopicIndex(newTopicIndex)
  }

  const handleTopicChange = (index, newText) => {
    setTopics((currentTopics) => currentTopics.map((topic, topicIndex) => (
      topicIndex === index ? { ...topic, topic_text: newText } : topic
    )))
  }

  const handleRemoveTopic = (index) => {
    const updatedTopics = topics.filter((topic, topicIndex) => topicIndex !== index)
    setTopics(updatedTopics)
    setActiveMenuIndex(null)

    if (updatedTopics.length === 0) {
      setSelectedTopicIndex(null)
      setEditingTopicIndex(null)
      return
    }

    if (selectedTopicIndex === index) {
      setSelectedTopicIndex(Math.min(index, updatedTopics.length - 1))
    } else if (selectedTopicIndex > index) {
      setSelectedTopicIndex(selectedTopicIndex - 1)
    }

    if (editingTopicIndex === index) {
      setEditingTopicIndex(null)
    } else if (editingTopicIndex > index) {
      setEditingTopicIndex(editingTopicIndex - 1)
    }
  }

  const handleTopicInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  const handleConfirmAll = async () => {
    setSaving(true)
    try {
      const payload = topics.map((topic) => ({
        id: topic.id || null,
        topic_text: topic.topic_text,
        source: topic.source,
        keywords: (topic.keywords || []).map((keyword) => ({
          keyword_text: keyword.keyword_text,
          weight: keyword.weight
        }))
      }))
      await apiClient.put(`/syllabi/${id}/topics`, payload)
      navigate('/')
    } catch (err) {
      console.error('Error saving topics:', err)
      alert('Failed to save topics.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('libmatch_access_token')
    localStorage.removeItem('libmatch_user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-alt font-sans">
        <NavBar user={storedUser} onSignOut={handleSignOut} />

        <main className="mx-auto max-w-[1200px] px-px16 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
          <TopicReviewSkeleton />
        </main>
      </div>
    )
  }

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  const confirmedCount = topics.filter((topic) => topic.is_confirmed).length
  const progressPercent = topics.length > 0 ? Math.round((confirmedCount / topics.length) * 100) : 0
  const selectedTopic = selectedTopicIndex === null ? null : topics[selectedTopicIndex]

  return (
    <div className="min-h-screen bg-background-alt font-sans">
      <NavBar user={storedUser} onSignOut={handleSignOut} />
      
      <main className="mx-auto max-w-[1200px] px-px16 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
        {/* Breadcrumbs / Back */}
        <div className="mb-px16">
          <Link to="/" className="text-caption font-medium text-text-secondary transition-colors hover:text-primary">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-px24 flex flex-col gap-px16 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-heading-lg font-bold leading-[1.23] tracking-[-0.625px] text-text-primary">
              {syllabus?.course?.course_title || 'Syllabus Topic Review'}
            </h1>
            <p className="mt-px4 text-caption font-normal text-text-secondary">
              {syllabus?.course?.course_code} • {syllabus?.course?.semester}
            </p>
          </div>

          {/* Action Bar §4.8 */}
          <div className="flex flex-wrap items-center gap-px8">
            <button
              onClick={handleConfirmAll}
              disabled={saving}
              className="inline-flex items-center justify-center gap-px8 rounded-micro bg-primary px-px8 py-px8 text-nav-button font-semibold text-white shadow-card transition-all hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon />
              <span>{saving ? 'Saving...' : 'Accept All'}</span>
            </button>

            <div className="mx-px2 hidden h-px24 w-px2 rounded-pill bg-border sm:block" aria-hidden="true" />

            <button
              type="button"
              disabled
              title="Available in Capstone"
              className="inline-flex items-center justify-center gap-px8 rounded-micro border border-border bg-background px-px8 py-px8 text-nav-button font-semibold text-text-muted transition-colors duration-150 disabled:cursor-not-allowed"
            >
              <BookmarkIcon />
              <span>Cite Sources</span>
            </button>
            <button
              type="button"
              disabled
              title="Available in Capstone"
              className="inline-flex items-center justify-center gap-px8 rounded-micro border border-border bg-background px-px8 py-px8 text-nav-button font-semibold text-text-muted transition-colors duration-150 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Progress Bar §4.7 */}
        <div className="mb-px24 rounded-standard border border-border bg-surface p-px16 shadow-card">
          <div className="mb-px8 flex items-center justify-between gap-px16">
            <span className="text-caption font-medium text-text-secondary">
              Progress: {confirmedCount}/{topics.length} topics confirmed
            </span>
            <span className="text-caption font-semibold text-text-primary">{progressPercent}%</span>
          </div>
          <div className="h-[6px] overflow-hidden rounded-pill bg-background-alt">
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Split Panel Container §4.6 */}
        <div className="flex min-h-[640px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep lg:flex-row">
          
          {/* Left Panel: Syllabus Topics */}
          <div className="border-b border-border p-px24 lg:w-[42%] lg:border-b-0 lg:border-r">
            <div className="mb-px24 flex flex-col gap-px12 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-px8 text-text-secondary">
                <TopicListIcon />
                <h2 className="text-body-semibold font-semibold text-text-primary">Syllabus Topics</h2>
              </div>
              <div className="flex flex-wrap gap-px8">
                <button
                  type="button"
                  onClick={() => setIsRawTextOpen(true)}
                  className="inline-flex items-center gap-px4 rounded-micro border border-border bg-background px-px12 py-px8 text-micro font-semibold text-text-secondary transition-colors hover:bg-background-alt hover:text-text-primary"
                >
                  <DocumentIcon />
                  View Raw Text
                </button>
                <button 
                  onClick={handleAddTopic}
                  className="inline-flex items-center justify-center rounded-micro bg-primary px-px12 py-px8 text-micro font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  + Add Topic
                </button>
              </div>
            </div>

            <div className="max-h-[548px] space-y-px8 overflow-y-auto pr-px2">
              {topics.map((topic, topicIndex) => {
                const keywords = topic.keywords || []
                const keywordDescription = keywords.map((keyword) => keyword.keyword_text).filter(Boolean).join(', ')
                const isSelected = selectedTopicIndex === topicIndex
                const isEditing = editingTopicIndex === topicIndex

                return (
                  <div
                    key={`${topic.id ?? 'new'}-${topicIndex}`}
                    className={`relative rounded-standard border bg-surface p-px16 shadow-card transition-all duration-200 hover:border-[rgba(0,0,0,0.18)] ${isSelected ? 'border-primary bg-badge-blue-bg shadow-card' : 'border-border'} ${isSelected ? 'border-l-[3px]' : ''}`}
                    onClick={() => setSelectedTopicIndex(topicIndex)}
                  >
                    <div className="flex items-start justify-between gap-px12">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            className="w-full rounded-micro border border-focus bg-surface px-px8 py-px4 text-body-semibold font-semibold text-text-primary outline-none"
                            value={topic.topic_text}
                            onChange={(event) => handleTopicChange(topicIndex, event.target.value)}
                            onBlur={() => setEditingTopicIndex(null)}
                            onKeyDown={handleTopicInputKeyDown}
                            onClick={(event) => event.stopPropagation()}
                            autoFocus
                            placeholder="Topic title..."
                          />
                        ) : (
                          <button
                            type="button"
                            className="block max-w-full truncate text-left text-body-semibold font-semibold text-text-primary hover:text-primary"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedTopicIndex(topicIndex)
                              setEditingTopicIndex(topicIndex)
                            }}
                          >
                            {topic.topic_text || 'Untitled topic'}
                          </button>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-px8">
                        <TopicMatchBadge isConfirmed={topic.is_confirmed} />
                        <div className="relative">
                          <button
                            type="button"
                            className="inline-flex h-px32 w-px32 items-center justify-center rounded-micro text-text-muted transition-colors hover:bg-background-alt hover:text-text-secondary"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActiveMenuIndex(activeMenuIndex === topicIndex ? null : topicIndex)
                            }}
                            aria-label={`Open actions for ${topic.topic_text || 'topic'}`}
                          >
                            <MoreIcon />
                          </button>

                          {activeMenuIndex === topicIndex && (
                            <div className="absolute right-0 z-10 mt-px4 min-w-[128px] overflow-hidden rounded-standard border border-border bg-surface py-px4 shadow-card">
                              <button
                                type="button"
                                className="block w-full px-px12 py-px8 text-left text-caption-light text-text-secondary hover:bg-background-alt hover:text-text-primary"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setSelectedTopicIndex(topicIndex)
                                  setEditingTopicIndex(topicIndex)
                                  setActiveMenuIndex(null)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="block w-full px-px12 py-px8 text-left text-caption-light text-[#c0392b] hover:bg-background-alt"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleRemoveTopic(topicIndex)
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {keywordDescription && (
                      <p className="mt-px8 line-clamp-2 text-caption-light text-text-secondary">
                        {keywordDescription}
                      </p>
                    )}

                    {keywords.length > 0 && (
                      <div className="mt-px12 flex flex-wrap gap-px8">
                        {keywords.map((keyword, keywordIndex) => (
                          <span key={`${keyword.keyword_text}-${keywordIndex}`} className="rounded-micro bg-background-alt px-px8 py-[3px] text-micro text-text-secondary">
                            {keyword.keyword_text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {topics.length === 0 && (
                <div className="rounded-standard border border-dashed border-border bg-background-alt py-px48 text-center text-caption font-normal text-text-muted">
                  No topics identified yet. Click "+ Add Topic" to start.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Matched Chapters */}
          <div className="bg-surface p-px24 lg:w-[58%]">
            <div className="mb-px24 flex flex-col gap-px12 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-px8 text-text-secondary">
                <BookIcon />
                <h2 className="text-body-semibold font-semibold text-text-primary">Matched Chapters</h2>
              </div>
              <span
                className={`max-w-full truncate rounded-pill px-px12 py-px4 text-badge font-semibold tracking-[0.125px] ${selectedTopic ? 'bg-badge-blue-bg text-badge-blue-text' : 'bg-pending-bg text-pending'}`}
                title={selectedTopic?.topic_text || 'Select a topic'}
              >
                {selectedTopic?.topic_text || 'Select a topic'}
              </span>
            </div>

            <div className="flex min-h-[500px] items-center justify-center rounded-standard border border-dashed border-border bg-background-alt px-px24 py-px48 text-center">
              <div className="flex max-w-[320px] flex-col items-center">
                <BookIcon className="h-[40px] w-[40px] text-text-muted" />
                <h3 className="mt-px16 text-body-semibold font-semibold text-text-primary">No chapters matched yet</h3>
                <p className="mt-px8 text-caption-light text-text-secondary">
                  Chapter matching will be available in the next phase. Confirm topics on the left to proceed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SyllabusViewerModal
        isOpen={isRawTextOpen}
        syllabus={syllabus}
        onClose={() => setIsRawTextOpen(false)}
      />
    </div>
  )
}

export default TopicReviewPage
