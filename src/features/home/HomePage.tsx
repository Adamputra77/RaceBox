import { Link, useNavigate } from 'react-router-dom'
import { useGPS } from '@/hooks/useGPS'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { GPSStatusChip } from '@/components/GPSStatusChip'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import {
  convertSpeed,
} from '@/lib/calculations'
import {
  formatRaceTime,
  formatDateTime,
} from '@/lib/utils/format'
import { DRAG_DISTANCES } from '@/lib/utils/constants'

export function HomePage() {
  const { status, position, errorMessage, enableGPS } = useGPS()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const recentRaces = useLiveQuery(() =>
    db.races.orderBy('createdAt').reverse().limit(3).toArray(),
    [],
  )

  const needsPermission = status === 'permission_denied' || status === 'unsupported'

  const speed = position?.speed ? convertSpeed(position.speed, settings.speedUnit) : null

  const accuracy = position?.accuracy

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="flex items-center justify-between py-1">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            RACE<span className="text-[var(--color-race-red)]">BOX</span>
          </h1>
          <GPSStatusChip />
        </div>
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

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-col items-center gap-1 px-4 py-6">
          {status === 'permission_denied' || status === 'unsupported' || status === 'connecting' ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-race-muted)]">
              GPS: {status === 'connecting' ? 'CONNECTING' : 'NOT AVAILABLE'}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-race-green)]" />
                <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-race-green)]">
                  CONNECTED
                </span>
              </div>
              <p className="mt-3 text-xs text-[var(--color-race-muted)]">
                Accuracy: ± {accuracy !== undefined && accuracy !== null ? accuracy.toFixed(1) : '--'} m
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-6xl font-bold tabular-nums text-glow-red">
                  {speed ? speed.value.toFixed(0) : '0'}
                </span>
                <span className="text-sm font-semibold text-[var(--color-race-muted)]">
                  {speed?.unit ?? 'KM/H'}
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-race-muted)]">
                Current Speed
              </p>
            </>
          )}
        </div>
      </Card>

      <section className="mt-5">
        <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
          Quick Race
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {DRAG_DISTANCES.map((d) => (
            <button
              key={d}
              onClick={() => navigate(`/race?distance=${d}`)}
              className="flex h-16 flex-col items-center justify-center rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] transition-colors active:border-[var(--color-race-red)]"
            >
              <span className="text-sm font-bold">{d}</span>
              <span className="text-[10px] uppercase text-[var(--color-race-muted)]">m</span>
            </button>
          ))}
          <button
            onClick={() => navigate('/race?distance=custom')}
            className="flex h-16 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-race-border)] bg-[var(--color-race-card)] transition-colors active:border-[var(--color-race-red)]"
          >
            <span className="text-xs font-bold">CUSTOM</span>
          </button>
        </div>
      </section>

      <Card className="mt-5 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
          Ride Recorder
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="Distance" value="0.00 km" />
          <Stat label="Duration" value="00:00:00" />
          <Stat label="Avg Speed" value="0.0 km/h" />
        </div>
        <Link to="/ride">
          <Button full className="mt-4">
            START RIDE
          </Button>
        </Link>
      </Card>

      <section className="mt-5 pb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
            Recent Race
          </h2>
          <Link to="/history" className="text-xs font-semibold text-[var(--color-race-red)]">
            SEE ALL
          </Link>
        </div>
        {recentRaces && recentRaces.length > 0 ? (
          <div className="space-y-2">
            {recentRaces.map((r) => (
              <Link key={r.id} to={`/history/${r.id}`}>
                <Card className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-race-red)]">
                      DRAG · {r.selectedDistance} M
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-race-muted)]">
                      {formatDateTime(r.createdAt)} · GPS ±{r.gpsAccuracy.toFixed(1)}m
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold tabular-nums">
                      {formatRaceTime(r.elapsedTime)}
                    </p>
                    <p className="text-[10px] uppercase text-[var(--color-race-muted)]">
                      {r.maxSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center text-sm text-[var(--color-race-muted)]">
            Belum ada balapan. Mulai drag pertamamu!
          </Card>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-race-muted)]">
        {label}
      </p>
    </div>
  )
}
