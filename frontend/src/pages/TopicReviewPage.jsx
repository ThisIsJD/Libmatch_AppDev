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
    <div className="min-h-screen bg-[#f6f5f4] font-inter">
      <NavBar />
      
      <main className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Breadcrumbs / Back */}
        <div className="mb-4">
          <Link to="/" className="text-[14px] font-medium text-[#615d59] hover:text-[#0075de] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-[rgba(0,0,0,0.95)] leading-[1.23] tracking-[-0.625px]">
              {syllabus?.course?.course_title || 'Syllabus Topic Review'}
            </h1>
            <p className="text-[14px] font-normal text-[#615d59] mt-1">
              {syllabus?.course?.course_code} • {syllabus?.course?.semester}
            </p>
          </div>

          {/* Action Bar §4.8 */}
          <div className="flex gap-2">
            <button
              onClick={handleConfirmAll}
              disabled={saving}
              className="bg-[#0075de] text-white px-5 py-2 rounded-[4px] text-[15px] font-semibold hover:bg-[#005bab] active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Confirm All'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-transparent text-[rgba(0,0,0,0.95)] border border-[rgba(0,0,0,0.15)] px-5 py-2 rounded-[4px] text-[15px] font-semibold hover:bg-[rgba(0,0,0,0.04)] active:scale-[0.97] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Progress Bar §4.7 (Optional but nice) */}
        <div className="mb-6">
           <div className="flex justify-between mb-2">
             <span className="text-[14px] font-medium text-[#615d59]">Syllabus Processing Status</span>
             <StatusBadge status={syllabus?.status} />
           </div>
        </div>

        {/* Split Panel Container §4.6 */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[16px] shadow-[rgba(0,0,0,0.01)_0px_1px_3px,rgba(0,0,0,0.02)_0px_3px_7px,rgba(0,0,0,0.02)_0px_7px_15px,rgba(0,0,0,0.04)_0px_14px_28px,rgba(0,0,0,0.05)_0px_23px_52px] flex overflow-hidden min-h-[640px]">
          
          {/* Left Panel: Raw Text */}
          <div className="w-[42%] border-r border-[rgba(0,0,0,0.1)] p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-[#615d59]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <h2 className="text-[16px] font-semibold text-[rgba(0,0,0,0.95)]">Extracted Text</h2>
            </div>
            <pre className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[#615d59] font-sans">
              {syllabus?.raw_text || 'No text extracted.'}
            </pre>
          </div>

          {/* Right Panel: Topics */}
          <div className="w-[58%] p-6 overflow-y-auto bg-white">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-[#615d59]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <h2 className="text-[16px] font-semibold text-[rgba(0,0,0,0.95)]">Syllabus Topics</h2>
              </div>
              <button 
                onClick={handleAddTopic}
                className="text-[13px] font-semibold text-[#0075de] hover:underline"
              >
                + Add Topic
              </button>
            </div>

            <div className="space-y-2">
              {topics.map((topic, index) => (
                <div key={index} className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] p-4 shadow-[rgba(0,0,0,0.04)_0px_4px_18px,rgba(0,0,0,0.027)_0px_2.025px_7.847px,rgba(0,0,0,0.02)_0px_0.8px_2.925px,rgba(0,0,0,0.01)_0px_0.175px_1.041px] relative group">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      className="w-full text-[16px] font-semibold text-[rgba(0,0,0,0.95)] bg-transparent border-none focus:ring-0 p-0"
                      value={topic.topic_text}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                      placeholder="Topic title..."
                    />
                    <button 
                      onClick={() => handleRemoveTopic(index)}
                      className="opacity-0 group-hover:opacity-100 text-[#a39e98] hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  {/* Topic Metadata §4.5 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {topic.source === 'extracted' && (
                      <span className="bg-[#f2f9ff] text-[#097fe8] px-[10px] py-[4px] rounded-full text-[12px] font-semibold tracking-[0.125px]">
                        Extracted
                      </span>
                    )}
                    {topic.keywords?.map((kw, kIndex) => (
                      <span key={kIndex} className="bg-[#f6f5f4] text-[#615d59] px-[8px] py-[3px] rounded-[4px] text-[12px] font-normal tracking-[0.125px]">
                        {kw.keyword_text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {topics.length === 0 && (
                <div className="py-12 text-center text-[#a39e98] text-[14px]">
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
