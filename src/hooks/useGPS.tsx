import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { GPSPosition, GPSQuality } from '@/types/gps'
import { GPSService } from '@/lib/gps/GPSService'
import { getGPSProvider } from '@/lib/gps/getGPSProvider'

export type GPSStatus =
  | 'permission_prompt'
  | 'permission_denied'
  | 'unsupported'
  | 'connecting'
  | 'connected'
  | 'error'

interface GPSContextValue {
  service: GPSService
  status: GPSStatus
  position: GPSPosition | null
  quality: GPSQuality | null
  errorMessage: string | null
  enableGPS: () => Promise<void>
  start: () => void
  stop: () => void
  isActive: boolean
  providerName: string
}

const GPSContext = createContext<GPSContextValue | null>(null)

export function GPSProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<GPSService | null>(null)
  const [status, setStatus] = useState<GPSStatus>('connecting')
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [quality, setQuality] = useState<GPSQuality | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  if (!serviceRef.current) {
    serviceRef.current = new GPSService(getGPSProvider())
  }
  const service = serviceRef.current

  useEffect(() => {
    const unsub = service.subscribe((event) => {
      if (event.type === 'position') {
        setPosition(event.position)
        setStatus('connected')
        setErrorMessage(null)
      } else if (event.type === 'locked') {
        setStatus('connected')
      } else if (event.type === 'quality') {
        setQuality(event.quality)
      } else if (event.type === 'error') {
        setErrorMessage(event.message)
        setStatus('error')
      }
    })
    return unsub
  }, [service])

  const enableGPS = useCallback(async () => {
    const svc = serviceRef.current!
    if (!svc.isSupported()) {
      setStatus('unsupported')
      setErrorMessage('Perangkat/browser ini tidak mendukung GPS.')
      return
    }
    setStatus('connecting')
    const granted = await svc.requestPermission()
    if (!granted) {
      setStatus('permission_denied')
      setErrorMessage(
        'GPS permission ditolak. Aktifkan Location untuk menggunakan RaceBox.',
      )
      return
    }
    svc.start()
    setIsActive(true)
  }, [])

  const start = useCallback(() => {
    const svc = serviceRef.current!
    if (!svc.isActive()) {
      svc.start()
      setIsActive(true)
    }
  }, [])

  const stop = useCallback(() => {
    const svc = serviceRef.current!
    svc.stop()
    setIsActive(false)
  }, [])

  const value = useMemo(
    () => ({ service, status, position, quality, errorMessage, enableGPS, start, stop, isActive, providerName: service.name }),
    [service, status, position, quality, errorMessage, enableGPS, start, stop, isActive],
  )

  // Auto-request permission on mount
  useEffect(() => {
    void enableGPS()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <GPSContext.Provider value={value}>{children}</GPSContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGPS(): GPSContextValue {
  const ctx = useContext(GPSContext)
  if (!ctx) throw new Error('useGPS must be used within GPSProvider')
  return ctx
}
