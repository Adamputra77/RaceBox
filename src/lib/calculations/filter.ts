import { GPS_CONFIG, MS_TO_KMH } from '@/lib/utils/constants'

export interface FilterPoint {
  latitude: number
  longitude: number
  speedMs: number | null
  timestamp: number
}

/**
 * Decide whether a new GPS point represents a physically implausible "jump".
 * Returns true when the point should be rejected.
 */
export function filterGPSPoint(
  prev: FilterPoint,
  current: FilterPoint,
  config: {
    maxReasonableSpeedKmh?: number
    maxReasonableSpeedMs?: number
    maxPositionJumpMeters?: number
  } = {},
): boolean {
  const maxSpeedMs =
    config.maxReasonableSpeedMs ?? GPS_CONFIG.MAX_REASONABLE_SPEED_MS
  const maxSpeedKmh = config.maxReasonableSpeedKmh ?? GPS_CONFIG.MAX_REASONABLE_SPEED_KMH
  const maxJump = config.maxPositionJumpMeters ?? GPS_CONFIG.MAX_POSITION_JUMP_METERS

  const dtMs = current.timestamp - prev.timestamp
  const dtSec = dtMs / 1000

  const effectiveSpeedMs = current.speedMs ?? 0

  if (effectiveSpeedMs * MS_TO_KMH > maxSpeedKmh) return true

  const distanceMeters = haversine(prev.latitude, prev.longitude, current.latitude, current.longitude)

  if (dtMs > 0 && dtMs < GPS_CONFIG.MIN_ELAPSED_TIME_FOR_JUMP_MS) {
    const maxReasonableDistForTime =
      maxSpeedMs * dtSec
    if (distanceMeters > maxReasonableDistForTime) return true
  }

  if (dtMs > 0 && distanceMeters > maxJump && dtMs < GPS_CONFIG.MIN_ELAPSED_TIME_FOR_JUMP_MS) {
    return true
  }

  return false
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
