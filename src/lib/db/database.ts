import Dexie, { type Table } from 'dexie'
import type { RaceRecord, RideRecord, Settings, Vehicle } from '@/types'

export class RaceBoxDB extends Dexie {
  vehicles!: Table<Vehicle, number>
  races!: Table<RaceRecord, number>
  rides!: Table<RideRecord, number>
  settings!: Table<Settings, number>

  constructor() {
    super('racebox')
    this.version(1).stores({
      vehicles: '++id, name, type, createdAt',
      races: '++id, mode, createdAt, elapsedTime, selectedDistance',
      rides: '++id, createdAt, duration, distance',
      settings: 'id',
    })
  }
}

export const db = new RaceBoxDB()

export async function getSettings(): Promise<Settings> {
  const defaults: Settings = {
    id: 1,
    speedUnit: 'kmh',
    distanceUnit: 'meter',
    startDetection: 'automatic',
    startThresholdKmh: 3,
    gpsHighAccuracy: true,
    theme: 'dark',
    installPromptDismissed: false,
  }
  const existing = await db.settings.get(1)
  if (existing) return { ...defaults, ...existing }
  return defaults
}

export async function saveSettings(
  patch: Partial<Omit<Settings, 'id'>>,
): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch, id: 1 }
  await db.settings.put(next)
  return next
}
