import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const { settings, update } = useSettings()

  useEffect(() => {
    if (settings.installPromptDismissed) return
    const handler = (e: Event) => {
      e.preventDefault()
      // Only show after a delay to avoid being intrusive
      setTimeout(() => {
        setDeferred(e as BeforeInstallPromptEvent)
        setVisible(true)
      }, 8000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [settings.installPromptDismissed])

  if (!visible || !deferred) return null

  const install = async () => {
    await deferred.prompt()
    const choice = await deferred.userChoice
    setVisible(false)
    setDeferred(null)
    if (choice.outcome === 'dismissed') {
      await update({ installPromptDismissed: true })
    }
  }

  const dismiss = async () => {
    await update({ installPromptDismissed: true })
    setVisible(false)
    setDeferred(null)
  }

  return (
    <div className="fixed inset-x-0 bottom-24 left-0 right-0 z-[95] mx-auto max-w-md px-4">
      <div className="rounded-2xl border border-[var(--color-race-border)] bg-[var(--color-race-card)] p-4 shadow-xl">
        <p className="font-display text-lg font-bold">
          Install <span className="text-[var(--color-race-red)]">RaceBox</span>
        </p>
        <p className="mt-1 text-xs text-[var(--color-race-muted)]">
          Dapatkan akses cepat & working offline. Pasang RaceBox di home screen kamu.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="md" onClick={install}>
            INSTALL
          </Button>
          <Button size="md" variant="ghost" onClick={dismiss}>
            LATER
          </Button>
        </div>
      </div>
    </div>
  )
}
