import { createContext, useContext, useEffect, useState } from 'react'
import { loadJSON, saveJSON, newId } from '../utils/storage'

const AppDataContext = createContext(null)

const DEFAULT_ATHLETE = {
  name: '',
  height: '',
  weight: '',
  age: '',
  eventDiscipline: '400m',
  level: 'Collegiate',
  seasonGoal: '',
  restingHeartRate: '',
  personalRecords: {}, // { '400m': '47.82' }
  recentTimes: [], // [{ id, event, time, date, note }]
}

const EVENT_OPTIONS = ['100m', '200m', '400m', '800m', '1500m', '5000m', '10000m', 'Marathon']
const LEVEL_OPTIONS = ['High School', 'Collegiate', 'Semi-Pro', 'Recreational']
const SESSION_TYPES = [
  { id: 'recovery', label: 'Recovery', color: 'gate' },
  { id: 'max_velocity', label: 'Max Velocity', color: 'track' },
  { id: 'special_endurance', label: 'Special Endurance', color: 'signal' },
  { id: 'tempo', label: 'Tempo', color: 'mist' },
  { id: 'race_simulation', label: 'Race Simulation', color: 'alert' },
  { id: 'deep_anaerobic', label: 'Deep Anaerobic', color: 'track' },
]
const APPROACH_OPTIONS = ['All-out', 'Max velocity', 'Even/smooth', 'Maintain cadence', 'Tempo']

export function AppDataProvider({ children }) {
  const [athlete, setAthlete] = useState(() => loadJSON('athlete', DEFAULT_ATHLETE))
  const [baselineTests, setBaselineTests] = useState(() => loadJSON('baselineTests', []))
  const [sessions, setSessions] = useState(() => loadJSON('sessions', []))
  const [currentSessionId, setCurrentSessionId] = useState(() => loadJSON('currentSessionId', null))

  useEffect(() => saveJSON('athlete', athlete), [athlete])
  useEffect(() => saveJSON('baselineTests', baselineTests), [baselineTests])
  useEffect(() => saveJSON('sessions', sessions), [sessions])
  useEffect(() => saveJSON('currentSessionId', currentSessionId), [currentSessionId])

  function updateAthlete(patch) {
    setAthlete((prev) => ({ ...prev, ...patch }))
  }

  function addBaselineTest(test) {
    const entry = { id: newId('baseline'), timestamp: new Date().toISOString(), ...test }
    setBaselineTests((prev) => [entry, ...prev])
    return entry
  }

  function createSession(session) {
    const entry = {
      id: newId('session'),
      createdAt: new Date().toISOString(),
      date: session.date || new Date().toISOString(),
      status: 'planned',
      plan: { reps: [] },
      preWorkout: null,
      duringWorkout: { repLogs: [] },
      postWorkout: null,
      ...session,
    }
    setSessions((prev) => [entry, ...prev])
    return entry
  }

  function updateSession(id, patch) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s))
    )
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null

  function getOrCreateCurrentSession() {
    if (currentSession && currentSession.status !== 'completed') return currentSession
    const entry = createSession({})
    setCurrentSessionId(entry.id)
    return entry
  }

  function updateCurrentSession(patch) {
    if (!currentSessionId) return
    updateSession(currentSessionId, patch)
  }

  function finishCurrentSession() {
    if (currentSessionId) updateSession(currentSessionId, { status: 'completed' })
    setCurrentSessionId(null)
  }

  const value = {
    athlete,
    updateAthlete,
    baselineTests,
    addBaselineTest,
    sessions,
    createSession,
    updateSession,
    deleteSession,
    currentSession,
    getOrCreateCurrentSession,
    updateCurrentSession,
    finishCurrentSession,
    EVENT_OPTIONS,
    LEVEL_OPTIONS,
    SESSION_TYPES,
    APPROACH_OPTIONS,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
