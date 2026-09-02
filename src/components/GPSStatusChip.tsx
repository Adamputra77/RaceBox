import { useGPS } from '@/hooks/useGPS'
import type { GPSQuality } from '@/types/gps'

const QUALITY_COLOR: Record<GPSQuality, string> = {
  EXCELLENT: 'bg-[var(--color-race-green)]',
  GOOD: 'bg-[var(--color-race-green)]',
  FAIR: 'bg-[var(--color-race-yellow)]',
  POOR: 'bg-[var(--color-race-red)]',
}

const QUALITY_LABEL: Record<GPSQuality, string> = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
}

export function GPSStatusChip() {
  const { status, quality } = useGPS()

  let color = 'bg-[var(--color-race-muted)]'
  let label = 'CONNECTING'

  if (status === 'connected') {
    color = quality ? QUALITY_COLOR[quality] : 'bg-[var(--color-race-muted)]'
    label = quality ? QUALITY_LABEL[quality] : 'CONNECTED'
  } else if (status === 'permission_denied' || status === 'unsupported') {
    color = 'bg-[var(--color-race-red)]'
    label = 'NO GPS'
  } else if (status === 'error') {
    color = 'bg-[var(--color-race-red)]'
    label = 'ERROR'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color} ${status === 'connected' ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-bold tracking-widest">{label}</span>
    </div>
  )
}
