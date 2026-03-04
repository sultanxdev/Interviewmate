import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Dashboard from './pages/Dashboard'
import SessionSetup from './pages/SessionSetup'
import LiveSession from './pages/LiveSession'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import Background from './components/Background'

// Aurora Silk gradient — used as the universal background across ALL pages
const AURORA_BG = 'linear-gradient(150deg, #B39DDB 0%, #D1C4E9 20%, #F3E5F5 40%, #FCE4EC 60%, #FFCDD2 80%, #FFAB91 100%)'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/* Root wrapper — Aurora gradient is the canvas for every page */}
          <div
            className="min-h-screen w-full relative"
            style={{ background: AURORA_BG }}
          >
            {/* Animated depth orbs overlay */}
            <Background />

            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/session/setup" element={
                <ProtectedRoute>
                  <SessionSetup />
                </ProtectedRoute>
              } />
              <Route path="/session/:sessionId" element={
                <ProtectedRoute>
                  <LiveSession />
                </ProtectedRoute>
              } />
              <Route path="/report/:id" element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App