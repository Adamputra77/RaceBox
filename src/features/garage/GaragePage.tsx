import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import type { Vehicle, VehicleType } from '@/types'

interface FormState {
  name: string
  type: VehicleType
  brand: string
  model: string
  engine: string
  weight: string
  notes: string
}

const EMPTY: FormState = {
  name: '',
  type: 'motorcycle',
  brand: '',
  model: '',
  engine: '',
  weight: '',
  notes: '',
}

export function GaragePage() {
  const vehicles = useLiveQuery(() => db.vehicles.orderBy('createdAt').toArray(), [])
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        brand: editing.brand,
        model: editing.model,
        engine: editing.engine ?? '',
        weight: editing.weight !== undefined ? String(editing.weight) : '',
        notes: editing.notes ?? '',
      })
      setShowForm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const startNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setSaved(false)
    setShowForm(true)
  }

  const save = async () => {
    await db.vehicles.put({
      ...(editing?.id ? { id: editing.id } : {}),
      name: form.name,
      type: form.type,
      brand: form.brand,
      model: form.model,
      engine: form.engine || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      notes: form.notes || undefined,
      createdAt: editing?.createdAt ?? Date.now(),
    })
    setSaved(true)
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY)
  }

  const del = useCallback(async (id: number) => {
    await db.vehicles.delete(id)
  }, [])

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          GARA<span className="text-[var(--color-race-red)]">GE</span>
        </h1>
      </header>

      <Button full className="mt-3" onClick={startNew}>
        + ADD VEHICLE
      </Button>

      <div className="mt-4 space-y-2 pb-4">
        {vehicles && vehicles.length === 0 && (
          <Card className="p-6 text-center text-sm text-[var(--color-race-muted)]">
            Belum ada kendaraan. Tambahkan kendaraan untuk mengaitkan balapan.
          </Card>
        )}
        {vehicles?.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold">{v.name}</p>
                <p className="text-xs text-[var(--color-race-muted)]">
                  {v.type === 'motorcycle' ? 'Motorcycle' : 'Car'} · {v.brand} {v.model}
                </p>
                {(v.engine || v.weight) && (
                  <p className="mt-1 text-xs text-[var(--color-race-muted)]">
                    {v.engine ? `${v.engine} · ` : ''}
                    {v.weight ? `${v.weight} kg` : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(v)}
                  className="rounded-lg border border-[var(--color-race-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                >
                  Edit
                </button>
                <button
                  onClick={() => v.id !== undefined && del(v.id)}
                  className="rounded-lg border border-[var(--color-race-red)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-race-red2)]"
                >
                  Del
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="safe-bottom max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-[var(--color-race-border)] bg-[var(--color-race-card)] p-5">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-race-border)]" />
            <h2 className="text-center text-lg font-bold uppercase tracking-widest">
              {editing ? 'Edit Vehicle' : 'New Vehicle'}
            </h2>

            <div className="mt-4 space-y-3">
              <Field label="Vehicle Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mio Drag"
                  className="input"
                />
              </Field>

              <div>
                <label className="label">Type</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(['motorcycle', 'car'] as VehicleType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`rounded-xl border py-2.5 text-sm font-semibold uppercase tracking-wide ${
                        form.type === t
                          ? 'border-[var(--color-race-red)] bg-[var(--color-race-red)]/15'
                          : 'border-[var(--color-race-border)]'
                      }`}
                    >
                      {t === 'motorcycle' ? 'Motorcycle' : 'Car'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand">
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Yamaha"
                    className="input"
                  />
                </Field>
                <Field label="Model">
                  <input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="Mio"
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Engine (optional)">
                <input
                  value={form.engine}
                  onChange={(e) => setForm({ ...form, engine: e.target.value })}
                  placeholder="150cc"
                  className="input"
                />
              </Field>

              <Field label="Weight kg (optional)">
                <input
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="125"
                  type="number"
                  className="input"
                />
              </Field>

              <Field label="Notes (optional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Modifikasi..."
                  className="input min-h-[70px] resize-none"
                />
              </Field>
            </div>

            <div className="mt-5 space-y-2">
              <Button full onClick={save} disabled={!form.name || !form.brand || !form.model}>
                {saved ? 'SAVED' : 'SAVE VEHICLE'}
              </Button>
              <Button full variant="ghost" onClick={() => setShowForm(false)}>
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
