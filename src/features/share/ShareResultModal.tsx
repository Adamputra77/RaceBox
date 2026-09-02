import { useState, useRef } from 'react'
import type { RaceRecord } from '@/types'
import { Button } from '@/components/Button'
import { shareOrDownload } from './shareUtils'
import type { ShareStyle } from './shareCard'

const STYLE_OPTIONS: Array<{ id: ShareStyle; label: string; swatch: string }> = [
  { id: 'dark', label: 'DARK SPORT', swatch: 'bg-[#0a0a0a]' },
  { id: 'corsa', label: 'CORSA RED', swatch: 'bg-[#1a0606]' },
  { id: 'neon', label: 'APEX NEON', swatch: 'bg-[#04080f]' },
]

export function ShareResultModal({
  record,
  onClose,
}: {
  record: RaceRecord
  onClose: () => void
}) {
  const [style, setStyle] = useState<ShareStyle>('dark')
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle')
  const [result, setResult] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doShare = async () => {
    if (status === 'busy') return
    setStatus('busy')
    const outcome = await shareOrDownload(record, style)
    setStatus('done')
    setResult(outcome === 'cancelled' ? 'Dibatalkan' : 'Berhasil dibagikan/diunduh')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="safe-bottom w-full max-w-md rounded-t-3xl border-t border-[var(--color-race-border)] bg-[var(--color-race-card)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-race-border)]" />
        <h2 className="text-center text-lg font-bold uppercase tracking-widest">
          Share Card
        </h2>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-race-muted)]">
          Style
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStyle(opt.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                style === opt.id
                  ? 'border-[var(--color-race-red)]'
                  : 'border-[var(--color-race-border)]'
              }`}
            >
              <span className={`h-10 w-full rounded-lg border border-white/10 ${opt.swatch}`} />
              <span className="text-[10px] font-bold tracking-wide">{opt.label}</span>
            </button>
          ))}
        </div>

        {status === 'done' && (
          <p className="mt-3 text-center text-sm text-[var(--color-race-green)]">
            {result}
          </p>
        )}

        <div className="mt-5 space-y-2">
          <Button full onClick={doShare} disabled={status === 'busy'}>
            {status === 'busy' ? 'MEMBUAT...' : 'SHARE / UNDUH'}
          </Button>
          <Button full variant="ghost" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  )
}
