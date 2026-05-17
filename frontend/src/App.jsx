import { BrowserRouter, Route, Routes } from 'react-router-dom'

import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DirectorDashboard from './pages/DirectorDashboard.jsx'
import DirectorSyllabiPage from './pages/DirectorSyllabiPage.jsx'
import DirectorUsersPage from './pages/DirectorUsersPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import TopicReviewPage from './pages/TopicReviewPage.jsx'
import DirectorLayout from './components/templates/DirectorLayout.jsx'
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
          <Route path="/director" element={<DirectorLayout />}>
            <Route index element={<DirectorDashboard />} />
            <Route path="syllabi" element={<DirectorSyllabiPage />} />
            <Route path="users" element={<DirectorUsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
