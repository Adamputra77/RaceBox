import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { supabase } from '@/lib/auth/supabaseClient'
import type { ProfileRow } from '@/lib/auth/databaseTypes'
import { Button } from '@/components/Button'
import { AuthLoading } from '@/app/auth/AuthLoading'

type Filter = 'pending' | 'approved' | 'banned' | 'all'

const STATUS_LABEL: Record<ProfileRow['status'], string> = {
  pending: 'pending',
  approved: 'approved',
  banned: 'banned',
}

export function AdminDashboard() {
  const { isAdmin, status } = useAuth()
  const [filter, setFilter] = useState<Filter>('pending')
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from('profiles').select('*')
    if (filter !== 'all') query = query.eq('status', filter)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) {
      setError(error.message)
      setRows([])
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    if (status === 'approved' && isAdmin)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load()
  }, [status, isAdmin, filter, load])

  const setStatus = async (id: string, next: ProfileRow['status']) => {
    const patch: Partial<ProfileRow> = { status: next }
    if (next === 'approved') patch.approved_at = new Date().toISOString()
    if (next === 'banned') patch.banned_at = new Date().toISOString()
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      void load()
    }
  }

  const counts = useCounts()

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pt-6 pb-20">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        ADMIN <span className="text-[var(--color-race-red)]">PANEL</span>
      </h1>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
        User Approval
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['pending', 'approved', 'banned', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === f
                ? 'border-[var(--color-race-red)] bg-[var(--color-race-red)] text-white'
                : 'border-[var(--color-race-border)] text-[var(--color-race-muted)]'
            }`}
          >
            {f === 'all' ? 'ALL' : STATUS_LABEL[f as keyof typeof STATUS_LABEL]}
            {counts[f] != null && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {loading && <div className="mt-6"><AuthLoading /></div>}

      {error && (
        <p className="mt-4 rounded-lg border border-[var(--color-race-red)] bg-[var(--color-race-card)] p-3 text-xs text-[var(--color-race-red)]">
          {error}
        </p>
      )}

      {!loading && rows.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--color-race-muted)]">
          Tidak ada user di daftar ini.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold">{row.full_name || '(no name)'}</p>
                <p className="truncate text-xs text-[var(--color-race-muted)]">
                  {row.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      row.status === 'pending'
                        ? 'bg-[var(--color-race-yellow)]/20 text-[var(--color-race-yellow)]'
                        : row.status === 'approved'
                          ? 'bg-[var(--color-race-green)]/20 text-[var(--color-race-green)]'
                          : 'bg-[var(--color-race-red)]/20 text-[var(--color-race-red)]'
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.role === 'admin' && (
                    <span className="rounded-full bg-[var(--color-race-red)]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-race-red)]">
                      admin
                    </span>
                  )}
                </div>
              </div>

              {row.status !== 'approved' && (
                <Button
                  size="md"
                  onClick={() => void setStatus(row.id, 'approved')}
                >
                  APPROVE
                </Button>
              )}
            </div>

            {row.status === 'approved' && row.role !== 'admin' && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => void setStatus(row.id, 'pending')}
                >
                  RESET
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  onClick={() => void setStatus(row.id, 'banned')}
                >
                  BAN
                </Button>
              </div>
            )}

            {row.status === 'banned' && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => void setStatus(row.id, 'approved')}
                >
                  UNBAN
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function useCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let active = true
    void (async () => {
      const { count: pending } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      const { count: approved } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
      const { count: banned } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'banned')
      if (active) {
        setCounts({
          pending: pending ?? 0,
          approved: approved ?? 0,
          banned: banned ?? 0,
        })
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return counts
}
