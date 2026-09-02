import type { GPSPosition, GPSQuality } from '@/types/gps'
import type { RaceState, SplitTime } from '@/types'
import {
  haversineDistance,
  interpolateFinishTime,
  detectSplitTimes,
  calculateQuality,
} from '@/lib/calculations'
import { DRAG_SPLIT_DISTANCES, MS_TO_KMH } from '@/lib/utils/constants'

interface RaceSample {
  timeMs: number
  timeSec: number
  distance: number
  lat: number
  lon: number
  speed: number | null
}

export interface RaceEngineState {
  phase: RaceState
  distanceMeters: number
  timeMs: number
  maxSpeedMs: number
  waypointPositions: GPSPosition[]
  startPosition: GPSPosition | null
  finishPosition: GPSPosition | null
  samples: RaceSample[]
  finished: boolean
  finishTimeSec: number | null
  accuracy: number
  quality: GPSQuality | null
  lastPosition: GPSPosition | null
  splits: SplitTime[]
}

export interface StartConfig {
  distanceMeters: number
  startThresholdKmh: number
  automaticStart: boolean
}

export class RaceEngine {
  private distanceMeters: number
  private startThresholdMs: number
  private automaticStart: boolean
  private startTimestamp: number | null = null
  private startPosition: GPSPosition | null = null
  private lastAccepted: GPSPosition | null = null
  private prevSample: RaceSample | null = null
  private accumulatedDistance = 0
  private maxSpeedMs = 0
  private phase: RaceState = 'IDLE'
  private waypoints: GPSPosition[] = []
  private samples: RaceSample[] = []
  private finished = false
  private finishPosition: GPSPosition | null = null
  private finishTimeSec: number | null = null
  private acrossFinish: { timeSec: number; distance: number } | null = null
  private quality: GPSQuality | null = null
  private splits: SplitTime[] = []
  private latestAccuracy = 0

  constructor(config: StartConfig) {
    this.distanceMeters = config.distanceMeters
    this.startThresholdMs = config.startThresholdKmh / MS_TO_KMH
    this.automaticStart = config.automaticStart
  }

  setPhase(phase: RaceState) {
    this.phase = phase
  }

  getPhase(): RaceState {
    return this.phase
  }

  arm() {
    this.phase = 'WAITING_FOR_START'
    this.startTimestamp = null
    this.startPosition = null
    this.lastAccepted = null
    this.prevSample = null
    this.accumulatedDistance = 0
    this.maxSpeedMs = 0
    this.waypoints = []
    this.samples = []
    this.finished = false
    this.finishPosition = null
    this.finishTimeSec = null
    this.acrossFinish = null
    this.splits = []
    this.latestAccuracy = 0
  }

  startManual(): RaceEngineState | null {
    if (this.phase !== 'WAITING_FOR_START' || this.startTimestamp) return null
    if (!this.lastAccepted) return null
    const now = Date.now()
    this.beginRace()
    return this.snapshot(now)
  }

  private beginRace() {
    this.startTimestamp = Date.now()
    this.startPosition = this.lastAccepted
    this.prevSample = {
      timeMs: this.startTimestamp,
      timeSec: 0,
      distance: 0,
      lat: this.lastAccepted!.latitude,
      lon: this.lastAccepted!.longitude,
      speed: null,
    }
    this.samples.push(this.prevSample)
    this.waypoints.push(this.lastAccepted!)
    this.phase = 'RUNNING'
  }

  handlePosition(position: GPSPosition): RaceEngineState {
    this.updateQuality(position.accuracy)
    this.latestAccuracy = position.accuracy

    const now = Date.now()
    const timeMs = this.startTimestamp !== null ? now - this.startTimestamp : 0

    if (this.finished) return this.snapshot(now)

    // WAITING_FOR_START phase
    if (this.startTimestamp === null) {
      this.lastAccepted = position
      const speedMs = this.resolveSpeed(position)
      if (this.automaticStart && speedMs >= this.startThresholdMs) {
        this.beginRace()
      }
      return this.snapshot(now)
    }

    // RUNNING phase
    const prev = this.prevSample
    if (!prev) return this.snapshot(now)

    const segmentDistance = haversineDistance(
      { latitude: prev.lat, longitude: prev.lon },
      position,
    )

    const speedMs = this.resolveSpeed(position)
    if (speedMs > this.maxSpeedMs) this.maxSpeedMs = speedMs

    this.accumulatedDistance += segmentDistance
    this.lastAccepted = position
    this.waypoints.push(position)

    const sample: RaceSample = {
      timeMs: now,
      timeSec: timeMs / 1000,
      distance: this.accumulatedDistance,
      lat: position.latitude,
      lon: position.longitude,
      speed: speedMs,
    }
    this.samples.push(sample)

    if (!this.finished && this.accumulatedDistance >= this.distanceMeters) {
      this.finishDetection(sample)
    }

    this.prevSample = sample

    return this.snapshot(now)
  }

  private finishDetection(sample: RaceSample) {
    if (this.prevSample && !this.acrossFinish) {
      const prev = this.prevSample
      if (prev.distance < this.distanceMeters) {
        this.acrossFinish = {
          timeSec: interpolateFinishTime(
            { timeSec: prev.timeSec, distanceMeters: prev.distance },
            { timeSec: sample.timeSec, distanceMeters: sample.distance },
            this.distanceMeters,
          ),
          distance: sample.distance,
        }
      } else {
        this.acrossFinish = { timeSec: sample.timeSec, distance: sample.distance }
      }
    }

    this.finished = true
    this.finishTimeSec = this.acrossFinish ? this.acrossFinish.timeSec : sample.timeSec
    this.finishPosition = {
      latitude: sample.lat,
      longitude: sample.lon,
      altitude: null,
      accuracy: this.latestAccuracy || 10,
      speed: null,
      heading: null,
      timestamp: Date.now(),
    }
    this.phase = 'FINISHED'
    this.splits = detectSplitTimes(
      this.samples.map((s) => ({ timeSec: s.timeSec, distanceMeters: s.distance })),
      DRAG_SPLIT_DISTANCES.filter((d) => d <= this.distanceMeters),
    )
  }

  private resolveSpeed(position: GPSPosition): number {
    if (position.speed !== null && position.speed >= 0) return position.speed
    const prev = this.prevSample
    if (prev) {
      const dtSec = (Date.now() - prev.timeMs) / 1000
      if (dtSec > 0) {
        return haversineDistance(
          { latitude: prev.lat, longitude: prev.lon },
          position,
        ) / dtSec
      }
    }
    return 0
  }

  private updateQuality(accuracy: number) {
    this.quality = calculateQuality(accuracy)
  }

  private snapshot(now: number): RaceEngineState {
    const timeMs = this.startTimestamp !== null ? now - this.startTimestamp : 0
    return {
      phase: this.phase,
      distanceMeters: this.accumulatedDistance,
      timeMs,
      maxSpeedMs: this.maxSpeedMs,
      waypointPositions: this.waypoints,
      startPosition: this.startPosition,
      finishPosition: this.finishPosition,
      samples: this.samples,
      finished: this.finished,
      finishTimeSec: this.finishTimeSec,
      accuracy: this.latestAccuracy || 0,
      quality: this.quality,
      lastPosition: this.lastAccepted,
      splits: this.splits,
    }
  }
}
