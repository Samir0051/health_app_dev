import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, TrendingUp } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import { FutureCard } from '../components/FutureBadge'
import { useAppData } from '../context/AppDataContext'
import { formatDate, formatDateTime, formatMs, formatSec, isSameDay } from '../utils/format'
import { TONE_DOT } from '../utils/toneClasses'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export default function CalendarArchive() {
  const { sessions, SESSION_TYPES } = useAppData()
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const typeLookup = useMemo(() => Object.fromEntries(SESSION_TYPES.map((t) => [t.id, t])), [SESSION_TYPES])

  const monthStart = startOfMonth(viewDate)
  const totalDays = daysInMonth(viewDate)
  const leadingBlanks = monthStart.getDay()

  function sessionsOnDay(day) {
    const target = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    return sessions.filter((s) => isSameDay(s.date, target))
  }

  const filtered = sessions.filter((s) => {
    const matchesType = typeFilter === 'all' || s.plan?.sessionType === typeFilter
    const matchesSearch =
      !search ||
      (typeLookup[s.plan?.sessionType]?.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.postWorkout?.finishNotes || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.preWorkout?.readinessText || '').toLowerCase().includes(search.toLowerCase())
    const d = new Date(s.date)
    const afterFrom = !dateFrom || d >= new Date(dateFrom)
    const beforeTo = !dateTo || d <= new Date(dateTo)
    return matchesType && matchesSearch && afterFrom && beforeTo
  })

  const selected = sessions.find((s) => s.id === selectedId) || null

  function exportSelected() {
    if (!selected) return
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${new Date(selected.date).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 07"
        title="Calendar & archive"
        description="Every past session, color-coded by type, with full data accessible for any date."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <CardHeading title="Session calendar" dotColor="track" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-paper w-32 text-center">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-mist mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const daySessions = sessionsOnDay(day)
              const isToday = isSameDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day), new Date())
              return (
                <button
                  key={day}
                  type="button"
                  disabled={daySessions.length === 0}
                  onClick={() => setSelectedId(daySessions[0].id)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs gap-1 transition-colors
                    ${daySessions.length ? 'bg-ink-soft hover:bg-surface-raised cursor-pointer' : 'text-mist/40'}
                    ${isToday ? 'ring-1 ring-track' : ''}`}
                >
                  <span className="num text-paper">{day}</span>
                  <span className="flex gap-0.5">
                    {daySessions.slice(0, 3).map((s) => (
                      <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[typeLookup[s.plan?.sessionType]?.color || 'mist']}`} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-mist">
            {SESSION_TYPES.map((t) => (
              <span key={t.id} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[t.color]}`} /> {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <CardHeading title={formatDate(selected.date, { year: true })} dotColor={typeLookup[selected.plan?.sessionType]?.color || 'mist'} />
                <button type="button" onClick={exportSelected} className="btn-ghost">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
              <p className="text-sm text-paper mb-3">{typeLookup[selected.plan?.sessionType]?.label || 'Session'}</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {(selected.duringWorkout?.repLogs || []).map((log, i) => (
                  <div key={i} className="flex justify-between rounded-lg bg-ink-soft px-3 py-2 text-xs">
                    <span className="text-paper">rep {i + 1}</span>
                    <span className="num text-mist">{log.actualTime}</span>
                    <span className="num text-mist">reaction {formatMs(log.reactionTest?.meanMs)}</span>
                    <span className="num text-mist">rest {formatSec(log.actualRestTaken)}</span>
                  </div>
                ))}
                {(!selected.duringWorkout?.repLogs || selected.duringWorkout.repLogs.length === 0) && (
                  <p className="text-sm text-mist/70">No rep data logged for this session.</p>
                )}
              </div>
              {selected.postWorkout && (
                <div className="mt-3 pt-3 border-t border-surface-hairline text-xs text-mist space-y-1">
                  <p>Perceived effort: <span className="num text-paper">{selected.postWorkout.perceivedEffort}/10</span></p>
                  <p>Felt quality: <span className="num text-paper">{selected.postWorkout.feltQuality}/10</span></p>
                  {selected.postWorkout.finishNotes && <p className="text-paper">"{selected.postWorkout.finishNotes}"</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5 text-center text-sm text-mist/70">Tap a date or archive row to open its full report.</div>
          )}

          <FutureCard title="Trend view" description="Reaction-time baseline trend over weeks and months, CNS fatigue delta per session over time, and AI-generated training load summaries.">
            <div className="flex items-center gap-2 mt-2 text-sm text-mist">
              <TrendingUp className="h-4 w-4" /> Coming soon
            </div>
          </FutureCard>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <CardHeading title="Workout archive" dotColor="gate" />
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="input-base flex-1 min-w-[160px]"
            placeholder="Search notes, readiness text, session type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input-base w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            {SESSION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input type="date" className="input-base w-auto" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input-base w-auto" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          {filtered.length === 0 && <p className="text-sm text-mist/70">No sessions match those filters.</p>}
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                selectedId === s.id ? 'bg-surface-raised border border-surface-hairline' : 'bg-ink-soft hover:bg-surface-raised'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[typeLookup[s.plan?.sessionType]?.color || 'mist']}`} />
                <span className="text-paper">{typeLookup[s.plan?.sessionType]?.label || 'Session'}</span>
              </span>
              <span className="text-mist text-xs">{formatDateTime(s.date)}</span>
              <span className="text-mist text-xs">{s.status}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
