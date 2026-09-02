import { useMemo } from 'react'
import type { GPSSample } from '@/types'
import { haversineDistance } from '@/lib/calculations'

export function SpeedChart({
  samples,
  mode,
}: {
  samples: GPSSample[]
  mode: 'time' | 'distance'
}) {
  const width = 320
  const height = 160
  const pad = 8

  const points = useMemo(() => {
    const xs: number[] = []
    const ys: number[] = []
    let dist = 0
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]
      if (i > 0) {
        dist += haversineDistance(
          { latitude: samples[i - 1].lat, longitude: samples[i - 1].lon },
          { latitude: s.lat, longitude: s.lon },
        )
      }
      if (s.spd === null || s.spd === undefined) continue
      const x = mode === 'time' ? s.t : dist
      xs.push(x)
      ys.push(s.spd * 3.6)
    }
    return { xs, ys }
  }, [samples, mode])

  if (points.xs.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-[var(--color-race-muted)]">
        Data grafik tidak cukup
      </div>
    )
  }

  const minX = Math.min(...points.xs)
  const maxX = Math.max(...points.xs)
  const minY = 0
  const maxY = Math.max(...points.ys, 1)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const line = points.xs
    .map((x, i) => {
      const px = pad + ((x - minX) / rangeX) * (width - pad * 2)
      const py = height - pad - ((points.ys[i] - minY) / rangeY) * (height - pad * 2)
      return `${px.toFixed(1)},${py.toFixed(1)}`
    })
    .join(' ')

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Grafik kecepatan"
      >
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={height - pad}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        <polyline
          points={line}
          fill="none"
          stroke="#e10600"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-[var(--color-race-muted)]">
        <span>
          {mode === 'time' ? `${minX.toFixed(1)}s` : `${minX.toFixed(1)}m`}
        </span>
        <span>{maxY.toFixed(0)} km/h</span>
        <span>
          {mode === 'time' ? `${maxX.toFixed(1)}s` : `${maxX.toFixed(1)}m`}
        </span>
      </div>
    </div>
  )
}
