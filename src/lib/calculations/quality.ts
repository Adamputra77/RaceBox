import type { GPSQuality } from '@/types/gps'
import { GPS_CONFIG } from '@/lib/utils/constants'

export function calculateQuality(accuracyMeters: number): GPSQuality {
  if (accuracyMeters <= GPS_CONFIG.QUALITY_EXCELLENT_METERS) return 'EXCELLENT'
  if (accuracyMeters <= GPS_CONFIG.QUALITY_GOOD_METERS) return 'GOOD'
  if (accuracyMeters <= GPS_CONFIG.QUALITY_FAIR_METERS) return 'FAIR'
  return 'POOR'
}

export function isReliableQuality(quality: GPSQuality): boolean {
  return quality !== 'POOR'
}
