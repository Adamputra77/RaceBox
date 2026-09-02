import { useAuth } from '@/lib/auth/useAuth'
import { Button } from '@/components/Button'
import { useNavigate, Link } from 'react-router-dom'

export function BannedPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-race-bg)] px-6 text-center text-[var(--color-race-text)]">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-race-red)]">
        <svg className="h-7 w-7 text-[var(--color-race-red)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4m0 4h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold">Akses Diblokir</h1>
      <p className="mt-3 max-w-xs text-sm text-[var(--color-race-muted)]">
        Akun kamu diblokir. Hubungi admin bila menurut kamu ini adalah kesalahan.
      </p>
      <div className="mt-8 w-full max-w-xs space-y-2">
        <Button full variant="outline" onClick={() => void signOut()}>
          LOGOUT
        </Button>
        <Link
          to="/login"
          className="block text-center text-xs uppercase tracking-widest text-[var(--color-race-muted)] hover:text-[var(--color-race-text)]"
          onClick={() => navigate('/login')}
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
