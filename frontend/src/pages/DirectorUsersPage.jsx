import axios from 'axios'
import { useEffect, useState } from 'react'

import { apiClient } from '../api/client.js'
import SkeletonBlock from '../components/atoms/SkeletonBlock.jsx'

const roleStyles = {
  director: 'bg-badge-blue-bg text-badge-blue-text',
  faculty: 'bg-success-bg text-success',
  cataloger: 'bg-warning-bg text-warning',
  librarian: 'bg-background-alt text-text-secondary',
}

function formatRoleLabel(roleValue) {
  if (!roleValue) {
    return 'Unknown'
  }

  return `${roleValue.charAt(0).toUpperCase()}${roleValue.slice(1)}`
}

function formatDate(value) {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return '--'
  }

  return parsedDate.toLocaleDateString()
}

function DirectorUsersPage() {
  const [userItems, setUserItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    async function loadUsers() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await apiClient.get('/director/users')
        if (!isCurrentRequest) {
          return
        }

        setUserItems(Array.isArray(response.data?.items) ? response.data.items : [])
      } catch (error) {
        if (!isCurrentRequest) {
          return
        }

        if (axios.isAxiosError(error) && error.response) {
          const detail =
            typeof error.response.data?.detail === 'string'
              ? error.response.data.detail
              : 'Failed to load users.'
          setErrorMessage(detail)
        } else {
          setErrorMessage('Failed to load users. Check backend connectivity.')
        }
        setUserItems([])
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isCurrentRequest = false
    }
  }, [])

  return (
    <section>
      <header className="mb-px24">
        <h1 className="text-heading-lg font-bold tracking-[-0.625px] text-text-primary">
          User and Access Oversight
        </h1>
        <p className="mt-px4 text-caption-light text-text-secondary">
          Review users, roles, and faculty upload activity.
        </p>
      </header>

      {errorMessage ? (
        <p className="mb-px16 rounded-standard border border-warning/25 bg-warning-bg px-px12 py-px8 text-caption font-medium text-warning">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-large border border-border bg-surface p-px16 shadow-card">
        {isLoading ? (
          <div className="space-y-px8" aria-label="Loading director users">
            <SkeletonBlock className="h-px12 w-[220px]" />
            <SkeletonBlock className="h-px48 w-full" />
            <SkeletonBlock className="h-px48 w-full" />
          </div>
        ) : userItems.length === 0 ? (
          <p className="text-caption-light text-text-secondary">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-micro uppercase tracking-[0.125px] text-text-muted">
                  <th className="py-px8 pr-px8">Full Name</th>
                  <th className="py-px8 pr-px8">Email</th>
                  <th className="py-px8 pr-px8">Role</th>
                  <th className="py-px8">Last Upload</th>
                </tr>
              </thead>
              <tbody>
                {userItems.map((userItem) => {
                  const normalizedRole = String(userItem.role || '').toLowerCase()
                  const roleClass = roleStyles[normalizedRole] || roleStyles.librarian

                  return (
                    <tr key={userItem.id} className="border-b border-border text-caption text-text-primary">
                      <td className="py-px10 pr-px8">{userItem.full_name}</td>
                      <td className="py-px10 pr-px8">{userItem.email}</td>
                      <td className="py-px10 pr-px8">
                        <span
                          className={`inline-flex rounded-pill px-px8 py-px4 text-caption font-semibold ${roleClass}`}
                        >
                          {formatRoleLabel(normalizedRole)}
                        </span>
                      </td>
                      <td className="py-px10">{formatDate(userItem.last_upload)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

export default DirectorUsersPage
