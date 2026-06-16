export function formatMs(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—'
  return `${Math.round(ms)} ms`
}

export function formatSec(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m === 0) return `${rem}s`
  return `${m}:${String(rem).padStart(2, '0')}`
}

export function formatDate(isoOrDate, opts = {}) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: opts.year ? 'numeric' : undefined,
    ...opts,
  })
}

export function formatDateTime(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export function mean(arr) {
  if (!arr || arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}
