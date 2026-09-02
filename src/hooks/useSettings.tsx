import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { Settings } from '@/types'
import { saveSettings } from '@/lib/db/database'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'

const DEFAULTS: Settings = {
  id: 1,
  speedUnit: 'kmh',
  distanceUnit: 'meter',
  startDetection: 'automatic',
  startThresholdKmh: 3,
  gpsHighAccuracy: true,
  theme: 'dark',
  installPromptDismissed: false,
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>
  ready: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const live = useLiveQuery(() => db.settings.toArray(), [])

  const settings: Settings = useMemo(() => {
    if (live && live.length > 0) return { ...DEFAULTS, ...live[0] }
    return DEFAULTS
  }, [live])

  const update = useCallback(async (patch: Partial<Omit<Settings, 'id'>>) => {
    await saveSettings(patch)
  }, [])

  const value = useMemo(
    () => ({ settings, update, ready: Boolean(live) }),
    [settings, update, live],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
