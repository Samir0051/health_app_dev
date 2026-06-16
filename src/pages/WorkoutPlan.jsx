import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import { useAppData } from '../context/AppDataContext'
import { newId } from '../utils/storage'
import { TONE_DOT } from '../utils/toneClasses'
import { groupIntoPhases } from '../utils/grouping'

const UNIT_OPTIONS = ['m', 'km', 'ft', 'mi']


export default function WorkoutPlan() {
  const { getOrCreateCurrentSession, updateSession, currentSession, SESSION_TYPES, APPROACH_OPTIONS } = useAppData()
  const navigate = useNavigate()

  const [sessionType, setSessionType] = useState(currentSession?.plan?.sessionType || SESSION_TYPES[0].id)
  const [reps, setReps] = useState(currentSession?.plan?.reps || [])
  const [draft, setDraft] = useState({
    distance: '',
    distanceUnit: 'm',
    goalTime: '',
    approach: APPROACH_OPTIONS[0],
    restAfter: '90',
  })

  const groups = useMemo(() => groupIntoPhases(reps), [reps])
  const selectedType = SESSION_TYPES.find((t) => t.id === sessionType)

  function addRep() {
    if (!draft.distance) return
    setReps((prev) => [...prev, { id: newId('rep'), ...draft }])
    setDraft((d) => ({ ...d, distance: '', goalTime: '' }))
  }

  function removeRep(id) {
    setReps((prev) => prev.filter((r) => r.id !== id))
  }

  function persist(patch = {}) {
    const session = getOrCreateCurrentSession()
    updateSession(session.id, { plan: { sessionType, reps, ...patch } })
    return session
  }

  function savePlan() {
    persist()
  }

  function saveAndStart() {
    persist()
    navigate('/workout')
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 04"
        title="Workout plan"
        description="Pick a session type, then build the rep structure. Set rest to 0 between reps to merge them into one continuous phased run."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <CardHeading title="Session type" dotColor="track" />
            <p className="text-sm text-mist mb-3">Sets the neural fatigue model used during the session.</p>
            <div className="space-y-1.5">
              {SESSION_TYPES.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    sessionType === t.id ? 'bg-surface-raised border border-surface-hairline' : 'hover:bg-surface/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="sessionType"
                    className="accent-track"
                    checked={sessionType === t.id}
                    onChange={() => setSessionType(t.id)}
                  />
                  <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[t.color]}`} />
                  <span className="text-paper">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <CardHeading title="Add a rep" dotColor="gate" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="Distance"
                  value={draft.distance}
                  onChange={(e) => setDraft((d) => ({ ...d, distance: e.target.value }))}
                />
                <select
                  className="input-base w-24"
                  value={draft.distanceUnit}
                  onChange={(e) => setDraft((d) => ({ ...d, distanceUnit: e.target.value }))}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Goal time</label>
                <input
                  className="input-base"
                  placeholder="e.g. 11.2s or 1:32"
                  value={draft.goalTime}
                  onChange={(e) => setDraft((d) => ({ ...d, goalTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-base">Approach</label>
                <select
                  className="input-base"
                  value={draft.approach}
                  onChange={(e) => setDraft((d) => ({ ...d, approach: e.target.value }))}
                >
                  {APPROACH_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Rest after this rep (seconds)</label>
                <input
                  className="input-base"
                  type="number"
                  min="0"
                  placeholder="90"
                  value={draft.restAfter}
                  onChange={(e) => setDraft((d) => ({ ...d, restAfter: e.target.value }))}
                />
                <p className="text-xs text-mist/70 mt-1.5">Use 0 to merge this rep into one continuous phased run with the next.</p>
              </div>
              <button type="button" onClick={addRep} className="btn-secondary w-full">
                <Plus className="h-4 w-4" /> Add rep
              </button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <CardHeading title="Rep structure" dotColor="signal" />
          {groups.length === 0 && <p className="text-sm text-mist/70">No reps added yet — build the session on the left.</p>}

          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group[0].id} className="rounded-xl border border-surface-hairline overflow-hidden">
                {group.length > 1 && (
                  <div className="bg-surface-raised px-3 py-1.5 text-[11px] uppercase tracking-wide text-mist">
                    Merged phase run · {group.reduce((sum, r) => sum + (Number(r.distance) || 0), 0)}
                    {group[0].distanceUnit} total
                  </div>
                )}
                <div className="divide-y divide-surface-hairline">
                  {group.map((rep, ri) => (
                    <div key={rep.id} className="flex items-center justify-between px-3 py-2.5 bg-ink-soft">
                      <div className="flex items-center gap-3 text-sm">
                        {group.length > 1 && <span className="text-mist text-xs">phase {ri + 1}</span>}
                        <span className="num text-paper">
                          {rep.distance}
                          {rep.distanceUnit}
                        </span>
                        <span className="text-mist text-xs">{rep.approach}</span>
                        {rep.goalTime && <span className="num text-xs text-mist">goal {rep.goalTime}</span>}
                      </div>
                      <button type="button" onClick={() => removeRep(rep.id)} className="text-mist hover:text-alert">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {Number(group[group.length - 1].restAfter) > 0 && (
                  <div className="px-3 py-1.5 text-xs text-mist bg-surface/50">
                    rest <span className="num text-paper">{group[group.length - 1].restAfter}s</span> before next
                  </div>
                )}
              </div>
            ))}
          </div>

          {groups.length > 0 && (
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={savePlan} className="btn-secondary flex-1">
                Save plan
              </button>
              <button type="button" onClick={saveAndStart} className="btn-primary flex-1">
                Save &amp; start workout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedType && (
        <p className="mt-6 text-xs text-mist">
          Selected: <span className="text-paper">{selectedType.label}</span> session — drives how rest recommendations are weighted during the workout.
        </p>
      )}
    </div>
  )
}
