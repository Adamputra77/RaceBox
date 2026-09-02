import type { GPSQuality } from './gps'

export type RaceMode = 'drag' | 'ride'

export type RaceState =
  | 'IDLE'
  | 'GPS_INITIALIZING'
  | 'GPS_READY'
  | 'READY'
  | 'WAITING_FOR_START'
  | 'RUNNING'
  | 'FINISHED'
  | 'ERROR'

export type VehicleType = 'motorcycle' | 'car'

export type SpeedUnit = 'kmh' | 'mph'
export type DistanceUnit = 'meter' | 'feet'
export type StartDetection = 'automatic' | 'manual'
export type ThemePref = 'dark' | 'corsa' | 'neon'

export interface Vehicle {
  id?: number
  name: string
  type: VehicleType
  brand: string
  model: string
  engine?: string
  weight?: number
  notes?: string
  createdAt: number
}

export interface GPSSample {
  t: number
  lat: number
  lon: number
  spd: number | null
  acc: number
}

export interface SplitTime {
  distance: number
  time: number
}

export interface RaceRecord {
  id?: number
  mode: RaceMode
  selectedDistance: number
  elapsedTime: number
  maxSpeed: number
  averageSpeed: number
  startTimestamp: number
  finishTimestamp: number
  gpsAccuracy: number
  gpsQuality: GPSQuality
  gpsSampleCount: number
  startLatitude: number
  startLongitude: number
  finishLatitude: number
  finishLongitude: number
  altitude: number | null
  source: 'GPS'
  vehicleId: number | null
  vehicleName?: string
  splits: SplitTime[]
  samples: GPSSample[]
  createdAt: number
}

export interface RideRecord {
  id?: number
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
  startTimestamp: number
  endTimestamp: number
  gpsAccuracy: number
  gpsQuality: GPSQuality
  gpsSampleCount: number
  startLatitude: number
  startLongitude: number
  endLatitude: number
  endLongitude: number
  vehicleId: number | null
  vehicleName?: string
  samples: GPSSample[]
  elevationGain: number
  createdAt: number
}

export interface Settings {
  id: number
  speedUnit: SpeedUnit
  distanceUnit: DistanceUnit
  startDetection: StartDetection
  startThresholdKmh: number
  gpsHighAccuracy: boolean
  theme: ThemePref
  installPromptDismissed: boolean
}
