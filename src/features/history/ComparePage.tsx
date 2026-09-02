import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { Card } from '@/components/Card'
import { formatRaceTime, formatDate } from '@/lib/utils/format'
import { convertKmhToMph } from '@/lib/calculations'
import { useSettings } from '@/hooks/useSettings'

export function ComparePage() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const targetParam = searchParams.get('target')
  const isMph = settings.speedUnit === 'mph'

  const races = useLiveQuery(() => db.races.toArray(), [])
  const dragRaces = useMemo(
    () => (races ?? []).filter((r) => r.mode === 'drag').sort((a, b) => b.createdAt - a.createdAt),
    [races],
  )

  const [runA, setRunA] = useState<number | 'none'>(
    targetParam ? Number(targetParam) : 'none',
  )
  const [runB, setRunB] = useState<number | 'none'>('none')

  const raceA = dragRaces.find((r) => r.id === runA)
  const raceB = dragRaces.find((r) => r.id === runB)

  const comparison = useMemo(() => {
    if (!raceA || !raceB) return null
    const timeA = raceA.elapsedTime
    const timeB = raceB.elapsedTime
    const speedA = raceA.maxSpeed
    const speedB = raceB.maxSpeed
    return {
      timeDiff: timeA - timeB,
      speedDiff: speedA - speedB,
      faster: timeA < timeB ? 'RUN A' : timeA > timeB ? 'RUN B' : 'TIE',
    }
  }, [raceA, raceB])

  const fmtSpeed = (kmh: number) => {
    const v = isMph ? convertKmhToMph(kmh) : kmh
    return `${v.toFixed(1)} ${isMph ? 'mph' : 'km/h'}`
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="flex items-center justify-between py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          COMPA<span className="text-[var(--color-race-red)]">RE</span>
        </h1>
        <Link to="/history" className="text-sm font-semibold text-[var(--color-race-red)]">
          ← Back
        </Link>
      </header>

      <p className="mt-3 text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
        Select 2 drag runs
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <RunPicker
          label="RUN #1"
          races={dragRaces}
          value={runA}
          onChange={setRunA}
          excluded={runB}
        />
        <RunPicker
          label="RUN #2"
          races={dragRaces}
          value={runB}
          onChange={setRunB}
          excluded={runA}
        />
      </div>

      {comparison && raceA && raceB && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <RunCard
              title="RUN #1"
              distance={raceA.selectedDistance}
              time={raceA.elapsedTime}
              speed={fmtSpeed(raceA.maxSpeed)}
              active={comparison.faster === 'RUN A'}
            />
            <RunCard
              title="RUN #2"
              distance={raceB.selectedDistance}
              time={raceB.elapsedTime}
              speed={fmtSpeed(raceB.maxSpeed)}
              active={comparison.faster === 'RUN B'}
            />
          </div>

          <Card className="p-4">
            <Row label="WINNER" value={comparison.faster} />
            <Row
              label="TIME DIFFERENCE"
              value={`${comparison.timeDiff >= 0 ? '-' : '+'}${Math.abs(comparison.timeDiff).toFixed(2)} s`}
              negative={comparison.timeDiff > 0}
            />
            <Row
              label="SPEED DIFFERENCE"
              value={`${comparison.speedDiff >= 0 ? '+' : ''}${comparison.speedDiff.toFixed(1)} ${isMph ? 'mph' : 'km/h'}`}
            />
          </Card>

          {raceA.splits.length > 0 && raceB.splits.length > 0 && (
            <Card className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
                Split Comparison
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-race-border)] text-[10px] uppercase tracking-wider text-[var(--color-race-muted)]">
                      <th className="py-1.5">Split</th>
                      <th className="py-1.5">Run #1</th>
                      <th className="py-1.5">Run #2</th>
                      <th className="py-1.5">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raceA.splits.map((sp) => {
                      const matchB = raceB.splits.find((b) => b.distance === sp.distance)
                      if (!matchB) return null
                      const d = sp.time - matchB.time
                      return (
                        <tr key={sp.distance} className="border-b border-[var(--color-race-border)]/40">
                          <td className="py-1.5 font-semibold">{sp.distance}m</td>
                          <td className="py-1.5 tabular-nums">{sp.time.toFixed(2)}</td>
                          <td className="py-1.5 tabular-nums">{matchB.time.toFixed(2)}</td>
                          <td className={`py-1.5 tabular-nums ${d > 0 ? 'text-[var(--color-race-green)]' : 'text-[var(--color-race-red2)]'}`}>
                            {d > 0 ? '-' : '+'}{Math.abs(d).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function RunPicker({
  label,
  races,
  value,
  onChange,
  excluded,
}: {
  label: string
  races: Array<{
    id?: number
    createdAt: number
    selectedDistance: number
    elapsedTime: number
  }>
  value: number | 'none'
  onChange: (v: number | 'none') => void
  excluded: number | 'none'
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
        {label}
      </p>
      <select
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value === 'none' ? 'none' : Number(e.target.value)
          onChange(v)
        }}
        className="w-full rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] px-3 py-3 text-sm font-semibold"
      >
        <option value="none">Select...</option>
        {races
          .filter((r) => r.id !== (excluded === 'none' ? undefined : excluded))
          .map((r) => (
            <option key={r.id} value={r.id}>
              {formatDate(r.createdAt)} · {r.selectedDistance}m · {formatRaceTime(r.elapsedTime)}
            </option>
          ))}
      </select>
    </div>
  )
}

function RunCard({
  title,
  distance,
  time,
  speed,
  active,
}: {
  title: string
  distance: number
  time: number
  speed: string
  active: boolean
}) {
  return (
    <Card
      className={`p-3 text-center ${active ? 'border-[var(--color-race-red)]' : ''}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
        {title}
      </p>
      <p className="mt-1 text-xs text-[var(--color-race-muted)]">{distance}m</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">
        {formatRaceTime(time)}
      </p>
      <p className="text-[11px] text-[var(--color-race-muted)]">{speed}</p>
      {active && (
        <p className="mt-1 text-[10px] font-bold uppercase text-[var(--color-race-green)]">
          ■ Faster
        </p>
      )}
    </Card>
  )
}

function Row({
  label,
  value,
  negative,
}: {
  label: string
  value: string
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs uppercase tracking-wider text-[var(--color-race-muted)]">
        {label}
      </span>
      <span
        className={`text-base font-bold tabular-nums ${
          negative ? 'text-[var(--color-race-red2)]' : 'text-[var(--color-race-green)]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
