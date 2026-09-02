import { useEffect } from 'react'
import { useSettings } from './useSettings'
import type { ThemePref } from '@/types'

const THEMES: Record<ThemePref, Record<string, string>> = {
  dark: {
    '--color-race-bg': '#0a0a0a',
    '--color-race-card': '#161616',
    '--color-race-card2': '#1e1e1e',
    '--color-race-red': '#e10600',
    '--color-race-red2': '#ff2d1a',
  },
  corsa: {
    '--color-race-bg': '#120606',
    '--color-race-card': '#1d0a0a',
    '--color-race-card2': '#271010',
    '--color-race-red': '#ff1f1f',
    '--color-race-red2': '#ff5040',
  },
  neon: {
    '--color-race-bg': '#060a12',
    '--color-race-card': '#0e1420',
    '--color-race-card2': '#16202e',
    '--color-race-red': '#00e5ff',
    '--color-race-red2': '#00c8ff',
  },
}

export function useTheme() {
  const { settings } = useSettings()

  useEffect(() => {
    const vars = THEMES[settings.theme]
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
  }, [settings.theme])

  return settings.theme
}
