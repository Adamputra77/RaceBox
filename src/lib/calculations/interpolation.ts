export interface InterpolationPoint {
  timeSec: number
  distanceMeters: number
}

export function interpolateFinishTime(
  before: InterpolationPoint,
  after: InterpolationPoint,
  targetDistanceMeters: number,
): number {
  if (before.distanceMeters >= targetDistanceMeters) return before.timeSec
  if (after.distanceMeters <= before.distanceMeters) return after.timeSec
  if (after.distanceMeters < targetDistanceMeters) return after.timeSec

  const fraction =
    (targetDistanceMeters - before.distanceMeters) /
    (after.distanceMeters - before.distanceMeters)
  return before.timeSec + (after.timeSec - before.timeSec) * fraction
}

export function detectSplitTimes(
  samples: Array<{ timeSec: number; distanceMeters: number }>,
  splitDistancesMeters: number[],
): Array<{ distance: number; time: number }> {
  const results: Array<{ distance: number; time: number }> = []
  if (samples.length === 0) return results

  let sampleIndex = 0
  for (const splitDistance of splitDistancesMeters) {
    while (
      sampleIndex < samples.length &&
      samples[sampleIndex].distanceMeters < splitDistance
    ) {
      sampleIndex++
    }

    if (sampleIndex === 0) {
      continue
    }

    if (sampleIndex >= samples.length) {
      const last = samples[samples.length - 1]
      if (last.distanceMeters >= splitDistance) {
        results.push({ distance: splitDistance, time: last.timeSec })
      }
      continue
    }

    const before = samples[sampleIndex - 1]
    const after = samples[sampleIndex]
    const time = interpolateFinishTime(before, after, splitDistance)
    results.push({ distance: splitDistance, time })
  }

  return results
}
