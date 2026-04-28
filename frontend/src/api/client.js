import axios from 'axios'

import { clearSession, getAccessToken } from '../lib/authSession.js'

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl) {
    return 'http://localhost:8000'
  }

  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl
}

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error?.response?.status
    const requestUrl = String(error?.config?.url ?? '')
    const isLoginRequest = requestUrl.includes('/auth/login')

    if (statusCode === 401 && !isLoginRequest) {
      clearSession()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)