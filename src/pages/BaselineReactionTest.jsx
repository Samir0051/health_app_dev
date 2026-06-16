import { useMemo, useState } from 'react'
import { Sunrise, Sun, Moon } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import ReactionTimeTest from '../components/ReactionTimeTest'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, formatMs } from '../utils/format'
import { rollingBaseline, overallBaseline } from '../utils/heuristics'

const SCHEDULE = [
  { label: 'Morning', detail: 'on waking', icon: Sunrise },
  { label: '+4 hours', detail: 'mid-day', icon: Sun },
  { label: '+8 hours', detail: 'evening', icon: Moon },
]

export default function BaselineReactionTest() {
  const { baselineTests, addBaselineTest } = useAppData()
  const [contextTag, setContextTag] = useState('')
  const [testKey, setTestKey] = useState(0)
  const [justSaved, setJustSaved] = useState(null)

  const rolling7 = useMemo(() => rollingBaseline(baselineTests, { days: 7 }), [baselineTests])
  const overall = useMemo(() => overallBaseline(baselineTests), [baselineTests])

  function handleComplete({ taps, meanMs }) {
    if (!taps.length) return
    const entry = addBaselineTest({ contextTag: contextTag.trim() || null, taps, meanMs })
    setJustSaved(entry)
  }

  function resetTest() {
    setContextTag('')
    setJustSaved(null)
    setTestKey((k) => k + 1)
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 01"
        title="Baseline reaction test"
        description="Establish a personal neural readiness baseline: a quiet demo phase to wake the nervous system, then five scored reps."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-5">
          <CardHeading title="Test protocol" dotColor="track" />
          <div className="mb-4">
            <label className="label-base" htmlFor="context-tag">
              Tag this session (optional)
            </label>
            <input
              id="context-tag"
              className="input-base"
              placeholder={'e.g. "on caffeine", "post-nap", "race week"'}
              value={contextTag}
              onChange={(e) => setContextTag(e.target.value)}
              disabled={!!justSaved}
            />
          </div>

          {justSaved ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gate/40 bg-gate/10 p-4">
                <p className="text-xs uppercase tracking-wide text-mist">Saved</p>
                <p className="num text-3xl font-semibold text-paper mt-1">{formatMs(justSaved.meanMs)}</p>
                <p className="text-xs text-mist mt-1">
                  {justSaved.contextTag ? `Tagged "${justSaved.contextTag}" · ` : ''}
                  {formatDateTime(justSaved.timestamp)}
                </p>
              </div>
              <button type="button" className="btn-secondary w-full" onClick={resetTest}>
                Run another test
              </button>
            </div>
          ) : (
            <ReactionTimeTest key={testKey} demoCount={2} repCount={5} onComplete={handleComplete} />
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <CardHeading title="Daily schedule" dotColor="gate" />
            <p className="text-sm text-mist mb-4">
              Run this test 3x per day to capture diurnal variation in CNS state. Each session is logged independently.
            </p>
            <div className="space-y-2">
              {SCHEDULE.map((slot) => (
                <div key={slot.label} className="flex items-center gap-3 rounded-lg bg-ink-soft px-3 py-2.5">
                  <slot.icon className="h-4 w-4 text-mist" />
                  <div>
                    <p className="text-sm text-paper">{slot.label}</p>
                    <p className="text-xs text-mist">{slot.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <CardHeading title="Baseline evolution" dotColor="signal" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-ink-soft px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-mist">7-day avg</p>
                <p className="num text-lg font-semibold text-paper">{rolling7 ? formatMs(rolling7) : '—'}</p>
              </div>
              <div className="rounded-lg bg-ink-soft px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-mist">All-time avg</p>
                <p className="num text-lg font-semibold text-paper">{overall ? formatMs(overall) : '—'}</p>
              </div>
            </div>
            <p className="text-xs text-mist mb-2">Recent tests</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {baselineTests.length === 0 && <p className="text-sm text-mist/70">No tests logged yet.</p>}
              {baselineTests.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-ink-soft px-3 py-2 text-xs">
                  <span className="text-mist">{formatDateTime(t.timestamp)}</span>
                  <span className="flex items-center gap-2">
                    {t.contextTag && <span className="rounded-full bg-surface-raised px-2 py-0.5 text-mist">{t.contextTag}</span>}
                    <span className="num text-paper">{formatMs(t.meanMs)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
