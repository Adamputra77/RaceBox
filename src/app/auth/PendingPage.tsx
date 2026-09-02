import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/useAuth'
import { Button } from '@/components/Button'

export function PendingPage() {
  const navigate = useNavigate()
  const { status, profile, profileError, user, signOut } = useAuth()

  useEffect(() => {
    if (status === 'approved' || status === 'banned') {
      navigate('/' + (status === 'banned' ? 'banned' : ''), { replace: true })
    }
  }, [status, navigate])

  const noDatabaseRow = profile == null && user != null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-race-bg)] px-6 text-center text-[var(--color-race-text)]">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-race-yellow)]">
        <svg className="h-7 w-7 text-[var(--color-race-yellow)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold">Menunggu Persetujuan Admin</h1>
      <p className="mt-3 max-w-xs text-sm text-[var(--color-race-muted)]">
        Akun kamu belum disetujui admin. Setelah disetujui, kamu bisa login dan
        menggunakan RaceBox.
      </p>
      {user?.email && (
        <p className="mt-4 w-full max-w-xs truncate rounded-lg border border-[var(--color-race-border)] bg-[var(--color-race-card)] px-4 py-2 text-xs text-[var(--color-race-muted)]">
          Akun: {user.email}
        </p>
      )}
      {profileError && (
        <p className="mt-3 w-full max-w-xs rounded-lg border border-[var(--color-race-red)]/40 bg-[var(--color-race-card)] px-4 py-2 text-xs text-[var(--color-race-red2)]">
          Gagal membaca data: {profileError}
        </p>
      )}
      {noDatabaseRow && !profileError && (
        <p className="mt-3 w-full max-w-xs rounded-lg border border-[var(--color-race-red)]/40 bg-[var(--color-race-card)] px-4 py-2 text-xs text-[var(--color-race-red2)]">
          Data profil tidak ditemukan di database. Hubungi admin (mungkin akun
          belum terhubung ke baris profile, atau hak akses database bermasalah).
        </p>
      )}
      <div className="mt-8 w-full max-w-xs space-y-2">
        <Button full onClick={() => window.location.reload()}>
          PERIKSA STATUS
        </Button>
        <Button full variant="outline" onClick={() => void signOut()}>
          LOGOUT
        </Button>
      </div>
    </div>
  )
}
