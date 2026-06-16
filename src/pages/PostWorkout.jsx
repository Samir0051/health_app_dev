import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import ReactionTimeTest from '../components/ReactionTimeTest'
import { useAppData } from '../context/AppDataContext'
import { rollingBaseline, overallBaseline, reactionDeltaPct } from '../utils/heuristics'
import { formatMs, formatSec, formatDateTime } from '../utils/format'

export default function PostWorkout() {
  const { currentSession, baselineTests, finishCurrentSession, updateSession } = useAppData()
  const navigate = useNavigate()

  const [finalReaction, setFinalReaction] = useState(null)
  const [perceivedEffort, setPerceivedEffort] = useState(5)
  const [feltQuality, setFeltQuality] = useState(5)
  const [finishNotes, setFinishNotes] = useState('')
  const [completed, setCompleted] = useState(true)
  const [notFinishedReason, setNotFinishedReason] = useState('')

  const baselineMean =
    currentSession?.preWorkout?.baselineMeanAtCheckIn ??
    rollingBaseline(baselineTests, { days: 7 }) ??
    overallBaseline(baselineTests)

  const preMeanMs = currentSession?.preWorkout?.reactionTest?.meanMs
  const cnsFatigueDelta = finalReaction && preMeanMs ? reactionDeltaPct(finalReaction.meanMs, preMeanMs) : null

  const repLogs = currentSession?.duringWorkout?.repLogs || []
  const degradationIndex = repLogs.findIndex((r) => r.reactionDeltaPct >= 15)

  if (!currentSession) {
    return (
      <div>
        <SectionHeader eyebrow="Stage 06" title="Post-workout" description="No active session." />
        <div className="card p-6 text-center">
          <p className="text-sm text-mist mb-4">Start a session from the pre-workout check-in before wrapping it up here.</p>
          <Link to="/check-in" className="btn-primary inline-flex">
            Go to check-in
          </Link>
        </div>
      </div>
    )
  }

  function completeSession() {
    updateSession(currentSession.id, {
      postWorkout: {
        finalReactionTest: finalReaction,
        perceivedEffort,
        feltQuality,
        finishNotes,
        completed,
        notFinishedReason: completed ? '' : notFinishedReason,
        cnsFatigueDelta,
      },
    })
    finishCurrentSession()
    navigate('/calendar')
  }

  function exportReport() {
    const report = {
      date: currentSession.date,
      sessionType: currentSession.plan?.sessionType,
      preWorkout: currentSession.preWorkout,
      plan: currentSession.plan,
      repLogs,
      finalReactionTest: finalReaction,
      perceivedEffort,
      feltQuality,
      finishNotes,
      completed,
      notFinishedReason: completed ? '' : notFinishedReason,
      degradationBeganAtRep: degradationIndex >= 0 ? degradationIndex + 1 : null,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-report-${new Date(currentSession.date).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 06"
        title="Post-workout"
        description="Final reaction test, how the session felt, and a report you can hand to a coach."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <CardHeading title="Final reaction test" dotColor="track" />
          {finalReaction ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-ink-soft px-2 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-mist">Final</p>
                <p className="num text-base text-paper">{formatMs(finalReaction.meanMs)}</p>
              </div>
              <div className="rounded-lg bg-ink-soft px-2 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-mist">Baseline</p>
                <p className="num text-base text-paper">{baselineMean ? formatMs(baselineMean) : '—'}</p>
              </div>
              <div className="rounded-lg bg-ink-soft px-2 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-mist">CNS fatigue</p>
                <p className={`num text-base ${cnsFatigueDelta > 8 ? 'text-signal' : 'text-paper'}`}>
                  {cnsFatigueDelta !== null ? `${cnsFatigueDelta > 0 ? '+' : ''}${cnsFatigueDelta.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
          ) : (
            <ReactionTimeTest demoCount={0} repCount={5} onComplete={setFinalReaction} compareMeanMs={baselineMean} />
          )}
        </div>

        <div className="card p-5">
          <CardHeading title="Subjective ratings" dotColor="gate" />
          <div className="mb-4">
            <label className="label-base">
              Perceived effort — <span className="num text-paper">{perceivedEffort}</span>/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={perceivedEffort}
              onChange={(e) => setPerceivedEffort(Number(e.target.value))}
              className="w-full accent-track"
            />
          </div>
          <div className="mb-4">
            <label className="label-base">
              Felt quality — <span className="num text-paper">{feltQuality}</span>/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={feltQuality}
              onChange={(e) => setFeltQuality(Number(e.target.value))}
              className="w-full accent-gate"
            />
          </div>
          <div>
            <label className="label-base">Finish notes</label>
            <textarea
              className="input-base min-h-[72px] resize-none"
              placeholder="Anything that can only be said in words."
              value={finishNotes}
              onChange={(e) => setFinishNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <CardHeading title="Completion log" dotColor="signal" />
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setCompleted(true)}
              className={completed ? 'btn-primary' : 'btn-secondary'}
            >
              Finished as planned
            </button>
            <button
              type="button"
              onClick={() => setCompleted(false)}
              className={!completed ? 'btn-primary' : 'btn-secondary'}
            >
              Stopped early
            </button>
          </div>
          {!completed && (
            <input
              className="input-base"
              placeholder="How far did they get, and why?"
              value={notFinishedReason}
              onChange={(e) => setNotFinishedReason(e.target.value)}
            />
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <CardHeading title="Session report" dotColor="mist" />
            <button type="button" onClick={exportReport} className="btn-ghost">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
          {repLogs.length === 0 ? (
            <p className="text-sm text-mist/70">No reps logged during this session.</p>
          ) : (
            <div className="space-y-1.5">
              {repLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                    i === degradationIndex ? 'bg-signal/10 border border-signal/40' : 'bg-ink-soft'
                  }`}
                >
                  <span className="text-paper">rep {i + 1}</span>
                  <span className="num text-mist">actual {log.actualTime}</span>
                  <span className="num text-mist">reaction {formatMs(log.reactionTest?.meanMs)}</span>
                  <span className="num text-mist">
                    rest {formatSec(log.actualRestTaken)} / {formatSec(log.restChosenSec)}
                  </span>
                  {i === degradationIndex && <span className="text-signal font-medium">degradation began here</span>}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-mist/70 mt-3">{formatDateTime(currentSession.date)}</p>
        </div>
      </div>

      <button type="button" onClick={completeSession} disabled={!finalReaction} className="btn-primary w-full mt-6">
        Complete session
      </button>
    </div>
  )
}
