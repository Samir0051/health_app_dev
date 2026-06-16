import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import SectionHeader, { CardHeading } from '../components/SectionHeader'
import { useAppData } from '../context/AppDataContext'
import { newId } from '../utils/storage'

export default function AthleteProfile() {
  const { athlete, updateAthlete, EVENT_OPTIONS, LEVEL_OPTIONS } = useAppData()
  const [newRecent, setNewRecent] = useState({ event: EVENT_OPTIONS[2], time: '', date: '', note: '' })

  function field(key) {
    return {
      value: athlete[key] ?? '',
      onChange: (e) => updateAthlete({ [key]: e.target.value }),
    }
  }

  function setPR(event, time) {
    updateAthlete({ personalRecords: { ...athlete.personalRecords, [event]: time } })
  }

  function addRecentTime() {
    if (!newRecent.time.trim()) return
    const entry = { id: newId('recent'), ...newRecent }
    updateAthlete({ recentTimes: [entry, ...(athlete.recentTimes || [])] })
    setNewRecent({ event: EVENT_OPTIONS[2], time: '', date: '', note: '' })
  }

  function removeRecentTime(id) {
    updateAthlete({ recentTimes: (athlete.recentTimes || []).filter((r) => r.id !== id) })
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Stage 02"
        title="Athlete profile"
        description="Physical info, personal records, and goals — the personal context every other stage compares against."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <CardHeading title="Physical info" dotColor="track" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="label-base">Height</label>
              <input className="input-base" placeholder={'5\'10"'} {...field('height')} />
            </div>
            <div>
              <label className="label-base">Weight</label>
              <input className="input-base" placeholder="165 lb" {...field('weight')} />
            </div>
            <div>
              <label className="label-base">Age</label>
              <input className="input-base" type="number" placeholder="21" {...field('age')} />
            </div>
          </div>
          <div className="mb-1">
            <label className="label-base">Event / discipline</label>
            <select className="input-base" {...field('eventDiscipline')}>
              {EVENT_OPTIONS.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-mist/70 mt-1.5">More events will be added in later versions.</p>
        </div>

        <div className="card p-5">
          <CardHeading title="Athlete level & goals" dotColor="gate" />
          <div className="mb-4">
            <label className="label-base">Level</label>
            <select className="input-base" {...field('level')}>
              {LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Season goal, in your own words</label>
            <textarea
              className="input-base min-h-[88px] resize-none"
              placeholder="e.g. Break 48 seconds in the 400m by conference championships."
              {...field('seasonGoal')}
            />
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <CardHeading title="Personal records" dotColor="track" />
          <div className="mb-5">
            <label className="label-base">Heart rate at rest</label>
            <input className="input-base max-w-xs" placeholder="58 bpm" {...field('restingHeartRate')} />
            <p className="text-xs text-mist/70 mt-1.5">Manual entry for now — wearable sync (Apple Health, Garmin, Whoop) is planned.</p>
          </div>

          <p className="label-base">Best time per event</p>
          <div className="grid sm:grid-cols-2 gap-2 mb-6">
            {EVENT_OPTIONS.map((ev) => (
              <div key={ev} className="flex items-center gap-2 rounded-lg bg-ink-soft px-3 py-2">
                <span className="text-sm text-mist w-20 shrink-0">{ev}</span>
                <input
                  className="num bg-transparent text-sm text-paper flex-1 outline-none placeholder:text-mist/50"
                  placeholder="—"
                  value={athlete.personalRecords?.[ev] ?? ''}
                  onChange={(e) => setPR(ev, e.target.value)}
                />
              </div>
            ))}
          </div>

          <p className="label-base">Recent times run (consistency context)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <select
              className="input-base w-auto"
              value={newRecent.event}
              onChange={(e) => setNewRecent((r) => ({ ...r, event: e.target.value }))}
            >
              {EVENT_OPTIONS.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
            <input
              className="input-base w-28"
              placeholder="Time"
              value={newRecent.time}
              onChange={(e) => setNewRecent((r) => ({ ...r, time: e.target.value }))}
            />
            <input
              type="date"
              className="input-base w-auto"
              value={newRecent.date}
              onChange={(e) => setNewRecent((r) => ({ ...r, date: e.target.value }))}
            />
            <input
              className="input-base flex-1 min-w-[140px]"
              placeholder="Note (optional)"
              value={newRecent.note}
              onChange={(e) => setNewRecent((r) => ({ ...r, note: e.target.value }))}
            />
            <button type="button" onClick={addRecentTime} className="btn-secondary">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="space-y-1.5">
            {(athlete.recentTimes || []).length === 0 && <p className="text-sm text-mist/70">No recent times logged yet.</p>}
            {(athlete.recentTimes || []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-ink-soft px-3 py-2 text-sm">
                <span className="text-mist">
                  {r.event} · <span className="num text-paper">{r.time}</span>
                  {r.date && <span className="text-mist"> · {r.date}</span>}
                  {r.note && <span className="text-mist"> · {r.note}</span>}
                </span>
                <button type="button" onClick={() => removeRecentTime(r.id)} className="text-mist hover:text-alert">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
