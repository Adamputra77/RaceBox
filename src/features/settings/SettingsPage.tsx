import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { useGPS } from '@/hooks/useGPS'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import type { ThemePref } from '@/types'
import {
  exportAllData,
  downloadJSON,
  downloadRaceCSV,
  importAllData,
  clearAllData,
} from '@/lib/db/exportImport'
import { db } from '@/lib/db/database'
import { useLiveQuery } from 'dexie-react-hooks'

const THEME_OPTIONS: Array<{ id: ThemePref; label: string }> = [
  { id: 'dark', label: 'Dark Sport' },
  { id: 'corsa', label: 'Corsa Red' },
  { id: 'neon', label: 'Apex Neon' },
]

export function SettingsPage() {
  const { settings, update } = useSettings()
  const { providerName } = useGPS()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const races = useLiveQuery(() => db.races.count(), [])

  const doExport = async () => {
    const data = await exportAllData()
    downloadJSON(data)
  }

  const doCSV = async () => {
    const list = await db.races.toArray()
    downloadRaceCSV(list)
  }

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const { count } = await importAllData(file)
      setImportMsg(`Import berhasil: ${count} data.`)
    } catch (e) {
      setImportMsg(
        e instanceof Error ? `Import gagal: ${e.message}` : 'Import gagal.',
      )
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const doClear = async () => {
    await clearAllData()
    setConfirmClear(false)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          SETTIN<span className="text-[var(--color-race-red)]">GS</span>
        </h1>
      </header>

      <Toggler
        label="Speed Unit"
        options={[{ id: 'kmh', label: 'KM/H' }, { id: 'mph', label: 'MPH' }]}
        value={settings.speedUnit}
        onChange={(v) => update({ speedUnit: v as 'kmh' | 'mph' })}
      />
      <Toggler
        label="Distance Unit"
        options={[{ id: 'meter', label: 'Meter' }, { id: 'feet', label: 'Feet' }]}
        value={settings.distanceUnit}
        onChange={(v) => update({ distanceUnit: v as 'meter' | 'feet' })}
      />
      <Toggler
        label="Start Detection"
        options={[
          { id: 'automatic', label: 'Automatic' },
          { id: 'manual', label: 'Manual' },
        ]}
        value={settings.startDetection}
        onChange={(v) => update({ startDetection: v as 'automatic' | 'manual' })}
      />

      <Card className="mt-5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Start Threshold</span>
          <span className="font-display text-lg font-bold tabular-nums">
            {settings.startThresholdKmh} km/h
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          step={0.5}
          value={settings.startThresholdKmh}
          onChange={(e) => update({ startThresholdKmh: Number(e.target.value) })}
          className="mt-2 w-full"
        />
      </Card>

      <Toggler
        label="GPS High Accuracy"
        options={[{ id: 'yes', label: 'ON' }, { id: 'no', label: 'OFF' }]}
        value={settings.gpsHighAccuracy ? 'yes' : 'no'}
        onChange={(v) => update({ gpsHighAccuracy: v === 'yes' })}
      />

      <Card className="mt-5 p-4">
        <p className="label mb-2">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ theme: t.id })}
              className={`rounded-xl border py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                settings.theme === t.id
                  ? 'border-[var(--color-race-red)] text-[var(--color-race-text)]'
                  : 'border-[var(--color-race-border)] text-[var(--color-race-muted)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-4">
        <p className="label mb-3">Data</p>
        <div className="space-y-2">
          <Button variant="outline" full onClick={doExport}>
            EXPORT DATA (JSON)
          </Button>
          <Button variant="outline" full onClick={doCSV} disabled={(races ?? 0) === 0}>
            EXPORT RACE SUMMARY (CSV)
          </Button>
          <Button variant="outline" full onClick={() => fileRef.current?.click()}>
            IMPORT DATA (JSON)
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0])}
          />
        </div>
        {importMsg && (
          <p className="mt-2 text-center text-xs text-[var(--color-race-green)]">
            {importMsg}
          </p>
        )}
      </Card>

      <Card className="mt-5 p-4">
        <p className="label mb-2">Danger Zone</p>
        {!confirmClear ? (
          <Button variant="danger" full onClick={() => setConfirmClear(true)}>
            CLEAR HISTORY
          </Button>
        ) : (
          <div className="space-y-2 rounded-xl border border-[var(--color-race-red)]/40 p-3">
            <p className="text-center text-sm text-[var(--color-race-red2)]">
              Yakin hapus semua data?
            </p>
            <div className="flex gap-2">
              <Button variant="danger" full onClick={doClear}>
                YES, DELETE
              </Button>
              <Button variant="outline" full onClick={() => setConfirmClear(false)}>
                CANCEL
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-5 p-4">
        <div className="flex items-center justify-between">
          <Link
            to="/settings/about"
            className="text-sm font-semibold text-[var(--color-race-text)]"
          >
            About RaceBox
          </Link>
          <span className="text-[var(--color-race-muted)]">›</span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-race-muted)]">
          GPS-based measurement. Accuracy depends on device GPS, signal quality, and
          environment.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
          GPS Source: {providerName === 'simulated' ? 'DEV SIMULATION' : 'Device GPS'}
        </p>
      </Card>
    </div>
  )
}

function Toggler({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Card className="mt-5 p-4">
      <p className="label mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-xl border py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
              value === o.id
                ? 'border-[var(--color-race-red)] bg-[var(--color-race-red)]/10 text-[var(--color-race-text)]'
                : 'border-[var(--color-race-border)] text-[var(--color-race-muted)]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Card>
  )
}
