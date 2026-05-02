import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import NavBar from '../components/NavBar'
import StatusBadge from '../components/StatusBadge'

const TopicReviewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [syllabus, setSyllabus] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [syllabusRes, topicsRes] = await Promise.all([
          apiClient.get(`/syllabi/${id}`),
          apiClient.get(`/syllabi/${id}/topics`)
        ])
        setSyllabus(syllabusRes.data)
        setTopics(topicsRes.data)
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
      keywords: []
    }
    setTopics([...topics, newTopic])
  }

  const handleTopicChange = (index, newText) => {
    const updatedTopics = [...topics]
    updatedTopics[index].topic_text = newText
    setTopics(updatedTopics)
  }

  const handleRemoveTopic = (index) => {
    const updatedTopics = [...topics]
    updatedTopics.splice(index, 1)
    setTopics(updatedTopics)
  }

  const handleConfirmAll = async () => {
    setSaving(true)
    try {
      const payload = topics.map(t => ({
        id: t.id || null,
        topic_text: t.topic_text,
        source: t.source,
        keywords: t.keywords.map(k => ({
          keyword_text: k.keyword_text,
          weight: k.weight
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

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-background-alt font-sans">
      <NavBar user={JSON.parse(localStorage.getItem('libmatch_user'))} onSignOut={() => {
        localStorage.removeItem('libmatch_access_token');
        localStorage.removeItem('libmatch_user');
        navigate('/login');
      }} />
      
      <main className="max-w-[1200px] mx-auto px-px32 py-px32 sm:px-px32 lg:px-px32 lg:py-px32">
        {/* Breadcrumbs / Back */}
        <div className="mb-px16">
          <Link to="/" className="text-caption font-medium text-text-secondary hover:text-primary transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-start mb-px24">
          <div>
            <h1 className="text-heading-lg font-bold text-text-primary leading-[1.23] tracking-[-0.625px]">
              {syllabus?.course?.course_title || 'Syllabus Topic Review'}
            </h1>
            <p className="text-caption font-normal text-text-secondary mt-px4">
              {syllabus?.course?.course_code} • {syllabus?.course?.semester}
            </p>
          </div>

          {/* Action Bar §4.8 */}
          <div className="flex gap-px8">
            <button
              onClick={handleConfirmAll}
              disabled={saving}
              className="bg-primary text-white px-px20 py-px8 rounded-micro text-nav-button font-semibold hover:bg-primary-hover active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Confirm All'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-transparent text-text-primary border border-[rgba(0,0,0,0.15)] px-px20 py-px8 rounded-micro text-nav-button font-semibold hover:bg-[rgba(0,0,0,0.04)] active:scale-[0.97] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-px24">
           <div className="flex justify-between mb-px8">
             <span className="text-caption font-medium text-text-secondary">Syllabus Processing Status</span>
             <StatusBadge status={syllabus?.status} />
           </div>
        </div>

        {/* Split Panel Container §4.6 */}
        <div className="bg-surface border border-border rounded-large shadow-deep flex overflow-hidden min-h-[640px]">
          
          {/* Left Panel: Raw Text */}
          <div className="w-[42%] border-r border-border p-px24 overflow-y-auto">
            <div className="flex items-center gap-px8 mb-px16 text-text-secondary">
              <svg className="w-px16 h-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <h2 className="text-body-semibold font-semibold text-text-primary">Extracted Text</h2>
            </div>
            <pre className="whitespace-pre-wrap text-caption font-normal leading-[1.60] text-text-secondary font-sans">
              {syllabus?.raw_text || 'No text extracted.'}
            </pre>
          </div>

          {/* Right Panel: Topics */}
          <div className="w-[58%] p-px24 overflow-y-auto bg-surface">
            <div className="flex justify-between items-center mb-px24">
              <div className="flex items-center gap-px8 text-text-secondary">
                <svg className="w-px16 h-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <h2 className="text-body-semibold font-semibold text-text-primary">Syllabus Topics</h2>
              </div>
              <button 
                onClick={handleAddTopic}
                className="text-micro font-semibold text-primary hover:underline"
              >
                + Add Topic
              </button>
            </div>

            <div className="space-y-px8">
              {topics.map((topic, index) => (
                <div key={index} className="bg-surface border border-border rounded-standard p-px16 shadow-card relative group hover:border-[rgba(0,0,0,0.15)] transition-all duration-200">
                  <div className="flex justify-between items-start mb-px8">
                    <input
                      className="w-full text-body-semibold font-semibold text-text-primary bg-transparent border-none focus:ring-0 p-0"
                      value={topic.topic_text}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                      placeholder="Topic title..."
                    />
                    <button 
                      onClick={() => handleRemoveTopic(index)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-px16 h-px16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  {/* Topic Metadata §4.4 & §4.5 */}
                  <div className="flex flex-wrap gap-px8 mt-px12">
                    {topic.source === 'extracted' && (
                      <span className="bg-badge-blue-bg text-badge-blue-text px-px12 py-px4 rounded-pill text-badge font-semibold tracking-[0.125px]">
                        Extracted
                      </span>
                    )}
                    {topic.keywords?.map((kw, kIndex) => (
                      <span key={kIndex} className="bg-background-alt text-text-secondary px-px8 py-px2 rounded-micro text-micro font-normal tracking-[0.125px]">
                        {kw.keyword_text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {topics.length === 0 && (
                <div className="py-px48 text-center text-text-muted text-caption font-normal">
                  No topics identified yet. Click "+ Add Topic" to start.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TopicReviewPage
