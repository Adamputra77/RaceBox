import { Routes, Route } from 'react-router-dom'
import { GPSProvider } from '@/hooks/useGPS'
import { SettingsProvider } from '@/hooks/useSettings'
import { ThemeManager } from '@/app/theme/ThemeManager'
import { ErrorBoundary } from './ErrorBoundary'
import { InstallPrompt } from './pwa/InstallPrompt'
import { AppLayout } from './layout/AppLayout'
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

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeManager />
        <GPSProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/race" element={<RacePage />} />
              <Route path="/race/live" element={<RaceLivePage />} />
              <Route path="/ride" element={<RidePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<HistoryDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/garage" element={<GaragePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/about" element={<AboutPage />} />
            </Route>
          </Routes>
          <InstallPrompt />
        </GPSProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}
