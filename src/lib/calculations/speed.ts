import { MS_TO_KMH } from '@/lib/utils/constants'

export function calculateSpeed(distanceMeters: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0
  return distanceMeters / timeSeconds
}

export function msToKmh(ms: number): number {
  return ms * MS_TO_KMH
}

export function kmhToMs(kmh: number): number {
  return kmh / MS_TO_KMH
}

export function calculateAverageSpeed(
  distanceMeters: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0
  return distanceMeters / durationSeconds
}

export function calculateMaxSpeed(speedsMs: number[]): number {
  if (speedsMs.length === 0) return 0
  return Math.max(...speedsMs)
}
