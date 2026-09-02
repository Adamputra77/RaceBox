import type { GPSPosition } from '@/types/gps'

export interface GPSWatchOptions {
  enableHighAccuracy: boolean
  maximumAge: number
  timeout: number
}

export interface GPSProvider {
  readonly name: string
  isSupported(): boolean
  requestPermission(): Promise<boolean>
  startWatching(options: GPSWatchOptions): void
  stopWatching(): void
  onPosition(callback: (position: GPSPosition) => void): void
  onError(callback: (code: number, message: string) => void): void
}
