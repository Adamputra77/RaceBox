import { Routes, Route, Navigate } from 'react-router-dom'
import { GPSProvider } from '@/hooks/useGPS'
import { SettingsProvider } from '@/hooks/useSettings'
import { ThemeManager } from '@/app/theme/ThemeManager'
import { ErrorBoundary } from './ErrorBoundary'
import { InstallPrompt } from './pwa/InstallPrompt'
import { AppLayout } from './layout/AppLayout'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { useAuth } from '@/lib/auth/useAuth'
import { GuardRoute } from '@/components/GuardRoute'
import { HomePage } from '@/features/home/HomePage'
import { RacePage } from '@/features/race/RacePage'
import { RaceLivePage } from '@/features/race/RaceLivePage'
import { RidePage } from '@/features/ride/RidePage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { HistoryDetailPage } from '@/features/history/HistoryDetailPage'
import { ComparePage } from '@/features/history/ComparePage'
import { GaragePage } from '@/features/garage/GaragePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { AboutPage } from '@/features/settings/AboutPage'
import { LoginPage } from '@/app/auth/LoginPage'
import { RegisterPage } from '@/app/auth/RegisterPage'
import { PendingPage } from '@/app/auth/PendingPage'
import { BannedPage } from '@/app/auth/BannedPage'
import { AdminDashboard } from '@/features/admin/AdminDashboard'

function AppRoutes() {
  const { isAdmin, status } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route path="/banned" element={<BannedPage />} />

      <Route
        path="/admin"
        element={
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <Navigate to={status === 'signedOut' ? '/login' : '/'} replace />
          )
        }
      />

      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <GuardRoute>
              <HomePage />
            </GuardRoute>
          }
        />
        <Route
          path="/race"
          element={
            <GuardRoute>
              <RacePage />
            </GuardRoute>
          }
        />
        <Route
          path="/race/live"
          element={
            <GuardRoute>
              <RaceLivePage />
            </GuardRoute>
          }
        />
        <Route
          path="/ride"
          element={
            <GuardRoute>
              <RidePage />
            </GuardRoute>
          }
        />
        <Route
          path="/history"
          element={
            <GuardRoute>
              <HistoryPage />
            </GuardRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <GuardRoute>
              <HistoryDetailPage />
            </GuardRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <GuardRoute>
              <ComparePage />
            </GuardRoute>
          }
        />
        <Route
          path="/garage"
          element={
            <GuardRoute>
              <GaragePage />
            </GuardRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <GuardRoute>
              <SettingsPage />
            </GuardRoute>
          }
        />
        <Route
          path="/settings/about"
          element={
            <GuardRoute>
              <AboutPage />
            </GuardRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <ThemeManager />
          <GPSProvider>
            <AppRoutes />
            <InstallPrompt />
          </GPSProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
