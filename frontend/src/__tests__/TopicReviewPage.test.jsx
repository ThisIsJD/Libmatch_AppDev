import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import TopicReviewPage from '../pages/TopicReviewPage'
import { apiClient } from '../api/client'

// Mock the apiClient
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn()
  }
}))

const getMockSyllabus = () => ({
  id: '1',
  file_name: 'test-syllabus.pdf',
  raw_text: 'Test extracted text',
  upload_date: '2026-05-03T00:00:00Z',
  course: {
    course_title: 'Test Course',
    course_code: 'TEST101',
    semester: '1st Sem'
  },
  status: 'processed'
})

const getMockTopics = () => ([
  {
    id: '101',
    topic_text: 'Topic 1',
    source: 'extracted',
    is_confirmed: false,
    keywords: [
      { keyword_text: 'Inheritance', weight: 1 },
      { keyword_text: 'Encapsulation', weight: 1 }
    ]
  }
])

describe('TopicReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/topics')) return Promise.resolve({ data: getMockTopics() })
      return Promise.resolve({ data: getMockSyllabus() })
    })
  })

  const getProgressLabel = () => screen.getByText((contentText, elementNode) => (
    elementNode?.textContent === 'Progress: 0/1 topics confirmed'
  ))

  test('renders topic cards, progress, and matched chapters placeholder', async () => {
    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Syllabus Topics')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Topic 1' })).toBeDefined()
    expect(screen.getByText('Inheritance, Encapsulation')).toBeDefined()
    expect(getProgressLabel()).toBeDefined()
    expect(screen.getByText('Matched Chapters')).toBeDefined()
    expect(screen.getByText('No chapters matched yet')).toBeDefined()
  })

  test('can add and edit a topic', async () => {
    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for initial load
    await screen.findByRole('button', { name: 'Topic 1' })

    // Add topic
    fireEvent.click(screen.getByText('+ Add Topic'))
    expect(screen.getByDisplayValue('New Topic')).toBeDefined()

    // Edit topic
    fireEvent.click(screen.getByRole('button', { name: 'Topic 1' }))
    const input = screen.getByDisplayValue('Topic 1')
    fireEvent.change(input, { target: { value: 'Topic 1 Modified' } })
    expect(input.value).toBe('Topic 1 Modified')
  })

  test('View Raw Text opens the syllabus preview modal', async () => {
    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Topic 1' })

    fireEvent.click(screen.getByText('View Raw Text'))

    expect(await screen.findByText('Test extracted text')).toBeDefined()
  })

  test('Accept All calls PUT API and navigates', async () => {
    apiClient.put.mockResolvedValue({ data: [] })

    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByRole('button', { name: 'Topic 1' })
    
    fireEvent.click(screen.getByRole('button', { name: 'Accept All' }))

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/syllabi/1/topics', expect.any(Array))
    })
  })
})
