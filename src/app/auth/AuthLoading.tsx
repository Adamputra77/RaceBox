export function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-race-bg)] text-[var(--color-race-text)]">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-race-red)] border-t-transparent" />
      <p className="text-sm uppercase tracking-widest text-[var(--color-race-muted)]">
        Loading
      </p>
    </div>
  )
}
