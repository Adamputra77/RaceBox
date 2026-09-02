import type { GPSPosition } from '@/types/gps'
import type { GPSProvider, GPSWatchOptions } from './GPSProvider'

export class BrowserGPSProvider implements GPSProvider {
  readonly name = 'browser'
  private watchId: number | null = null
  private positionCallback: ((position: GPSPosition) => void) | null = null
  private errorCallback: ((code: number, message: string) => void) | null = null

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        })
        if (result.state === 'granted') return true
        if (result.state === 'denied') return false
      } catch {
        // fall through to geolocation.request
      }
    }

    return await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    })
  }

  startWatching(options: GPSWatchOptions): void {
    if (!this.isSupported()) return
    this.stopWatching()

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = pos.coords
        this.positionCallback?.({
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude ?? null,
          accuracy: coords.accuracy,
          speed:
            coords.speed !== null && coords.speed !== undefined && coords.speed >= 0
              ? coords.speed
              : null,
          heading: coords.heading ?? null,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        this.errorCallback?.(err.code, err.message)
      },
      options,
    )
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  onPosition(callback: (position: GPSPosition) => void): void {
    this.positionCallback = callback
  }

  onError(callback: (code: number, message: string) => void): void {
    this.errorCallback = callback
  }
}
