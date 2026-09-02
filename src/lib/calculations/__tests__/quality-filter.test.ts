import { describe, it, expect } from 'vitest'
import { calculateQuality } from '../quality'
import { filterGPSPoint } from '../filter'
import { GPS_CONFIG } from '@/lib/utils/constants'

describe('calculateQuality', () => {
  it('EXCELLENT for <=5m', () => {
    expect(calculateQuality(2.4)).toBe('EXCELLENT')
    expect(calculateQuality(5)).toBe('EXCELLENT')
  })
  it('GOOD for >5 and <=10', () => {
    expect(calculateQuality(7)).toBe('GOOD')
    expect(calculateQuality(10)).toBe('GOOD')
  })
  it('FAIR for >10 and <=20', () => {
    expect(calculateQuality(15)).toBe('FAIR')
    expect(calculateQuality(20)).toBe('FAIR')
  })
  it('POOR for >20', () => {
    expect(calculateQuality(21)).toBe('POOR')
    expect(calculateQuality(50)).toBe('POOR')
  })
})

describe('filterGPSPoint', () => {
  const base = {
    latitude: -6.2,
    longitude: 106.8,
    speedMs: 10,
    timestamp: 0,
  }

  it('rejects a point moving at impossible speed (400+ km/h)', () => {
    const jump = {
      latitude: -6.2 + 0.01, // ~1.1 km away
      longitude: 106.8,
      speedMs: 400 / 3.6, // 400 km/h is near max, use above
      timestamp: 1000,
    }
    // Use a speed above the max reasonable threshold
    const bad = { ...jump, speedMs: 600 / 3.6 }
    expect(filterGPSPoint(base, bad)).toBe(true)
  })

  it('rejects a point far away in a tiny time window', () => {
    // Move ~1.1 km in 100 ms: implausible
    const far = {
      latitude: -6.2 + 0.01,
      longitude: 106.8,
      speedMs: 10,
      timestamp: 100,
    }
    expect(filterGPSPoint(base, far)).toBe(true)
  })

  it('accepts a small, plausible movement', () => {
    // Move a tiny amount (~2.2m in 100ms) at 10 m/s
    const ok = {
      latitude: -6.2 + 0.00002,
      longitude: 106.8,
      speedMs: 10,
      timestamp: 100,
    }
    expect(filterGPSPoint(base, ok)).toBe(false)
  })

  it('rejects points above maxReasonableSpeed', () => {
    const high = {
      latitude: base.latitude,
      longitude: base.longitude,
      speedMs: GPS_CONFIG.MAX_REASONABLE_SPEED_MS + 1,
      timestamp: 2000,
    }
    expect(filterGPSPoint(base, high)).toBe(true)
  })
})
