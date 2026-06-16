import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import ReactionTimeTest from '../components/ReactionTimeTest'
import { FutureBadge } from '../components/FutureBadge'
import { useAppData } from '../context/AppDataContext'
import { rollingBaseline, overallBaseline, readinessLabel, reactionDeltaPct } from '../utils/heuristics'
import { TONE_BG, TONE_TEXT } from '../utils/toneClasses'
import { formatMs } from '../utils/format'

export default function PreWorkoutCheckIn() {
  const { baselineTests, athlete, getOrCreateCurrentSession, updateSession } = useAppData()
  const navigate = useNavigate()

  const [hrv, setHrv] = useState('')
  const [hoursSleep, setHoursSleep] = useState('')
  const [readinessText, setReadinessText] = useState('')
  const [restingHR, setRestingHR] = useState(athlete.restingHeartRate || '')
  const [reactionResult, setReactionResult] = useState(null)

  const baselineMean = useMemo(
    () => rollingBaseline(baselineTests, { days: 7 }) ?? overallBaseline(baselineTests),
    [baselineTests]
  )

  const delta = reactionResult ? reactionDeltaPct(reactionResult.meanMs, baselineMean) : null
  const readiness = delta !== null ? readinessLabel(delta) : null

  function saveAndContinue() {
    const session = getOrCreateCurrentSession()
    updateSession(session.id, {
      preWorkout: {
        hrv,
        hoursSleep,
        readinessText,
        restingHR,
        reactionTest: reactionResult,
        baselineMeanAtCheckIn: baselineMean,
      },
    })
    navigate('/plan')
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 03"
        title="Pre-workout check-in"
        description="Sleep, subjective readiness, and a fresh reaction test compared against your rolling baseline."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <CardHeading title="Sleep quality" dotColor="track" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">HRV</label>
              <input className="input-base" placeholder="62 ms" value={hrv} onChange={(e) => setHrv(e.target.value)} />
            </div>
            <div>
              <label className="label-base">Hours of sleep</label>
              <input
                className="input-base"
                placeholder="7.5"
                value={hoursSleep}
                onChange={(e) => setHoursSleep(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            disabled
            className="mt-4 w-full flex items-center justify-between rounded-lg border border-dashed border-surface-hairline px-3 py-2.5 text-sm text-mist/70 cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Connect Apple Health, Garmin, or Whoop
            </span>
            <FutureBadge />
          </button>
        </div>

        <div className="card p-5">
          <CardHeading title="Subjective readiness" dotColor="gate" />
          <div className="mb-3">
            <label className="label-base">How are you feeling going in?</label>
            <textarea
              className="input-base min-h-[88px] resize-none"
              placeholder="Legs feel fresh, slept well, a little tight in the left hamstring..."
              value={readinessText}
              onChange={(e) => setReadinessText(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Heart rate at rest</label>
            <input
              className="input-base max-w-[160px]"
              placeholder="58 bpm"
              value={restingHR}
              onChange={(e) => setRestingHR(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <CardHeading title="Reaction time test" dotColor="signal" />
          {reactionResult ? (
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-ink-soft px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-mist">Today's mean</p>
                <p className="num text-lg font-semibold text-paper">{formatMs(reactionResult.meanMs)}</p>
              </div>
              <div className="rounded-lg bg-ink-soft px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-mist">Baseline</p>
                <p className="num text-lg font-semibold text-paper">{baselineMean ? formatMs(baselineMean) : '—'}</p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 ${TONE_BG[readiness?.tone] || ''}`}>
                <p className="text-[11px] uppercase tracking-wide text-mist">Readiness signal</p>
                <p className={`text-sm font-semibold ${TONE_TEXT[readiness?.tone] || 'text-paper'}`}>{readiness?.label}</p>
              </div>
            </div>
          ) : (
            <ReactionTimeTest demoCount={1} repCount={5} onComplete={setReactionResult} compareMeanMs={baselineMean} />
          )}

          <button type="button" onClick={saveAndContinue} disabled={!reactionResult} className="btn-primary w-full mt-5">
            Save check-in &amp; continue to workout plan
          </button>
        </div>
      </div>
    </div>
  )
}
