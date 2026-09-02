import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGPS } from '@/hooks/useGPS'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/Button'
import { Speedometer } from '@/components/Speedometer'
import { RaceEngine, type RaceEngineState } from './RaceEngine'
import { db } from '@/lib/db/database'
import type { RaceRecord } from '@/types'
import { convertSpeed, convertAccumulatedDistance } from '@/lib/calculations'
import { MS_TO_KMH } from '@/lib/utils/constants'
import { formatRaceTime, formatDate } from '@/lib/utils/format'
import { ShareResultModal } from '@/features/share/ShareResultModal'

const WAKE_LOCK_SUPPORTED =
  typeof navigator !== 'undefined' && 'wakeLock' in navigator

export function RaceLivePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { position, start, stop } = useGPS()
  const { settings } = useSettings()

  const distanceParam = Number(searchParams.get('distance'))
  const targetDistance =
    Number.isFinite(distanceParam) && distanceParam > 0 ? distanceParam : 201

  const engineRef = useRef<RaceEngine | null>(null)
  const [snapshot, setSnapshot] = useState<RaceEngineState | null>(null)
  const [savedInDb, setSavedInDb] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [savedRecord, setSavedRecord] = useState<RaceRecord | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const saveGuardRef = useRef(false)
  const capturedAtRef = useRef(Date.now())
  const [liveNow, setLiveNow] = useState(Date.now())

  const applySnapshot = useCallback((s: RaceEngineState) => {
    capturedAtRef.current = Date.now()
    setSnapshot(s)
  }, [])

  if (!engineRef.current) {
    engineRef.current = new RaceEngine({
      distanceMeters: targetDistance,
      startThresholdKmh: settings.startThresholdKmh,
      automaticStart: settings.startDetection === 'automatic',
    })
    engineRef.current.arm()
  }
  const engine = engineRef.current

  const phase = snapshot?.phase ?? 'WAITING_FOR_START'

  // Start GPS watcher once on mount, stop on unmount
  useEffect(() => {
    start()
    return () => {
      stop()
      wakeLockRef.current?.release?.().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Feed the engine with the latest GPS position from the hook
  useEffect(() => {
    if (!position) return
    const s = engine.handlePosition({
      latitude: position.latitude,
      longitude: position.longitude,
      altitude: position.altitude,
      accuracy: position.accuracy,
      speed: position.speed,
      heading: position.heading,
      timestamp: position.timestamp,
    })
    applySnapshot(s)
  }, [position, engine, applySnapshot])

  // Timer tick to move the live clock between GPS updates
  useEffect(() => {
    if (phase !== 'RUNNING' && phase !== 'WAITING_FOR_START') return
    const id = setInterval(() => setLiveNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [phase])

  // Wake lock while race active
  useEffect(() => {
    const setWake = async () => {
      if (!WAKE_LOCK_SUPPORTED) return
      try {
        const nav = navigator as Navigator & {
          wakeLock: {
            request: (t: 'screen') => Promise<{ release: () => Promise<void> }>
          }
        }
        wakeLockRef.current = await nav.wakeLock.request('screen')
      } catch {
        // wake lock unavailable; continue without it
      }
    }
    if (phase === 'RUNNING' || phase === 'WAITING_FOR_START') {
      void setWake()
    } else {
      wakeLockRef.current?.release?.().catch(() => {})
      wakeLockRef.current = null
    }
  }, [phase])

  const cancel = useCallback(() => {
    navigate('/race')
  }, [navigate])

  const saveResult = useCallback(async () => {
    if (saveGuardRef.current || !snapshot) return
    saveGuardRef.current = true
    try {
      const t = Math.max(snapshot.timeMs / 1000, 0.001)
      const record: RaceRecord = {
        mode: 'drag',
        selectedDistance: targetDistance,
        elapsedTime: snapshot.finishTimeSec ?? t,
        maxSpeed: snapshot.maxSpeedMs * MS_TO_KMH,
        averageSpeed: (snapshot.distanceMeters / t) * MS_TO_KMH,
        startTimestamp: snapshot.samples.length > 0 ? Date.now() - snapshot.timeMs : Date.now(),
        finishTimestamp: Date.now(),
        gpsAccuracy: snapshot.accuracy,
        gpsQuality: snapshot.quality ?? 'POOR',
        gpsSampleCount: snapshot.samples.length,
        startLatitude: snapshot.startPosition?.latitude ?? 0,
        startLongitude: snapshot.startPosition?.longitude ?? 0,
        finishLatitude: snapshot.finishPosition?.latitude ?? 0,
        finishLongitude: snapshot.finishPosition?.longitude ?? 0,
        altitude: null,
        source: 'GPS',
        vehicleId: null,
        splits: snapshot.splits,
        samples: snapshot.samples.map((s) => ({
          t: s.timeSec,
          lat: s.lat,
          lon: s.lon,
          spd: s.speed,
          acc: snapshot.accuracy,
        })),
        createdAt: Date.now(),
      }
      const id = await db.races.add(record)
      setSavedRecord({ ...record, id })
      setSavedInDb(true)
    } finally {
      saveGuardRef.current = false
    }
  }, [snapshot, targetDistance])

  const liveElapsedMs =
    snapshot && (phase === 'RUNNING' || phase === 'WAITING_FOR_START')
      ? snapshot.timeMs + (liveNow - capturedAtRef.current)
      : snapshot?.timeMs ?? 0

  const metrics = {
    timeMs: liveElapsedMs,
    distance: snapshot?.distanceMeters ?? 0,
    speedMs:
      snapshot && snapshot.samples.length
        ? snapshot.samples[snapshot.samples.length - 1].speed ?? 0
        : 0,
    maxSpeedMs: snapshot?.maxSpeedMs ?? 0,
    accuracy: snapshot?.accuracy ?? 0,
    quality: snapshot?.quality ?? null,
  }

  const displayTimeMs =
    snapshot && snapshot.finishTimeSec != null
      ? snapshot.finishTimeSec * 1000
      : metrics.timeMs

  const speed = convertSpeed(metrics.speedMs, settings.speedUnit)
  const dist = convertAccumulatedDistance(metrics.distance, settings.distanceUnit)
  const progress = targetDistance
    ? Math.min(100, (metrics.distance / targetDistance) * 100)
    : 0

  if (snapshot && phase === 'FINISHED') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          RACE<span className="text-[var(--color-race-red)]">BOX</span>
        </h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-widest text-[var(--color-race-red)]">
          Drag Result
        </p>

        <div className="mt-6 text-center">
          <p className="font-display text-5xl font-bold">
            {targetDistance}
            <span className="ml-2 text-2xl text-[var(--color-race-muted)]">M</span>
          </p>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="font-display text-7xl font-bold tabular-nums text-glow-red">
              {formatRaceTime(displayTimeMs / 1000)}
            </span>
          </div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
            seconds
          </p>
        </div>

        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <ResultStat
            label="MAX SPEED"
            value={(metrics.maxSpeedMs * MS_TO_KMH).toFixed(1)}
            unit="KM/H"
          />
          <ResultStat label="AVG SPEED" value={lastAvgSpeed(snapshot)} unit="KM/H" />
        </div>

        {snapshot.splits.length > 0 && (
          <div className="mt-6 w-full">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-race-muted)]">
              Splits
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {snapshot.splits.map((sp) => (
                <div
                  key={sp.distance}
                  className="flex justify-between border-b border-[var(--color-race-border)] py-1.5"
                >
                  <span className="text-xs text-[var(--color-race-muted)]">
                    0-{sp.distance}m
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {sp.time.toFixed(2)}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 w-full">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
              GPS ±{metrics.accuracy.toFixed(1)}M · SOURCE GPS
            </p>
            <p className="text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
              {formatDate(Date.now())}
            </p>
          </div>
        </div>

        <div className="mt-6 w-full space-y-2">
          {!savedInDb ? (
            <Button full onClick={saveResult}>
              SAVE RESULT
            </Button>
          ) : (
            <Button full disabled>
              SAVED
            </Button>
          )}
          {savedInDb && (
            <Button full variant="outline" onClick={() => setShowShare(true)}>
              SHARE
            </Button>
          )}
          <Button full variant="outline" onClick={() => navigate('/race')}>
            NEW RACE
          </Button>
          <Button full variant="ghost" onClick={() => navigate('/')}>
            DISMISS
          </Button>
        </div>

        {showShare && savedRecord && (
          <ShareResultModal record={savedRecord} onClose={() => setShowShare(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pt-4">
      <header className="flex items-center justify-between py-2">
        <h1 className="font-display text-xl font-bold tracking-tight">
          DRAG <span className="text-[var(--color-race-red)]">TIMER</span>
        </h1>
        <button
          onClick={cancel}
          className="rounded-lg border border-[var(--color-race-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
        >
          Cancel
        </button>
      </header>

      <div className="flex-1 text-center">
        <p className="mt-4 font-display text-4xl font-bold">
          {targetDistance}
          <span className="ml-2 text-xl text-[var(--color-race-muted)]">M</span>
        </p>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-widest">
            {phase === 'WAITING_FOR_START'
              ? 'WAITING FOR MOVEMENT'
              : 'RACE IN PROGRESS'}
          </p>
          <span className="mt-2 inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--color-race-red)]" />
          {phase === 'WAITING_FOR_START' &&
            settings.startDetection === 'manual' && (
              <div className="mt-6">
                <Button
                  size="xl"
                  onClick={() => {
                    const s = engineRef.current?.startManual()
                    if (s) applySnapshot(s)
                  }}
                >
                  START NOW
                </Button>
              </div>
            )}
        </div>

        <div className="mt-8">
          <span className="font-display text-7xl font-bold tabular-nums text-glow-red">
            {formatRaceTime(metrics.timeMs / 1000)}
          </span>
          <p className="mt-1 text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
            time
          </p>
        </div>

        <div className="mt-6">
          <Speedometer
            value={speed.value}
            max={settings.speedUnit === 'mph' ? 160 : 260}
            unit={speed.unit}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-5xl font-bold tabular-nums">
              {dist.value.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-[var(--color-race-muted)]">
              {dist.unit}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
            {dist.value.toFixed(1)} / {targetDistance} {dist.unit}
          </p>
          <div className="mx-auto mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--color-race-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-race-red)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <div>
            <p className="font-display text-2xl font-bold tabular-nums">
              {(metrics.maxSpeedMs * MS_TO_KMH).toFixed(0)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
              max km/h
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tabular-nums">
              ±{metrics.accuracy.toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
              gps m
            </p>
          </div>
        </div>

        {metrics.quality === 'POOR' && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-race-red2)]">
            GPS SIGNAL WEAK
          </p>
        )}
      </div>
    </div>
  )
}

function ResultStat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">
        {value} <span className="text-xs text-[var(--color-race-muted)]">{unit}</span>
      </p>
    </div>
  )
}

function lastAvgSpeed(snapshot: RaceEngineState | null): string {
  if (!snapshot) return '0.0'
  const t = snapshot.timeMs / 1000
  if (t <= 0) return '0.0'
  return ((snapshot.distanceMeters / t) * MS_TO_KMH).toFixed(1)
}
