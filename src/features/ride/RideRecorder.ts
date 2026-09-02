import type { GPSPosition } from '@/types/gps'
import { haversineDistance, calculateQuality } from '@/lib/calculations'
import { MS_TO_KMH } from '@/lib/utils/constants'
import type { GPSQuality } from '@/types/gps'

export interface RideSample {
  timeSec: number
  lat: number
  lon: number
  speed: number | null
  alt: number | null
}

export interface RideState {
  recording: boolean
  started: boolean
  finished: boolean
  liveSpeedMs: number
  distance: number
  durationMs: number
  maxSpeedMs: number
  avgSpeedMs: number
  quality: GPSQuality | null
  accuracy: number
  elevationGain: number
  sampleCount: number
}

export class RideRecorder {
  private startTimestamp: number | null = null
  private endTimestamp: number | null = null
  private startPosition: GPSPosition | null = null
  private lastPosition: GPSPosition | null = null
  private liveSpeedMs = 0
  private accumulatedDistance = 0
  private maxSpeedMs = 0
  private quality: GPSQuality | null = null
  private accuracy = 0
  private lastAlt: number | null = null
  private elevationGain = 0
  private samples: RideSample[] = []
  private recording = false

  begin(startPos: GPSPosition): void {
    if (this.recording) return
    this.recording = true
    this.startTimestamp = startPos.timestamp
    this.startPosition = startPos
    this.lastPosition = startPos
    this.liveSpeedMs = 0
    this.accumulatedDistance = 0
    this.maxSpeedMs = 0
    this.quality = calculateQuality(startPos.accuracy)
    this.accuracy = startPos.accuracy
    this.lastAlt = startPos.altitude
    this.elevationGain = 0
    this.samples = []
  }

  push(pos: GPSPosition): RideState {
    if (!this.recording) return this.snapshot()

    this.quality = calculateQuality(pos.accuracy)
    this.accuracy = pos.accuracy

    let sampleSpeed: number | null = null

    const prev = this.lastPosition
    if (prev && pos.timestamp > prev.timestamp) {
      const seg = haversineDistance(prev, pos)
      this.accumulatedDistance += seg

      if (pos.altitude !== null && prev.altitude !== null && this.lastAlt !== null) {
        const diff = pos.altitude - prev.altitude
        if (diff > 0 && diff < 50) this.elevationGain += diff
      }
      this.lastAlt = pos.altitude

      const dtSec = (pos.timestamp - prev.timestamp) / 1000
      let spdMs = pos.speed ?? 0
      if (pos.speed === null || pos.speed < 0) {
        spdMs = dtSec > 0 ? seg / dtSec : 0
      }
      this.liveSpeedMs = spdMs
      if (spdMs > this.maxSpeedMs) this.maxSpeedMs = spdMs

      sampleSpeed = spdMs
      this.samples.push({
        timeSec: (pos.timestamp - (this.startTimestamp ?? pos.timestamp)) / 1000,
        lat: pos.latitude,
        lon: pos.longitude,
        speed: sampleSpeed,
        alt: pos.altitude,
      })
    } else {
      this.liveSpeedMs = 0
    }

    this.lastPosition = pos
    return this.snapshot()
  }

  finish(): RideState {
    if (this.recording) {
      this.recording = false
      this.endTimestamp = Date.now()
    }
    return this.snapshot()
  }

  getSamples(): RideSample[] {
    return this.samples
  }

  getDistance(): number {
    return this.accumulatedDistance
  }

  getElevationGain(): number {
    return this.elevationGain
  }

  getStartPosition(): GPSPosition | null {
    return this.startPosition
  }

  snapshot(): RideState {
    const now = Date.now()
    const durationMs = this.recording
      ? now - (this.startTimestamp ?? now)
      : (this.endTimestamp ?? now) - (this.startTimestamp ?? now)
    const durationSec = Math.max(durationMs / 1000, 0.001)
    return {
      recording: this.recording,
      started: this.startTimestamp !== null,
      finished: this.endTimestamp !== null,
      liveSpeedMs: this.recording ? this.liveSpeedMs : 0,
      distance: this.accumulatedDistance,
      durationMs: Math.max(0, durationMs),
      maxSpeedMs: this.maxSpeedMs,
      avgSpeedMs: this.accumulatedDistance / durationSec,
      quality: this.quality,
      accuracy: this.accuracy,
      elevationGain: this.elevationGain,
      sampleCount: this.samples.length,
    }
  }
}

export function msToKmh(ms: number): number {
  return ms * MS_TO_KMH
}
