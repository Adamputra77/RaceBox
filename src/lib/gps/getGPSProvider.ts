import { BrowserGPSProvider } from './BrowserGPSProvider'
import { SimulatedGPSProvider } from './SimulatedGPSProvider'
import type { GPSProvider } from './GPSProvider'

let instance: GPSProvider | null = null

export function getGPSProvider(): GPSProvider {
  if (instance) return instance

  const useSimulation =
    import.meta.env.DEV && import.meta.env.VITE_DEV_GPS_SIMULATION === 'true'

  instance = useSimulation
    ? new SimulatedGPSProvider()
    : new BrowserGPSProvider()

  return instance
}
