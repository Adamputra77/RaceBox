import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGPS } from '@/hooks/useGPS'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/Button'
import { Speedometer } from '@/components/Speedometer'
import { RideRecorder, type RideState } from './RideRecorder'
import { db } from '@/lib/db/database'
import type { RideRecord } from '@/types'
import { convertSpeed, convertAccumulatedDistance } from '@/lib/calculations'
import { MS_TO_KMH } from '@/lib/utils/constants'
import { formatDuration } from '@/lib/utils/format'

const WAKE_LOCK_SUPPORTED =
  typeof navigator !== 'undefined' && 'wakeLock' in navigator

export function RidePage() {
  const navigate = useNavigate()
  const { position, start, stop } = useGPS()
  const { settings } = useSettings()

  const recorderRef = useRef<RideRecorder | null>(null)
  const [state, setState] = useState<RideState | null>(null)
  const [saved, setSaved] = useState(false)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)
  const saveGuardRef = useRef(false)

  if (!recorderRef.current) recorderRef.current = new RideRecorder()
  const recorder = recorderRef.current

  const recording = state?.recording ?? false
  const finished = state?.finished ?? false

  useEffect(() => {
    start()
    return () => {
      stop()
      wakeLockRef.current?.release?.().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!position || finished) return
    if (recording) {
      setState(recorder.push(position))
    }
  }, [position, recording, finished, recorder])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => {
      setState((s) => (s ? recorder.snapshot() : s))
    }, 250)
    return () => clearInterval(id)
  }, [recording, recorder])

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
        /* ignore */
      }
    }
    if (recording) {
      void setWake()
    } else {
      wakeLockRef.current?.release?.().catch(() => {})
      wakeLockRef.current = null
    }
  }, [recording])

  const startRide = useCallback(() => {
    if (!position) return
    recorder.begin(position)
    setState(recorder.snapshot())
    setSaved(false)
  }, [position, recorder])

  const stopRide = useCallback(() => {
    if (recorder) {
      setState(recorder.finish())
    }
  }, [recorder])

  const saveRide = useCallback(async () => {
    if (saveGuardRef.current || !recorder || !position) return
    saveGuardRef.current = true
    try {
      const cur = recorder.snapshot()
      const samples = recorder.getSamples()
      const startPos = recorder.getStartPosition()
      const record: RideRecord = {
        distance: recorder.getDistance(),
        duration: Math.max(cur.durationMs / 1000, 0.001),
        averageSpeed: cur.avgSpeedMs * MS_TO_KMH,
        maxSpeed: cur.maxSpeedMs * MS_TO_KMH,
        startTimestamp: Date.now() - cur.durationMs,
        endTimestamp: Date.now(),
        gpsAccuracy: cur.accuracy,
        gpsQuality: cur.quality ?? 'GOOD',
        gpsSampleCount: samples.length,
        startLatitude: startPos?.latitude ?? position.latitude,
        startLongitude: startPos?.longitude ?? position.longitude,
        endLatitude: samples.length ? samples[samples.length - 1].lat : position.latitude,
        endLongitude: samples.length ? samples[samples.length - 1].lon : position.longitude,
        vehicleId: null,
        elevationGain: recorder.getElevationGain(),
        samples: samples.map((s) => ({
          t: s.timeSec,
          lat: s.lat,
          lon: s.lon,
          spd: s.speed,
          acc: cur.accuracy,
        })),
        createdAt: Date.now(),
      }
      await db.rides.add(record)
      setSaved(true)
    } finally {
      saveGuardRef.current = false
    }
  }, [position, recorder])

  const liveSpeedMs = state?.liveSpeedMs ?? 0
  const speed = convertSpeed(liveSpeedMs, settings.speedUnit)
  const dist = convertAccumulatedDistance(state?.distance ?? 0, settings.distanceUnit)

  const reset = () => {
    recorderRef.current = new RideRecorder()
    setState(null)
    setSaved(false)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pt-4">
      <header className="flex items-center justify-between py-2">
        <h1 className="font-display text-xl font-bold tracking-tight">
          RIDE <span className="text-[var(--color-race-red)]">RECORDER</span>
        </h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg border border-[var(--color-race-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
        >
          Close
        </button>
      </header>

      {!finished ? (
        <div className="flex-1 text-center">
          <div className="mt-2">
            <Speedometer
              value={speed.value}
              max={settings.speedUnit === 'mph' ? 160 : 260}
              unit={speed.unit}
            />
          </div>

          <div className="mx-auto mt-10 grid max-w-sm grid-cols-3 gap-3">
            <LiveStat label="DISTANCE" value={`${dist.value.toFixed(2)} ${dist.unit}`} />
            <LiveStat
              label="DURATION"
              value={formatDuration((state?.durationMs ?? 0) / 1000)}
            />
            <LiveStat
              label="AVG"
              value={`${((state?.avgSpeedMs ?? 0) * MS_TO_KMH).toFixed(1)} km/h`}
            />
          </div>
          <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-3">
            <LiveStat
              label="MAX"
              value={`${((state?.maxSpeedMs ?? 0) * MS_TO_KMH).toFixed(1)} km/h`}
            />
            <LiveStat label="GPS" value={`±${(state?.accuracy ?? 0).toFixed(1)} m`} />
          </div>

          <div className="mt-12">
            {!recording ? (
              <Button full size="xl" onClick={startRide} disabled={!position}>
                START RIDE
              </Button>
            ) : (
              <Button full size="xl" variant="danger" onClick={stopRide}>
                STOP RIDE
              </Button>
            )}
            {!position && (
              <p className="mt-3 text-xs text-[var(--color-race-muted)]">
                Menunggu GPS lock...
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center pt-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-race-red)]">
            Ride Summary
          </p>
          <div className="mt-8 space-y-3">
            <SummaryRow
              label="DISTANCE"
              value={`${((state?.distance ?? 0) / 1000).toFixed(2)} km`}
            />
            <SummaryRow
              label="DURATION"
              value={formatDuration((state?.durationMs ?? 0) / 1000)}
            />
            <SummaryRow
              label="AVG SPEED"
              value={`${((state?.avgSpeedMs ?? 0) * MS_TO_KMH).toFixed(1)} km/h`}
            />
            <SummaryRow
              label="MAX SPEED"
              value={`${((state?.maxSpeedMs ?? 0) * MS_TO_KMH).toFixed(1)} km/h`}
            />
            <SummaryRow label="GPS" value={`±${(state?.accuracy ?? 0).toFixed(1)} m`} />
          </div>
          <div className="mt-10 space-y-2">
            {!saved ? (
              <Button full onClick={saveRide}>
                SAVE RIDE
              </Button>
            ) : (
              <Button full disabled>
                SAVED
              </Button>
            )}
            {saved && (
              <Button full variant="outline" onClick={() => navigate('/history')}>
                VIEW HISTORY
              </Button>
            )}
            <Button full variant="ghost" onClick={reset}>
              NEW RIDE
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-3">
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-race-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-base font-bold tabular-nums">{value}</p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-race-border)] pb-2">
      <span className="text-xs uppercase tracking-widest text-[var(--color-race-muted)]">
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  )
}
