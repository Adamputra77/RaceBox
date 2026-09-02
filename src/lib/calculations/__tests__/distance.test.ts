import { describe, it, expect } from 'vitest'
import { haversineDistance, calculateDistance } from '../distance'

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0)
  })

  it('computes ~111.19 km for 1 degree of longitude at the equator', () => {
    const d = haversineDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })
    // 1 deg lon at equator ≈ 111195 m
    expect(d).toBeGreaterThan(111000)
    expect(d).toBeLessThan(111300)
  })

  it('is symmetric', () => {
    const a = haversineDistance({ latitude: -6.2, longitude: 106.8 }, { latitude: -6.3, longitude: 106.9 })
    const b = haversineDistance({ latitude: -6.3, longitude: 106.9 }, { latitude: -6.2, longitude: 106.8 })
    expect(a).toBeCloseTo(b, 6)
  })

  it('computes a known city-pair distance within tolerance', () => {
    const london = { latitude: 51.5007, longitude: -0.1246 }
    const nyc = { latitude: 40.6892, longitude: -74.0445 }
    const d = haversineDistance(london, nyc)
    // Actual great-circle ~5570 km
    expect(d).toBeGreaterThan(5500000)
    expect(d).toBeLessThan(5600000)
  })
})

describe('calculateDistance', () => {
  it('sums up segment distances', () => {
    const p1 = { latitude: 0, longitude: 0 }
    const p2 = { latitude: 0, longitude: 1 }
    const p3 = { latitude: 0, longitude: 2 }
    const d = calculateDistance([p1, p2, p3])
    expect(d).toBeCloseTo(2 * haversineDistance(p1, p2), 4)
  })

  it('returns 0 for single/empty point lists', () => {
    expect(calculateDistance([])).toBe(0)
    expect(calculateDistance([{ latitude: 1, longitude: 1 }])).toBe(0)
  })
})
