import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
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
  raw_text: 'Test extracted text',
  course: {
    course_title: 'Test Course',
    course_code: 'TEST101',
    semester: '1st Sem'
  },
  status: 'processed'
})

const getMockTopics = () => ([
  { id: '101', topic_text: 'Topic 1', source: 'extracted', keywords: [] }
])

describe('TopicReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/topics')) return Promise.resolve({ data: getMockTopics() })
      return Promise.resolve({ data: getMockSyllabus() })
    })
  })

  test('renders extracted text and topics', async () => {
    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Test extracted text')).toBeDefined()
    expect(screen.getByDisplayValue('Topic 1')).toBeDefined()
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
    await screen.findByDisplayValue('Topic 1')

    // Add topic
    fireEvent.click(screen.getByText('+ Add Topic'))
    expect(screen.getByDisplayValue('New Topic')).toBeDefined()

    // Edit topic
    const input = screen.getByDisplayValue('Topic 1')
    fireEvent.change(input, { target: { value: 'Topic 1 Modified' } })
    expect(input.value).toBe('Topic 1 Modified')
  })

  test('Confirm All calls PUT API and navigates', async () => {
    apiClient.put.mockResolvedValue({ data: [] })

    render(
      <MemoryRouter initialEntries={['/syllabi/1/topics']}>
        <Routes>
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByDisplayValue('Topic 1')
    
    fireEvent.click(screen.getByText('✓ Confirm All'))

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/syllabi/1/topics', expect.any(Array))
    })
  })
})
