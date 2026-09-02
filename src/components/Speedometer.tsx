import { useId } from 'react'

export interface SpeedometerProps {
  value: number
  max: number
  unit: string
  size?: number
}

const START_ANGLE = -210
const END_ANGLE = 30
const SWEEP = END_ANGLE - START_ANGLE

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polar(cx, cy, r, endAngle)
  const end = polar(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

export function Speedometer({ value, max, unit, size = 240 }: SpeedometerProps) {
  const uid = useId()
  const clamp = Math.max(0, Math.min(value, max))
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 12
  const needleAngle = START_ANGLE + (clamp / max) * SWEEP

  const majorTicks = 10
  const redStart = max * 0.8

  const ticks = Array.from({ length: majorTicks + 1 }, (_, i) => {
    const angle = START_ANGLE + (i / majorTicks) * SWEEP
    const label = Math.round((max / majorTicks) * i)
    return { angle, label, value: (max / majorTicks) * i }
  })

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size, marginTop: size * 0.12 }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <defs>
          <linearGradient id={`${uid}-gauge`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-race-card)" />
            <stop offset="100%" stopColor="var(--color-race-bg)" />
          </linearGradient>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={`url(#${uid}-gauge)`}
          stroke="var(--color-race-border)"
          strokeWidth={2}
        />

        <path
          d={arcPath(cx, cy, radius - 8, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="var(--color-race-border)"
          strokeWidth={10}
          strokeLinecap="round"
        />

        <path
          d={arcPath(cx, cy, radius - 8, START_ANGLE + (redStart / max) * SWEEP, END_ANGLE)}
          fill="none"
          stroke="var(--color-race-red)"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {ticks.map((t) => {
          const outer = polar(cx, cy, radius - 20, t.angle)
          const inner = polar(cx, cy, radius - 30, t.angle)
          return (
            <line
              key={t.label}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--color-race-muted)"
              strokeWidth={2}
            />
          )
        })}

        {ticks.map((t) => {
          if (t.label === 0 || t.label % 2 !== 0) return null
          const p = polar(cx, cy, radius - 40, t.angle)
          return (
            <text
              key={`label-${t.label}`}
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={size * 0.036}
              fill="var(--color-race-muted)"
            >
              {t.label}
            </text>
          )
        })}

        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 160ms ease-out',
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - (radius - 46)}
            stroke="var(--color-race-red)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={7} fill="var(--color-race-red)" />
          <circle cx={cx} cy={cy} r={3} fill="var(--color-race-bg)" />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="font-display text-5xl font-bold leading-none tabular-nums">
          {clamp.toFixed(0)}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-race-muted)]">
          {unit}
        </p>
      </div>
    </div>
  )
}
