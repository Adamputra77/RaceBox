import { db } from '@/lib/db/database'
import type { RaceRecord, RideRecord, Vehicle, Settings } from '@/types'

export interface ExportPayload {
  version: 1
  exportedAt: number
  vehicles: Vehicle[]
  races: RaceRecord[]
  rides: RideRecord[]
  settings: Settings | null
}

export async function exportAllData(): Promise<ExportPayload> {
  const [vehicles, races, rides, settingsArr] = await Promise.all([
    db.vehicles.toArray(),
    db.races.toArray(),
    db.rides.toArray(),
    db.settings.toArray(),
  ])
  return {
    version: 1,
    exportedAt: Date.now(),
    vehicles,
    races,
    rides,
    settings: settingsArr[0] ?? null,
  }
}

export function downloadJSON(data: object, filename = 'racebox-data.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function downloadRaceCSV(races: RaceRecord[]): void {
  const header = [
    'date',
    'distance_m',
    'time_s',
    'max_speed_kmh',
    'avg_speed_kmh',
    'gps_accuracy_m',
    'gps_quality',
    'samples',
  ]
  const lines = races.map((r) =>
    [
      new Date(r.createdAt).toISOString(),
      r.selectedDistance,
      r.elapsedTime.toFixed(3),
      r.maxSpeed.toFixed(1),
      r.averageSpeed.toFixed(1),
      r.gpsAccuracy.toFixed(1),
      r.gpsQuality,
      r.gpsSampleCount,
    ].join(','),
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'racebox-races.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function importAllData(file: File): Promise<{ count: number }> {
  const text = await file.text()
  const data = JSON.parse(text) as ExportPayload

  if (!data || data.version !== 1) {
    throw new Error('Format file tidak valid.')
  }

  const count = (data.races?.length ?? 0) + (data.rides?.length ?? 0) + (data.vehicles?.length ?? 0)

  await db.transaction('rw', db.vehicles, db.races, db.rides, db.settings, async () => {
    if (data.vehicles?.length) await db.vehicles.bulkPut(data.vehicles)
    if (data.races?.length) await db.races.bulkPut(data.races)
    if (data.rides?.length) await db.rides.bulkPut(data.rides)
    if (data.settings) await db.settings.put(data.settings)
  })

  return { count }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.races, db.rides, db.vehicles, async () => {
    await db.races.clear()
    await db.rides.clear()
    await db.vehicles.clear()
  })
}
