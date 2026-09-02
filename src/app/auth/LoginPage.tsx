import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth/useAuth'
import { formatAuthError } from '@/lib/auth/authErrors'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(formatAuthError(error))
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-race-bg)] px-4 text-[var(--color-race-text)]">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        RACE<span className="text-[var(--color-race-red)]">BOX</span>
      </h1>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
        Sign in to continue
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full max-w-sm space-y-4 rounded-2xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-6"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-race-muted)]">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-race-red)]"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-race-muted)]">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-race-red)]"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="text-xs font-semibold text-[var(--color-race-red)]">{error}</p>
        )}

        <Button full type="submit" disabled={loading}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-race-muted)]">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-[var(--color-race-red)]">
          Daftar
        </Link>
      </p>
      <Link
        to="/"
        className="mt-4 text-xs uppercase tracking-widest text-[var(--color-race-muted)] hover:text-[var(--color-race-text)]"
      >
        Back to home
      </Link>
    </div>
  )
}
