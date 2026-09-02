import { describe, it, expect } from 'vitest'
import { calculateSpeed, calculateAverageSpeed, calculateMaxSpeed, msToKmh } from '../speed'

describe('calculateSpeed', () => {
  it('10 m in 1 second = 10 m/s = 36 km/h', () => {
    const ms = calculateSpeed(10, 1)
    expect(ms).toBeCloseTo(10, 6)
    expect(msToKmh(ms)).toBeCloseTo(36, 6)
  })

  it('returns 0 when time is 0 or negative', () => {
    expect(calculateSpeed(100, 0)).toBe(0)
    expect(calculateSpeed(100, -5)).toBe(0)
  })

  it('20 meters in 2 seconds = 10 m/s', () => {
    expect(calculateSpeed(20, 2)).toBeCloseTo(10, 6)
  })
})

describe('calculateAverageSpeed', () => {
  it('average speed over 100 m in 10 s is 10 m/s', () => {
    expect(calculateAverageSpeed(100, 10)).toBeCloseTo(10, 6)
  })

  it('returns 0 when duration is 0', () => {
    expect(calculateAverageSpeed(100, 0)).toBe(0)
  })
})

describe('calculateMaxSpeed', () => {
  it('finds the max of speeds', () => {
    expect(calculateMaxSpeed([0, 5, 25, 10, 3])).toBeCloseTo(25, 6)
  })

  it('returns 0 for empty arrays', () => {
    expect(calculateMaxSpeed([])).toBe(0)
  })
})

describe('msToKmh', () => {
  it('1 m/s = 3.6 km/h', () => {
    expect(msToKmh(1)).toBeCloseTo(3.6, 6)
  })

  it('120 km/h ≈ 33.33 m/s round trip', () => {
    expect(msToKmh(120 / 3.6)).toBeCloseTo(120, 6)
  })
})
