import type { GPSPosition } from '@/types/gps'
import type { GPSProvider, GPSWatchOptions } from './GPSProvider'

const SIM_VELOCITY_PROFILE = [0, 5, 20, 50, 80, 100, 120, 140, 120, 90, 60, 30, 0]

function kmhToMs(kmh: number): number {
  return kmh / 3.6
}

export class SimulatedGPSProvider implements GPSProvider {
  readonly name = 'simulated'
  private timer: ReturnType<typeof setInterval> | null = null
  private positionCallback: ((position: GPSPosition) => void) | null = null
  private time = 0
  private stepIndex = 0
  private lat = -6.2
  private lon = 106.8
  private speedMs = 0

  isSupported(): boolean {
    return true
  }

  async requestPermission(): Promise<boolean> {
    return true
  }

  startWatching(_options: GPSWatchOptions): void {
    this.stopWatching()
    this.time = 0
    this.stepIndex = 0

    this.timer = setInterval(() => {
      this.time += 1 / 10

      if (this.time > 30) {
        this.stepIndex = Math.min(
          this.stepIndex + 1,
          SIM_VELOCITY_PROFILE.length - 1,
        )
        this.time = 0
      }

      const targetKmh = SIM_VELOCITY_PROFILE[this.stepIndex] ?? 0
      const targetMs = kmhToMs(targetKmh)
      this.speedMs += (targetMs - this.speedMs) * 0.25

      this.lat += this.speedMs * 0.1 * 0.00000899
      this.lon += this.speedMs * 0.1 * 0.00000899 * 1.1

      this.positionCallback?.({
        latitude: this.lat,
        longitude: this.lon,
        altitude: 80 + Math.sin(this.time) * 5,
        accuracy: 2.5 + Math.random() * 1.5,
        speed: this.speedMs,
        heading: 90,
        timestamp: Date.now(),
      })
    }, 100)
  }

  stopWatching(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  onPosition(callback: (position: GPSPosition) => void): void {
    this.positionCallback = callback
  }

  onError(_callback: (code: number, message: string) => void): void {
    // No-op: simulation has no errors
  }
}
