import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { Card } from '@/components/Card'
import { SpeedChart } from './SpeedChart'
import {
  formatRaceTime,
  formatDuration,
  formatDate,
  formatDateTime,
} from '@/lib/utils/format'
import { convertKmhToMph } from '@/lib/calculations'
import { useSettings } from '@/hooks/useSettings'

export function HistoryDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') === 'ride' ? 'ride' : 'drag'
  const { settings } = useSettings()
  const isMph = settings.speedUnit === 'mph'

  const race = useLiveQuery(
    () => (type === 'drag' && id ? db.races.get(Number(id)) : undefined),
    [type, id],
  )
  const ride = useLiveQuery(
    () => (type === 'ride' && id ? db.rides.get(Number(id)) : undefined),
    [type, id],
  )

  const forMph = (kmh: number) => (isMph ? convertKmhToMph(kmh) : kmh)
  const unit = isMph ? 'MPH' : 'KM/H'

  if (type === 'drag' && race) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-4">
        <header className="flex items-center justify-between py-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            RESU<span className="text-[var(--color-race-red)]">LT</span>
          </h1>
          <Link to="/history" className="text-sm font-semibold text-[var(--color-race-red)]">
            ← Back
          </Link>
        </header>

        <Card className="mt-4 p-4 text-center">
          <p className="font-display text-5xl font-bold">
            {race.selectedDistance} M
          </p>
          <p className="mt-1 text-sm uppercase tracking-widest text-[var(--color-race-muted)]">
            Drag Race
          </p>
          <p className="mt-4 font-display text-6xl font-bold tabular-nums text-glow-red">
            {formatRaceTime(race.elapsedTime)}
          </p>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <DetailStat label="MAX SPEED" value={`${forMph(race.maxSpeed).toFixed(1)} ${unit}`} />
          <DetailStat label="AVG SPEED" value={`${forMph(race.averageSpeed).toFixed(1)} ${unit}`} />
          <DetailStat label="GPS QUALITY" value={race.gpsQuality} />
          <DetailStat label="GPS SAMPLES" value={String(race.gpsSampleCount)} />
        </div>

        {race.splits && race.splits.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
              Splits
            </h2>
            <Card className="divide-y divide-[var(--color-race-border)]">
              {race.splits.map((sp) => (
                <div key={sp.distance} className="flex justify-between px-4 py-2.5">
                  <span className="text-sm text-[var(--color-race-muted)]">
                    0-{sp.distance}m
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {sp.time.toFixed(2)} s
                  </span>
                </div>
              ))}
            </Card>
          </section>
        )}

        {race.samples && race.samples.length > 1 && (
          <>
            <section className="mt-5">
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
                Speed vs Distance
              </h2>
              <Card className="overflow-hidden p-2">
                <SpeedChart samples={race.samples} mode="distance" />
              </Card>
            </section>
            <section className="mt-5">
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
                Speed vs Time
              </h2>
              <Card className="overflow-hidden p-2">
                <SpeedChart samples={race.samples} mode="time" />
              </Card>
            </section>
          </>
        )}

        <section className="mt-5 pb-4">
          <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
            Details
          </h2>
          <Card className="divide-y divide-[var(--color-race-border)]">
            <DetailRow label="Date" value={formatDateTime(race.createdAt)} />
            <DetailRow label="Source" value={race.source} />
            <DetailRow
              label="GPS Accuracy"
              value={`±${race.gpsAccuracy.toFixed(1)} m`}
            />
            <DetailRow
              label="Start"
              value={`${race.startLatitude.toFixed(5)}, ${race.startLongitude.toFixed(5)}`}
            />
            <DetailRow
              label="Finish"
              value={`${race.finishLatitude.toFixed(5)}, ${race.finishLongitude.toFixed(5)}`}
            />
            <DetailRow
              label="Vehicle"
              value={race.vehicleName ?? 'None'}
            />
          </Card>
        </section>

        <div className="mb-4 flex">
          <Link
            to={`/compare?target=${race.id}`}
            className="w-full rounded-xl bg-[var(--color-race-red)] py-3 text-center text-sm font-bold uppercase tracking-wide text-white"
          >
            Compare
          </Link>
        </div>
      </div>
    )
  }

  if (type === 'ride' && ride) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-4">
        <header className="flex items-center justify-between py-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            RID<span className="text-[var(--color-race-red)]">E</span>
          </h1>
          <Link to="/history" className="text-sm font-semibold text-[var(--color-race-red)]">
            ← Back
          </Link>
        </header>

        <Card className="mt-4 p-4 text-center">
          <p className="font-display text-5xl font-bold">
            {(ride.distance / 1000).toFixed(2)} km
          </p>
          <p className="mt-1 text-sm uppercase tracking-widest text-[var(--color-race-muted)]">
            Ride
          </p>
          <p className="mt-4 font-display text-4xl font-bold tabular-nums">
            {formatDuration(ride.duration)}
          </p>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <DetailStat label="AVG SPEED" value={`${forMph(ride.averageSpeed).toFixed(1)} ${unit}`} />
          <DetailStat label="MAX SPEED" value={`${forMph(ride.maxSpeed).toFixed(1)} ${unit}`} />
          <DetailStat label="GPS QUALITY" value={ride.gpsQuality} />
          <DetailStat label="ELEVATION" value={`+${ride.elevationGain.toFixed(0)} m`} />
        </div>

        {ride.samples && ride.samples.length > 1 && (
          <>
            <section className="mt-5">
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
                Speed vs Time
              </h2>
              <Card className="overflow-hidden p-2">
                <SpeedChart samples={ride.samples} mode="time" />
              </Card>
            </section>
            <section className="mt-5">
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
                Speed vs Distance
              </h2>
              <Card className="overflow-hidden p-2">
                <SpeedChart samples={ride.samples} mode="distance" />
              </Card>
            </section>
          </>
        )}

        <section className="mt-5 pb-4">
          <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-[var(--color-race-muted)]">
            Details
          </h2>
          <Card className="divide-y divide-[var(--color-race-border)]">
            <DetailRow label="Date" value={formatDate(ride.createdAt)} />
            <DetailRow label="Source" value="GPS" />
            <DetailRow label="GPS Accuracy" value={`±${ride.gpsAccuracy.toFixed(1)} m`} />
            <DetailRow label="Samples" value={String(ride.gpsSampleCount)} />
          </Card>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <p className="py-10 text-center text-sm text-[var(--color-race-muted)]">
        Data tidak ditemukan.
      </p>
      <Link
        to="/history"
        className="block text-center text-sm font-semibold text-[var(--color-race-red)]"
      >
        ← Back to History
      </Link>
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs uppercase tracking-wider text-[var(--color-race-muted)]">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}
