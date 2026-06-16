import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CloudSun, ArrowRight, CheckCircle2 } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import ReactionTimeTest from '../components/ReactionTimeTest'
import RestTimer from '../components/RestTimer'
import { FutureCard } from '../components/FutureBadge'
import { useAppData } from '../context/AppDataContext'
import { groupIntoPhases } from '../utils/grouping'
import { recommendRest, continueOrStopSignal, reactionDeltaPct, rollingBaseline, overallBaseline } from '../utils/heuristics'
import { formatMs, formatSec } from '../utils/format'
import { TONE_BG, TONE_TEXT } from '../utils/toneClasses'

const STEPS = { LOG: 'log', REACTION: 'reaction', RECOMMEND: 'recommend', REST: 'rest' }

export default function DuringWorkout() {
  const { currentSession, baselineTests, athlete, updateSession } = useAppData()
  const navigate = useNavigate()

  const groups = useMemo(() => groupIntoPhases(currentSession?.plan?.reps || []), [currentSession])
  const repLogs = currentSession?.duringWorkout?.repLogs || []
  const groupIndex = repLogs.length
  const group = groups[groupIndex]

  const baselineMean =
    currentSession?.preWorkout?.baselineMeanAtCheckIn ??
    rollingBaseline(baselineTests, { days: 7 }) ??
    overallBaseline(baselineTests)

  const [step, setStep] = useState(STEPS.LOG)
  const [actualTime, setActualTime] = useState('')
  const [hr, setHr] = useState('')
  const [reactionResult, setReactionResult] = useState(null)
  const [restRec, setRestRec] = useState(null)
  const [chosenRestSec, setChosenRestSec] = useState(null)
  const [lastSignal, setLastSignal] = useState(null)

  if (!currentSession || !currentSession.plan?.reps?.length) {
    return (
      <div>
        <SectionHeader eyebrow="Stage 05" title="During workout" description="No active plan yet." />
        <div className="card p-6 text-center">
          <p className="text-sm text-mist mb-4">Build a workout plan first, then come back here to run it.</p>
          <Link to="/plan" className="btn-primary inline-flex">
            Go to workout plan
          </Link>
        </div>
      </div>
    )
  }

  const allDone = groupIndex >= groups.length

  function finishActualLog() {
    setStep(STEPS.REACTION)
  }

  function onReactionComplete(result) {
    setReactionResult(result)
    const deltaPct = reactionDeltaPct(result.meanMs, baselineMean)
    const intendedRest = Number(group[group.length - 1].restAfter) || 60
    const rec = recommendRest({
      intendedRestSec: intendedRest,
      deltaPct,
      heartRate: Number(hr) || null,
      restingHeartRate: Number(athlete.restingHeartRate) || null,
    })
    setRestRec({ ...rec, deltaPct, intendedRest })
    setStep(STEPS.RECOMMEND)
  }

  function chooseRest(sec) {
    setChosenRestSec(sec)
    setStep(STEPS.REST)
  }

  function logRest(actualRestSec) {
    const entry = {
      groupIndex,
      repIds: group.map((r) => r.id),
      actualTime,
      hr,
      reactionTest: reactionResult,
      reactionDeltaPct: restRec.deltaPct,
      restRecommendedSec: restRec.recommendedSec,
      restReason: restRec.reason,
      restChosenSec: chosenRestSec,
      actualRestTaken: actualRestSec,
    }
    const updatedLogs = [...repLogs, entry]
    updateSession(currentSession.id, { duringWorkout: { repLogs: updatedLogs } })
    const signal = continueOrStopSignal(updatedLogs)
    setLastSignal(signal)

    setStep(STEPS.LOG)
    setActualTime('')
    setHr('')
    setReactionResult(null)
    setRestRec(null)
    setChosenRestSec(null)
  }

  function endSessionEarly() {
    updateSession(currentSession.id, { status: 'in_progress' })
    navigate('/post-workout')
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 05"
        title="During workout"
        description="Log each rep, run the inter-rep reaction test, and let the data — not a black box — guide the next rest period."
      />

      {lastSignal && !allDone && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            lastSignal.signal === 'stop' ? 'border-alert/40 bg-alert/10 text-alert' : 'border-gate/40 bg-gate/10 text-gate'
          }`}
        >
          {lastSignal.message}
          {lastSignal.signal === 'stop' && (
            <button type="button" onClick={endSessionEarly} className="btn-secondary ml-3 inline-flex">
              End session here
            </button>
          )}
        </div>
      )}

      {allDone ? (
        <div className="card p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-gate mx-auto mb-3" />
          <p className="text-paper font-medium mb-1">All planned reps logged.</p>
          <p className="text-sm text-mist mb-5">Head to post-workout to wrap up the session.</p>
          <Link to="/post-workout" className="btn-primary inline-flex">
            Go to post-workout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <CardHeading title={`Rep ${groupIndex + 1} of ${groups.length}`} dotColor="track" />
              <span className="text-xs text-mist">
                {group.length > 1 ? `${group.length}-phase merged run` : 'single rep'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {group.map((rep, ri) => (
                <span key={rep.id} className="num rounded-md bg-ink-soft border border-surface-hairline px-2.5 py-1 text-xs text-mist">
                  {group.length > 1 ? `phase ${ri + 1}: ` : ''}
                  {rep.distance}
                  {rep.distanceUnit} · {rep.approach}
                  {rep.goalTime ? ` · goal ${rep.goalTime}` : ''}
                </span>
              ))}
            </div>

            {step === STEPS.LOG && (
              <div className="space-y-3">
                <CardHeading title="Per-rep logging" dotColor="gate" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Actual time hit</label>
                    <input className="input-base" placeholder="e.g. 11.4s" value={actualTime} onChange={(e) => setActualTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-base">Heart rate post-rep</label>
                    <input className="input-base" placeholder="172 bpm" value={hr} onChange={(e) => setHr(e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={finishActualLog} disabled={!actualTime} className="btn-primary w-full">
                  Continue to reaction test
                </button>
              </div>
            )}

            {step === STEPS.REACTION && (
              <div className="space-y-3">
                <CardHeading title="Inter-rep reaction test" dotColor="signal" />
                <p className="text-xs text-mist">Same 5-tap protocol, scored against your personal baseline.</p>
                <ReactionTimeTest demoCount={0} repCount={5} onComplete={onReactionComplete} compareMeanMs={baselineMean} />
              </div>
            )}

            {step === STEPS.RECOMMEND && restRec && (
              <div className="space-y-3">
                <CardHeading title="Rest recommendation" dotColor="signal" />
                <div className={`rounded-xl border px-4 py-3 ${TONE_BG[restRec.deltaPct >= 10 ? 'signal' : 'gate']}`}>
                  <p className="text-sm text-paper">{restRec.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-ink-soft px-3 py-2.5 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-mist">Intended</p>
                    <p className="num text-lg text-paper">{formatSec(restRec.intendedRest)}</p>
                  </div>
                  <div className="rounded-lg bg-ink-soft px-3 py-2.5 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-mist">Recommended</p>
                    <p className={`num text-lg ${TONE_TEXT[restRec.deltaPct >= 10 ? 'signal' : 'gate']}`}>{formatSec(restRec.recommendedSec)}</p>
                  </div>
                </div>
                <p className="text-xs text-mist/70">You and your coach make the final call — this never overrides your plan automatically.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => chooseRest(restRec.intendedRest)} className="btn-secondary flex-1">
                    Keep intended
                  </button>
                  <button type="button" onClick={() => chooseRest(restRec.recommendedSec)} className="btn-primary flex-1">
                    Use recommended
                  </button>
                </div>
              </div>
            )}

            {step === STEPS.REST && chosenRestSec !== null && (
              <div className="space-y-3">
                <CardHeading title="Rest" dotColor="gate" />
                <RestTimer targetSeconds={chosenRestSec} onLogRest={logRest} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <CardHeading title="Session log" dotColor="mist" />
              {repLogs.length === 0 && <p className="text-sm text-mist/70">Nothing logged yet this session.</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {repLogs.map((log, i) => (
                  <div key={i} className="rounded-lg bg-ink-soft px-3 py-2 text-xs">
                    <div className="flex justify-between text-paper">
                      <span>rep {i + 1}</span>
                      <span className="num">{log.actualTime}</span>
                    </div>
                    <div className="flex justify-between text-mist mt-0.5">
                      <span>reaction {formatMs(log.reactionTest?.meanMs)}</span>
                      <span>rest {formatSec(log.actualRestTaken)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FutureCard
              title="Blood lactate (optional)"
              description="Manual entry between reps adds a metabolic fatigue layer to the neural readiness picture — especially useful for 400m+ reps."
            >
              <input className="input-base mt-2" placeholder="mmol/L" disabled />
            </FutureCard>

            <FutureCard
              title="Weather"
              description="Auto-pulled via GPS. Heat index and humidity will adjust lactate clearance and recovery-driven rest recommendations."
            >
              <div className="flex items-center gap-2 mt-2 text-sm text-mist">
                <CloudSun className="h-4 w-4" /> — °F · — % humidity
              </div>
            </FutureCard>
          </div>
        </div>
      )}
    </div>
  )
}
