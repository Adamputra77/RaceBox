import { describe, it, expect } from 'vitest'
import {
  interpolateFinishTime,
  detectSplitTimes,
} from '../interpolation'

describe('interpolateFinishTime', () => {
  it('interpolates linearly between samples across the finish line', () => {
    // sample A: 198m @ 8.60s ; sample B: 204m @ 8.85s ; target 201m
    const before = { timeSec: 8.6, distanceMeters: 198 }
    const after = { timeSec: 8.85, distanceMeters: 204 }
    const t = interpolateFinishTime(before, after, 201)
    const expected = 8.6 + (8.85 - 8.6) * ((201 - 198) / (204 - 198))
    expect(t).toBeCloseTo(expected, 6)
  })

  it('returns before.timeSec when target already reached at before', () => {
    const t = interpolateFinishTime(
      { timeSec: 5, distanceMeters: 100 },
      { timeSec: 6, distanceMeters: 110 },
      90,
    )
    expect(t).toBe(5)
  })

  it('returns after.timeSec when after still under target', () => {
    const t = interpolateFinishTime(
      { timeSec: 5, distanceMeters: 50 },
      { timeSec: 6, distanceMeters: 80 },
      90,
    )
    expect(t).toBe(6)
  })
})

describe('detectSplitTimes', () => {
  const linearSamples: Array<{ timeSec: number; distanceMeters: number }> = Array.from(
    { length: 1000 },
    (_, i) => ({
      timeSec: i * 0.01,
      distanceMeters: i * 0.5, // 0.5m per 0.01s = 50 m/s
    }),
  )

  it('detects 20m split at ~0.4 s', () => {
    const splits = detectSplitTimes(linearSamples, [20])
    expect(splits[0].distance).toBe(20)
    expect(splits[0].time).toBeCloseTo(0.4, 1)
  })

  it('detects multiple standard splits', () => {
    const splits = detectSplitTimes(linearSamples, [20, 50, 100, 201])
    const distances = splits.map((s) => s.distance)
    expect(distances).toEqual([20, 50, 100, 201])
    expect(splits.find((s) => s.distance === 100)!.time).toBeCloseTo(2.0, 1)
  })

  it('only returns splits within the travelled distance', () => {
    const shortSamples: Array<{ timeSec: number; distanceMeters: number }> = Array.from(
      { length: 100 },
      (_, i) => ({
        timeSec: i,
        distanceMeters: i * 2,
      }),
    )
    const splits = detectSplitTimes(shortSamples, [20, 50, 100, 150, 201])
    const distances = splits.map((s) => s.distance)
    expect(distances).not.toContain(201)
    expect(distances).toContain(150)
  })
})
