export interface GPSPosition {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  speed: number | null
  heading: number | null
  timestamp: number
}

export type GPSPermissionState =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'timeout'

export type GPSStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'LOCKING'
  | 'LOCKED'
  | 'PERMISSION_PROMPT'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'WEAK_SIGNAL'
  | 'ERROR'

export type GPSQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
