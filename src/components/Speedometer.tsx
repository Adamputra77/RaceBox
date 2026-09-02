export interface SpeedometerProps {
  value: number
  max: number
  unit: string
  size?: number
  maxSpeed?: number
}

export function Speedometer({
  value,
  max,
  unit,
  size = 260,
  maxSpeed,
}: SpeedometerProps) {
  const clamp = Math.max(0, Math.min(value, max))
  const pct = max > 0 ? clamp / max : 0
  const barPct = Math.max(2, Math.min(100, pct * 100))

  const barColor =
    pct < 0.6
      ? 'var(--color-race-green)'
      : pct < 0.8
        ? 'var(--color-race-yellow)'
        : 'var(--color-race-red)'

  const glow =
    pct < 0.6
      ? '0 0 18px rgba(34,197,94,0.65), 0 0 40px rgba(34,197,94,0.3)'
      : pct < 0.8
        ? '0 0 18px rgba(234,179,8,0.65), 0 0 40px rgba(234,179,8,0.3)'
        : '0 0 18px rgba(239,68,68,0.7), 0 0 48px rgba(239,68,68,0.35)'

  const segments = 24
  const litSegments = Math.round((barPct / 100) * segments)

  const digits = clamp.toFixed(0).padStart(3, '0').split('')

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: size, maxWidth: '100%' }}
    >
      <div className="relative flex flex-col items-center rounded-3xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col items-center">
          <div className="flex items-start justify-center" style={{ gap: size * 0.01 }}>
            {digits.map((d, i) => (
              <span
                key={i}
                className="font-display font-black tabular-nums tracking-tighter"
                style={{
                  fontSize: size * 0.3,
                  lineHeight: 1,
                  color: 'var(--color-race-red)',
                  textShadow: glow,
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <span
            className="mt-2 font-bold uppercase tracking-[0.3em] text-[var(--color-race-muted)]"
            style={{ fontSize: size * 0.045 }}
          >
            {unit}
          </span>
        </div>

        <div
          className="mt-6 flex w-full items-center justify-center"
          style={{ gap: size * 0.012 }}
        >
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: size * 0.024,
                height: size * 0.024,
                backgroundColor:
                  i < litSegments
                    ? barColor
                    : 'var(--color-race-border)',
                boxShadow: i < litSegments ? `0 0 8px ${barColor}` : 'none',
                transition: 'background-color 120ms, box-shadow 120ms',
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-[var(--color-race-muted)]">
          <span>{maxSpeed != null ? `MAX ${Math.round(maxSpeed)}` : '\u00A0'}</span>
          <span>{Math.round(max)}</span>
        </div>
      </div>
    </div>
  )
}
