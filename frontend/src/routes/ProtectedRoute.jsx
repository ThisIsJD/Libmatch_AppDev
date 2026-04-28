import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getAccessToken } from '../lib/authSession.js'

function ProtectedRoute() {
  const location = useLocation()
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute