import { useEffect, useRef, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { formatSec } from '../utils/format'

export default function RestTimer({ targetSeconds, onLogRest, autoStart = true }) {
  const [running, setRunning] = useState(autoStart)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now() - elapsed * 1000
    const interval = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000)
    }, 200)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const over = targetSeconds && elapsed > targetSeconds
  const progress = targetSeconds ? Math.min(1, elapsed / targetSeconds) : 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-mist">Rest elapsed</p>
        {targetSeconds ? (
          <p className="text-xs text-mist">
            target <span className="num text-paper">{formatSec(targetSeconds)}</span>
          </p>
        ) : null}
      </div>
      <p className={`num mt-2 text-4xl font-semibold ${over ? 'text-signal' : 'text-paper'}`}>{formatSec(elapsed)}</p>

      {targetSeconds ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-soft">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-signal' : 'bg-gate'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setRunning((r) => !r)} className="btn-secondary flex-1">
          {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            onLogRest(Math.round(elapsed))
          }}
          className="btn-primary flex-1"
        >
          Log rest &amp; continue
        </button>
      </div>
    </div>
  )
}
