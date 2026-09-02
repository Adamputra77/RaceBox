import { toPng } from 'html-to-image'
import type { RaceRecord } from '@/types'
import { shareCardHTML, type ShareStyle } from './shareCard'

export async function generateShareBlob(
  record: RaceRecord,
  style: ShareStyle,
): Promise<Blob> {
  const el = shareCardHTML(record, style)
  document.body.appendChild(el)
  try {
    const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#0a0a0a' })
    const blob = await (await fetch(dataUrl)).blob()
    return blob
  } finally {
    document.body.removeChild(el)
  }
}

export async function shareOrDownload(
  record: RaceRecord,
  style: ShareStyle,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await generateShareBlob(record, style)
  const file = new File([blob], `racebox-${record.selectedDistance}m.png`, {
    type: 'image/png',
  })

  const isShareSupported =
    typeof navigator !== 'undefined' && 'share' in navigator

  if (isShareSupported) {
    try {
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean
      }
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: 'RaceBox Result',
          text: `Drag ${record.selectedDistance}m · ${record.elapsedTime.toFixed(2)}s`,
        })
        return 'shared'
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // fall through to download
    }
  }

  // fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `racebox-${record.selectedDistance}m.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
