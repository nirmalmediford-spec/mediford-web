import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import LeadDetail from './pages/LeadDetail'
import TendersPage from './pages/TendersPage'
import TenderDetail from './pages/TenderDetail'
import BatchesPage from './pages/BatchesPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import TeamPage from './pages/TeamPage'
import ProfilePage from './pages/ProfilePage'
import { canSeeLeads, canSeeTenders, canManageTeam } from './utils/models'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        {canSeeLeads(user.role) && (
          <>
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/new" element={<LeadDetail />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
          </>
        )}
        {canSeeTenders(user.role) && (
          <>
            <Route path="/tenders" element={<TendersPage />} />
            <Route path="/tenders/new" element={<TenderDetail />} />
            <Route path="/tenders/:id" element={<TenderDetail />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/batches/:batchId" element={<BatchesPage />} />
          </>
        )}
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        {canManageTeam(user.role) && <Route path="/team" element={<TeamPage />} />}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
