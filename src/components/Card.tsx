import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  right,
  className = '',
}: {
  title: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-[var(--color-race-border)] px-4 py-3 ${className}`}
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-race-grey)]">
        {title}
      </h2>
      {right}
    </div>
  )
}
