import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth/useAuth'
import { formatAuthError } from '@/lib/auth/authErrors'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signUp(email, password, name.trim())
    setLoading(false)
    if (error) {
      setError(formatAuthError(error))
      return
    }
    setDone(true)
    setTimeout(() => navigate('/pending', { replace: true }), 400)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-race-bg)] px-4 text-center text-[var(--color-race-text)]">
        <h1 className="font-display text-2xl font-bold">Akun Berhasil Dibuat</h1>
        <p className="mt-3 text-sm text-[var(--color-race-muted)]">
          Silakan cek email untuk verifikasi, lalu tunggu persetujuan admin.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-race-bg)] px-4 text-[var(--color-race-text)]">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        RACE<span className="text-[var(--color-race-red)]">BOX</span>
      </h1>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
        Create account
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full max-w-sm space-y-4 rounded-2xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-6"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-race-muted)]">
            Nama Lengkap
          </span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-race-red)]"
            placeholder="Nama kamu"
            autoComplete="name"
          />
        </label>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-race-red)]"
            placeholder="Minimal 6 karakter"
            autoComplete="new-password"
          />
        </label>

        {error && (
          <p className="text-xs font-semibold text-[var(--color-race-red)]">{error}</p>
        )}

        <Button full type="submit" disabled={loading}>
          {loading ? 'CREATING...' : 'DAFTAR'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--color-race-muted)]">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-[var(--color-race-red)]">
          Masuk
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
