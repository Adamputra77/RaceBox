import type { RaceRecord } from '@/types'
import { formatDate } from '@/lib/utils/format'

export type ShareStyle = 'dark' | 'corsa' | 'neon'

const STYLES: Record<
  ShareStyle,
  { bg: string; card: string; accent: string; text: string; accent2: string }
> = {
  dark: {
    bg: '#0a0a0a',
    card: '#161616',
    accent: '#e10600',
    text: '#f5f5f5',
    accent2: '#ff2d1a',
  },
  corsa: {
    bg: '#100404',
    card: '#1d0a0a',
    accent: '#ff1f1f',
    text: '#ffffff',
    accent2: '#ff5040',
  },
  neon: {
    bg: '#04080f',
    card: '#0e1622',
    accent: '#00e5ff',
    text: '#f0f7ff',
    accent2: '#00c8ff',
  },
}

export function shareCardHTML(record: RaceRecord, style: ShareStyle): HTMLElement {
  const s = STYLES[style]
  const el = document.createElement('div')
  el.style.cssText = `width:420px;background:${s.bg};color:${s.text};padding:28px;box-sizing:border-box;font-family:system-ui,Arial,sans-serif;display:flex;flex-direction:column;justify-content:space-between;`

  const top = document.createElement('div')
  top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;'
  const title = document.createElement('div')
  title.style.cssText = 'font-size:34px;font-weight:900;letter-spacing:1px;'
  title.innerHTML = `RACE<span style="color:${s.accent}">BOX</span>`
  const tag = document.createElement('div')
  tag.style.cssText = `font-size:11px;letter-spacing:2px;color:${s.accent};font-weight:700;`
  tag.textContent = 'DRAG RESULT'
  top.appendChild(title)
  top.appendChild(tag)

  const mid = document.createElement('div')
  mid.style.cssText = 'text-align:center;padding:36px 0;'
  const dist = document.createElement('div')
  dist.style.cssText = 'font-size:44px;font-weight:900;'
  dist.innerHTML = `${record.selectedDistance} <span style="font-size:22px;opacity:.7">M</span>`
  const time = document.createElement('div')
  time.style.cssText = `font-size:84px;font-weight:900;line-height:1;margin-top:8px;color:${s.accent2};`
  time.textContent = record.elapsedTime.toFixed(2)
  const unit = document.createElement('div')
  unit.style.cssText = 'font-size:14px;letter-spacing:3px;opacity:.6;margin-top:4px;'
  unit.textContent = 'SECONDS'
  mid.appendChild(dist)
  mid.appendChild(time)
  mid.appendChild(unit)

  const stats = document.createElement('div')
  stats.style.cssText = `background:${s.card};border-radius:16px;padding:16px;`
  const maxRow = document.createElement('div')
  maxRow.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;'
  maxRow.innerHTML = `<span style="font-size:13px;opacity:.6;font-weight:700">MAX</span><span style="font-size:26px;font-weight:900">${record.maxSpeed.toFixed(1)} <span style="font-size:13px;opacity:.6">KM/H</span></span>`
  stats.appendChild(maxRow)

  if (record.splits.length > 0) {
    const div = document.createElement('div')
    div.style.cssText = 'border-top:1px solid rgba(255,255,255,.12);margin-top:8px;padding-top:8px;'
    for (const sp of record.splits.slice(0, 3)) {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;justify-content:space-between;padding:3px 0;font-size:13px;'
      row.innerHTML = `<span style="opacity:.6">0-${sp.distance}M</span><span style="font-weight:700">${sp.time.toFixed(2)} S</span>`
      div.appendChild(row)
    }
    stats.appendChild(div)
  }

  const bottom = document.createElement('div')
  bottom.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:20px;font-size:11px;opacity:.6;letter-spacing:1px;'
  bottom.innerHTML = `<span>GPS ±${record.gpsAccuracy.toFixed(1)}M</span><span>${formatDate(record.createdAt)}</span><span style="color:${s.accent};font-weight:800">RACEBOX</span>`

  el.appendChild(top)
  el.appendChild(mid)
  el.appendChild(stats)
  el.appendChild(bottom)

  return el
}
