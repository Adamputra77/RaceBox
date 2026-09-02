import { EARTH_RADIUS_METERS } from '@/lib/utils/constants'

export interface LatLon {
  latitude: number
  longitude: number
}

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineDistance(a: LatLon, b: LatLon): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function calculateDistance(points: LatLon[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i])
  }
  return total
}
