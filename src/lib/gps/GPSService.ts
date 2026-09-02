import type { GPSPosition, GPSQuality } from '@/types/gps'
import type { GPSProvider, GPSWatchOptions } from './GPSProvider'
import { GPS_CONFIG, MS_TO_KMH } from '@/lib/utils/constants'
import { calculateDistance, haversineDistance } from '@/lib/calculations/distance'
import { calculateQuality } from '@/lib/calculations/quality'

export type GPSEvent =
  | { type: 'position'; position: GPSPosition }
  | { type: 'locked'; position: GPSPosition }
  | { type: 'error'; message: string }
  | { type: 'quality'; quality: GPSQuality }

const WATCH_OPTIONS: GPSWatchOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
}

export class GPSService {
  private provider: GPSProvider
  private listeners: Array<(event: GPSEvent) => void> = []
  private lastPosition: GPSPosition | null = null
  private lastAcceptedPosition: GPSPosition | null = null
  private isWatching = false

  constructor(provider: GPSProvider) {
    this.provider = provider
    this.provider.onPosition(this.handlePosition.bind(this))
    this.provider.onError(this.handleError.bind(this))
  }

  get name(): string {
    return this.provider.name
  }

  isSupported(): boolean {
    return this.provider.isSupported()
  }

  isActive(): boolean {
    return this.isWatching
  }

  async requestPermission(): Promise<boolean> {
    return await this.provider.requestPermission()
  }

  start(): void {
    if (this.isWatching) return
    this.isWatching = true
    this.lastPosition = null
    this.lastAcceptedPosition = null
    this.provider.startWatching(WATCH_OPTIONS)
  }

  stop(): void {
    if (!this.isWatching) return
    this.isWatching = false
    this.provider.stopWatching()
  }

  subscribe(listener: (event: GPSEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getLastPosition(): GPSPosition | null {
    return this.lastPosition
  }

  private handlePosition(position: GPSPosition): void {
    this.emit({ type: 'position', position })

    this.lastPosition = position

    if (!this.isWatching) return

    if (!this.lastAcceptedPosition) {
      // First valid position. Accept if accuracy reasonable.
      if (position.accuracy <= Math.max(GPS_CONFIG.MIN_ACCURACY_ACCEPT_METERS, 100)) {
        this.lastAcceptedPosition = position
        this.emit({ type: 'locked', position })
      }
      return
    }

    const prev = this.lastAcceptedPosition
    const rawSpeedMs = position.speed
    const dtMs = position.timestamp - prev.timestamp
    const dtSec = dtMs / 1000

    const fallbackSpeedMs = dtSec > 0 ? haversineDistance(prev, position) / dtSec : 0
    const effectiveSpeedMs =
      rawSpeedMs !== null && rawSpeedMs >= 0 ? rawSpeedMs : fallbackSpeedMs

    const effectiveSpeedKmh = effectiveSpeedMs * MS_TO_KMH

    const isJump = this.isReasonableJump(prev, position, effectiveSpeedKmh, dtMs)

    if (isJump) {
      this.lastPosition = prev
      return
    }

    this.lastAcceptedPosition = position

    const quality = calculateQuality(position.accuracy)
    this.emit({ type: 'quality', quality })
  }

  private isReasonableJump(
    prev: GPSPosition,
    current: GPSPosition,
    speedKmh: number,
    dtMs: number,
  ): boolean {
    const distanceMeters = haversineDistance(prev, current)

    if (speedKmh > GPS_CONFIG.MAX_REASONABLE_SPEED_KMH) return true

    if (dtMs < GPS_CONFIG.MIN_ELAPSED_TIME_FOR_JUMP_MS) {
      const maxReasonableDistance =
        (GPS_CONFIG.MAX_REASONABLE_SPEED_KMH / MS_TO_KMH) * (dtMs / 1000)
      if (distanceMeters > maxReasonableDistance) return true
    }

    const prevSpeed = prev.speed ?? 0

    if (prevSpeed * MS_TO_KMH < GPS_CONFIG.MIN_SPEED_FOR_JUMP_CHECK_KMH) {
      if (
        dtMs > 0 &&
        distanceMeters > GPS_CONFIG.MAX_POSITION_JUMP_METERS &&
        dtMs < GPS_CONFIG.MIN_ELAPSED_TIME_FOR_JUMP_MS
      ) {
        return true
      }
    }

    return false
  }

  private handleError(code: number, message: string): void {
    this.emit({
      type: 'error',
      message: formatGeoError(code, message),
    })
  }

  private emit(event: GPSEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export function formatGeoError(code: number, message: string): string {
  switch (code) {
    case 1:
      return 'GPS permission ditolak. Aktifkan Location untuk menggunakan RaceBox.'
    case 2:
      return 'GPS tidak tersedia di perangkat ini.'
    case 3:
      return 'Waktu GPS habis. Pastikan kamu berada di area terbuka.'
    default:
      return `Error GPS: ${message || 'unknown'}`
  }
}

export { calculateDistance }
