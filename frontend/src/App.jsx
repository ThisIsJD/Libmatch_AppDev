import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DirectorDashboard from './pages/DirectorDashboard.jsx'
import TopicReviewPage from './pages/TopicReviewPage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/syllabi/:id/topics" element={<TopicReviewPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['director']} />}>
          <Route path="/director" element={<DirectorDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
