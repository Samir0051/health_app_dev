import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, RotateCcw } from 'lucide-react'
import { formatMs } from '../utils/format'

const PHASES = {
  IDLE: 'idle',
  WAITING: 'waiting', // blank/grey, counting down to flash
  GO: 'go', // flashed, timing the tap
  RESULT: 'result', // showing this rep's result briefly
  FALSE_START: 'false_start',
  DONE: 'done',
}

/**
 * Timing-gate reaction test.
 * demoCount untimed warm-up taps, then repCount scored reps.
 * Calls onComplete({ taps: number[], meanMs }) once scored reps finish.
 */
export default function ReactionTimeTest({
  demoCount = 2,
  repCount = 5,
  onComplete,
  compareMeanMs = null,
  compact = false,
}) {
  const [phase, setPhase] = useState(PHASES.IDLE)
  const [stage, setStage] = useState('demo') // 'demo' | 'scored'
  const [repIndex, setRepIndex] = useState(0)
  const [taps, setTaps] = useState([])
  const [lastMs, setLastMs] = useState(null)

  const goAtRef = useRef(null)
  const timeoutRef = useRef(null)

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  useEffect(() => () => clearTimer(), [])

  const totalForStage = stage === 'demo' ? demoCount : repCount

  const armNextFlash = useCallback(() => {
    setPhase(PHASES.WAITING)
    goAtRef.current = null
    const delay = 1200 + Math.random() * 2200
    clearTimer()
    timeoutRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase(PHASES.GO)
    }, delay)
  }, [])

  const start = () => {
    setStage(demoCount > 0 ? 'demo' : 'scored')
    setRepIndex(0)
    setTaps([])
    setLastMs(null)
    armNextFlash()
  }

  const advance = useCallback(() => {
    const isLastOfStage = repIndex + 1 >= totalForStage
    if (!isLastOfStage) {
      setRepIndex((i) => i + 1)
      armNextFlash()
      return
    }
    if (stage === 'demo') {
      setStage('scored')
      setRepIndex(0)
      armNextFlash()
    } else {
      setPhase(PHASES.DONE)
    }
  }, [repIndex, totalForStage, stage, armNextFlash])

  const handleTap = () => {
    if (phase === PHASES.WAITING) {
      clearTimer()
      setPhase(PHASES.FALSE_START)
      return
    }
    if (phase === PHASES.GO) {
      const ms = performance.now() - goAtRef.current
      setLastMs(ms)
      if (stage === 'scored') setTaps((prev) => [...prev, ms])
      setPhase(PHASES.RESULT)
      timeoutRef.current = setTimeout(advance, 650)
    }
  }

  const retryFalseStart = () => {
    armNextFlash()
  }

  useEffect(() => {
    if (phase !== PHASES.DONE) return
    const meanMs = taps.length ? taps.reduce((a, b) => a + b, 0) / taps.length : null
    onComplete && onComplete({ taps, meanMs })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && phase !== PHASES.IDLE && phase !== PHASES.DONE && phase !== PHASES.RESULT) {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const meanMs = taps.length ? taps.reduce((a, b) => a + b, 0) / taps.length : null
  const deltaPct = compareMeanMs && meanMs ? ((meanMs - compareMeanMs) / compareMeanMs) * 100 : null

  const gateStyles = {
    [PHASES.IDLE]: 'bg-ink-soft border-surface-hairline',
    [PHASES.WAITING]: 'bg-ink-soft border-surface-hairline',
    [PHASES.GO]: 'bg-gate/15 border-gate shadow-glow',
    [PHASES.RESULT]: 'bg-ink-soft border-track',
    [PHASES.FALSE_START]: 'bg-alert/15 border-alert shadow-glow-red',
    [PHASES.DONE]: 'bg-ink-soft border-surface-hairline',
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {phase !== PHASES.IDLE && phase !== PHASES.DONE && (
        <div className="flex items-center justify-between text-xs">
          <span className="uppercase tracking-wide text-mist">
            {stage === 'demo' ? 'Warm-up tap' : 'Scored rep'} {repIndex + 1} / {totalForStage}
          </span>
          {stage === 'demo' && <span className="text-mist">Not scored</span>}
        </div>
      )}

      <button
        type="button"
        onClick={handleTap}
        disabled={phase === PHASES.IDLE || phase === PHASES.DONE || phase === PHASES.RESULT}
        className={`relative w-full select-none rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-center text-center
          ${compact ? 'h-40' : 'h-56'} ${gateStyles[phase]}`}
      >
        {phase === PHASES.IDLE && (
          <div className="space-y-2 px-6">
            <Hand className="mx-auto h-7 w-7 text-mist" />
            <p className="text-sm text-mist">
              {demoCount > 0 ? `${demoCount} warm-up taps, then ${repCount} scored reps.` : `${repCount} scored reps.`}
            </p>
            <p className="text-xs text-mist/70">Tap or press space the instant the gate flashes green.</p>
          </div>
        )}
        {phase === PHASES.WAITING && (
          <p className="num text-sm text-mist tracking-wide">wait for it…</p>
        )}
        {phase === PHASES.GO && <p className="font-display text-2xl font-semibold text-gate">TAP NOW</p>}
        {phase === PHASES.RESULT && (
          <div>
            <p className="num text-3xl font-semibold text-paper">{formatMs(lastMs)}</p>
            <p className="text-xs text-mist mt-1">{stage === 'demo' ? 'warm-up — not scored' : 'logged'}</p>
          </div>
        )}
        {phase === PHASES.FALSE_START && (
          <div className="space-y-2 px-6">
            <p className="font-display text-lg font-semibold text-alert">Too soon</p>
            <p className="text-xs text-mist">Wait for the gate to flash green before tapping.</p>
          </div>
        )}
        {phase === PHASES.DONE && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-mist">Mean reaction time</p>
            <p className="num text-3xl font-semibold text-paper">{formatMs(meanMs)}</p>
            {deltaPct !== null && (
              <p className={`text-xs ${deltaPct > 8 ? 'text-signal' : deltaPct < -5 ? 'text-gate' : 'text-mist'}`}>
                {deltaPct > 0 ? '+' : ''}
                {deltaPct.toFixed(1)}% vs. baseline
              </p>
            )}
          </div>
        )}
      </button>

      {phase === PHASES.FALSE_START && (
        <button type="button" onClick={retryFalseStart} className="btn-secondary w-full">
          <RotateCcw className="h-4 w-4" /> Try that rep again
        </button>
      )}

      {phase === PHASES.IDLE && (
        <button type="button" onClick={start} className="btn-primary w-full">
          Start test
        </button>
      )}

      {phase === PHASES.DONE && taps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {taps.map((t, i) => (
            <span key={i} className="num rounded-md bg-ink-soft border border-surface-hairline px-2 py-1 text-xs text-mist">
              rep {i + 1}: {formatMs(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
