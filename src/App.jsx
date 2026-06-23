import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import LandingPage   from './pages/LandingPage'
import AuthPage      from './pages/AuthPage'
import HomePage      from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage  from './pages/CalendarPage'
import SettingsPage  from './pages/SettingsPage'
import AppLayout     from './components/layout/AppLayout'
import HomeLayout    from './components/layout/HomeLayout'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }

// Public: show landing page OR redirect logged-in users to /home
function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</span>
    </div>
  )
  if (user) return <Navigate to="/home" replace />
  return <LandingPage />
}

// Wrap all protected routes — redirects to /auth if not logged in
function ProtectedWrapper() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</span>
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"     element={<RootRoute />} />
      <Route path="/auth" element={<motion.div {...fade}><AuthPage /></motion.div>} />

      {/* Protected — all share one WorkspaceProvider */}
      <Route element={<ProtectedWrapper />}>
        {/* Home: simple layout */}
        <Route element={<HomeLayout />}>
          <Route path="/home" element={<motion.div {...fade}><HomePage /></motion.div>} />
        </Route>

        {/* Board + Settings: full nav layout */}
        <Route element={<AppLayout />}>
          <Route path="/board"    element={<motion.div {...fade} className="flex-1 flex flex-col min-h-0"><DashboardPage /></motion.div>} />
          <Route path="/calendar" element={<motion.div {...fade} className="flex-1 flex flex-col min-h-0"><CalendarPage /></motion.div>} />
          <Route path="/settings" element={<motion.div {...fade} className="flex-1 flex flex-col min-h-0"><SettingsPage /></motion.div>} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
