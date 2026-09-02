import {
  KMH_TO_MPH,
  METERS_TO_FEET,
  MPS_TO_MPH,
  MS_TO_KMH,
} from '@/lib/utils/constants'
import type { DistanceUnit, SpeedUnit } from '@/types'

export interface SpeedDisplay {
  value: number
  unit: string
}

export interface DistanceDisplay {
  value: number
  unit: string
}

export function convertSpeed(ms: number, unit: SpeedUnit): SpeedDisplay {
  if (unit === 'mph') {
    return { value: ms * MPS_TO_MPH, unit: 'MPH' }
  }
  return { value: ms * MS_TO_KMH, unit: 'KM/H' }
}

export function convertKmhToMph(kmh: number): number {
  return kmh * KMH_TO_MPH
}

export function convertDistance(meters: number, unit: DistanceUnit): DistanceDisplay {
  if (unit === 'feet') {
    return { value: meters * METERS_TO_FEET, unit: 'ft' }
  }
  if (meters >= 1000) {
    return { value: meters / 1000, unit: 'km' }
  }
  return { value: meters, unit: 'm' }
}

export function convertAccumulatedDistance(
  meters: number,
  unit: DistanceUnit,
): DistanceDisplay {
  if (unit === 'feet') {
    return { value: meters * METERS_TO_FEET, unit: 'ft' }
  }
  return { value: meters, unit: 'm' }
}
