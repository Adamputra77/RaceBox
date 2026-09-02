import { Link, useLocation } from 'react-router-dom'
import { Card } from '@/components/Card'

const VERSION = '1.0.0'

export function AboutPage() {
  const location = useLocation()
  const devSim = new URLSearchParams(location.search).get('sim')

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <header className="flex items-center justify-between py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          ABO<span className="text-[var(--color-race-red)]">UT</span>
        </h1>
        <Link to="/settings" className="text-sm font-semibold text-[var(--color-race-red)]">
          ← Back
        </Link>
      </header>

      <Card className="mt-4 p-6 text-center">
        <p className="font-display text-4xl font-bold tracking-tight">
          RACE<span className="text-[var(--color-race-red)]">BOX</span>
        </p>
        <p className="mt-2 text-sm text-[var(--color-race-muted)]">
          GPS-based vehicle performance measurement.
        </p>
        <p className="mt-1 text-xs text-[var(--color-race-muted)]">
          Measurement depends on GPS device accuracy and environmental conditions.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-[var(--color-race-border)] px-3 py-1 text-xs">
          VERSION {VERSION}
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <p className="label mb-2">GPS Disclaimer</p>
        <p className="text-xs leading-relaxed text-[var(--color-race-muted)]">
          RaceBox adalah pengukuran berbasis GPS. Akurasi tergantung pada kualitas
          sinyal GPS perangkat, lingkungan sekitar, dan jenis perangkat. Hasil tidak
          dapat dianggap setara dengan timing system profesional.
        </p>
      </Card>

      {devSim && (
        <Card className="mt-4 border-[var(--color-race-yellow)]/40 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-race-yellow)]">
            DEV GPS SIMULATION ACTIVE
          </p>
          <p className="mt-1 text-xs text-[var(--color-race-muted)]">
            Mode ini hanya untuk development/testing.
          </p>
        </Card>
      )}
    </div>
  )
}
