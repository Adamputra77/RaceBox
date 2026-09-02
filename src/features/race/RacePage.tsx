import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGPS } from '@/hooks/useGPS'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { GPSStatusChip } from '@/components/GPSStatusChip'
import { convertSpeed, convertAccumulatedDistance } from '@/lib/calculations'
import { DRAG_DISTANCES } from '@/lib/utils/constants'

export function RacePage() {
  const { status, position, quality, errorMessage, enableGPS, start } = useGPS()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const presetParam = searchParams.get('distance')
  const initialIndex = DRAG_DISTANCES.findIndex((d) => String(d) === presetParam)
  const [selected, setSelected] = useState<number | 'custom'>(
    initialIndex >= 0 ? DRAG_DISTANCES[initialIndex] : (presetParam === 'custom' ? 'custom' : DRAG_DISTANCES[3]),
  )
  const [customValue, setCustomValue] = useState('250')

  const speed = position?.speed ? convertSpeed(position.speed, settings.speedUnit) : null
  const needsPermission = status === 'permission_denied' || status === 'unsupported'

  const targetDistance = selected === 'custom' ? Number(customValue) : selected

  const canStart = !needsPermission && status === 'connected' && targetDistance > 0

  const startDrag = () => {
    if (!canStart) return
    start()
    // Wait a moment to lock GPS then navigate
    navigate(`/race/live?distance=${encodeURIComponent(String(targetDistance))}`)
  }

  const gpSamples = useMemo(
    () => (status === 'connected' ? 'LOCKED' : '--'),
    [status],
  )

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          DRAG <span className="text-[var(--color-race-red)]">TIMER</span>
        </h1>
        <GPSStatusChip />
      </header>

      {needsPermission && (
        <Card className="mt-4 border-[var(--color-race-red)/40] p-4">
          <p className="text-sm font-semibold text-[var(--color-race-red2)]">
            LOCATION PERMISSION REQUIRED
          </p>
          <p className="mt-1 text-xs text-[var(--color-race-muted)]">{errorMessage}</p>
          <Button full className="mt-3" onClick={enableGPS}>
            ENABLE GPS
          </Button>
        </Card>
      )}

      {errorMessage && !needsPermission && (
        <Card className="mt-4 border-[var(--color-race-red)/30] p-3">
          <p className="text-xs text-[var(--color-race-red2)]">{errorMessage}</p>
        </Card>
      )}

      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-widest">Current Speed</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold tabular-nums text-glow-red">
              {speed ? speed.value.toFixed(0) : '0'}
            </span>
            <span className="text-xs font-semibold text-[var(--color-race-muted)]">
              {speed?.unit ?? 'KM/H'}
            </span>
          </div>
        </div>
        {status === 'connected' && quality && (
          <p className="mt-2 text-[11px] uppercase tracking-widest text-[var(--color-race-muted)]">
            GPS {quality}
          </p>
        )}
      </Card>

      <section className="mt-5">
        <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
          Select Distance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {DRAG_DISTANCES.map((d) => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`flex h-14 flex-col items-center justify-center rounded-xl border transition-colors ${
                selected === d
                  ? 'border-[var(--color-race-red)] bg-[var(--color-race-red)]/15'
                  : 'border-[var(--color-race-border)] bg-[var(--color-race-card)]'
              }`}
            >
              <span className="text-base font-bold">
                {convertAccumulatedDistance(d, settings.distanceUnit).value.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase text-[var(--color-race-muted)]">
                {convertAccumulatedDistance(d, settings.distanceUnit).unit}
              </span>
            </button>
          ))}
          <button
            onClick={() => setSelected('custom')}
            className={`col-span-3 flex h-14 items-center justify-center rounded-xl border transition-colors ${
              selected === 'custom'
                ? 'border-[var(--color-race-red)] bg-[var(--color-race-red)]/15'
                : 'border-dashed border-[var(--color-race-border)] bg-[var(--color-race-card)]'
            }`}
          >
            <span className="text-base font-bold">CUSTOM</span>
          </button>
        </div>
      </section>

      {selected === 'custom' && (
        <Card className="mt-4 p-4">
          <label className="text-sm font-semibold uppercase tracking-wider">
            Custom Distance (meter)
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={2000}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="h-12 w-full flex-1 rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card2)] px-4 text-lg font-bold tabular-nums outline-none focus:border-[var(--color-race-red)]"
            />
            <span className="text-sm text-[var(--color-race-muted)]">m</span>
          </div>
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
          GPS LOCK: {gpSamples}
        </p>
        {status === 'connected' && position && (
          <p className="text-xs text-[var(--color-race-muted)]">
            Accuracy: ±{position.accuracy.toFixed(1)}m
          </p>
        )}
      </div>

      <Button full size="xl" className="mt-3" disabled={!canStart} onClick={startDrag}>
        START DRAG
      </Button>

      <p className="mt-3 px-1 text-center text-[11px] leading-relaxed text-[var(--color-race-muted)]">
        GPS-based measurement. Accuracy depends on device GPS, signal quality, and
        environment.
      </p>
    </div>
  )
}
