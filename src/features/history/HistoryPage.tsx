import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { Card } from '@/components/Card'
import {
  formatRaceTime,
  formatDuration,
  formatDateTime,
} from '@/lib/utils/format'
import { convertKmhToMph } from '@/lib/calculations'
import { useSettings } from '@/hooks/useSettings'

type Filter = 'ALL' | 'DRAG' | 'RIDE'
type Sort = 'newest' | 'oldest' | 'fastest' | 'longest'

export function HistoryPage() {
  const { settings } = useSettings()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [sort, setSort] = useState<Sort>('newest')

  const races = useLiveQuery(() => db.races.toArray(), [])
  const rides = useLiveQuery(() => db.rides.toArray(), [])

  const items = useMemo(() => {
    type Item = {
      id: number
      type: 'DRAG' | 'RIDE'
      metric: string
      time: number
      maxSpeed: number
      accuracy: number
      createdAt: number
    }
    const dragItems: Item[] = (races ?? []).map((r) => ({
      id: r.id!,
      type: 'DRAG',
      metric: `${r.selectedDistance} M`,
      time: r.elapsedTime,
      maxSpeed: r.maxSpeed,
      accuracy: r.gpsAccuracy,
      createdAt: r.createdAt,
    }))
    const rideItems: Item[] = (rides ?? []).map((r) => ({
      id: r.id!,
      type: 'RIDE',
      metric: `${(r.distance / 1000).toFixed(2)} km`,
      time: r.duration,
      maxSpeed: r.maxSpeed,
      accuracy: r.gpsAccuracy,
      createdAt: r.createdAt,
    }))

    let list = [...dragItems, ...rideItems]
    if (filter === 'DRAG') list = list.filter((i) => i.type === 'DRAG')
    if (filter === 'RIDE') list = list.filter((i) => i.type === 'RIDE')

    switch (sort) {
      case 'newest':
        list.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'oldest':
        list.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'fastest':
        list.sort((a, b) => a.time - b.time)
        break
      case 'longest':
        list.sort((a, b) => b.time - a.time)
        break
    }
    return list
  }, [races, rides, filter, sort])

  const isMph = settings.speedUnit === 'mph'

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          HIST<span className="text-[var(--color-race-red)]">ORY</span>
        </h1>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(['ALL', 'DRAG', 'RIDE'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  filter === f
                    ? 'bg-[var(--color-race-red)] text-white'
                    : 'bg-[var(--color-race-card)] text-[var(--color-race-muted)]'
                }`}
              >
                {f === 'ALL' ? 'ALL' : f === 'DRAG' ? 'DRAG' : 'RIDE'}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-[var(--color-race-border)] bg-[var(--color-race-card)] px-2 py-1.5 text-xs font-semibold"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="fastest">Fastest</option>
            <option value="longest">Longest</option>
          </select>
        </div>
      </header>

      <Link to="/compare" className="mt-3 block">
        <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--color-race-border)] bg-[var(--color-race-card)] px-4 py-3">
          <span className="text-sm font-bold uppercase tracking-wide">
            Compare Races
          </span>
          <span className="text-[var(--color-race-red)]">›</span>
        </div>
      </Link>

      <div className="mt-4 space-y-2 pb-4">
        {items.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-race-muted)]">
            Belum ada data.
          </Card>
        )}
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={`/history/${item.id}?type=${item.type.toLowerCase()}`}
          >
            <Card className="flex items-center justify-between p-3">
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    item.type === 'DRAG'
                      ? 'text-[var(--color-race-red)]'
                      : 'text-[var(--color-race-yellow)]'
                  }`}
                >
                  {item.type} · {item.metric}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-race-muted)]">
                  {formatDateTime(item.createdAt)} · GPS ±{item.accuracy.toFixed(1)}m
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-bold tabular-nums">
                  {item.type === 'DRAG'
                    ? formatRaceTime(item.time)
                    : formatDuration(item.time)}
                </p>
                <p className="text-[10px] uppercase text-[var(--color-race-muted)]">
                  {item.type === 'DRAG'
                    ? formatSpeed(item.maxSpeed, isMph)
                    : `${formatSpeedNum(item.maxSpeed, isMph)}`}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function formatSpeed(kmh: number, mph: boolean): string {
  const v = mph ? convertKmhToMph(kmh) : kmh
  return `${v.toFixed(1)} ${mph ? 'mph' : 'km/h'}`
}

function formatSpeedNum(kmh: number, mph: boolean): string {
  const v = mph ? convertKmhToMph(kmh) : kmh
  return `${v.toFixed(1)} ${mph ? 'mph' : 'km/h'}`
}
