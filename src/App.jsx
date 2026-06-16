import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import BaselineReactionTest from './pages/BaselineReactionTest'
import AthleteProfile from './pages/AthleteProfile'
import PreWorkoutCheckIn from './pages/PreWorkoutCheckIn'
import WorkoutPlan from './pages/WorkoutPlan'
import DuringWorkout from './pages/DuringWorkout'
import PostWorkout from './pages/PostWorkout'
import CalendarArchive from './pages/CalendarArchive'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/baseline" replace />} />
        <Route path="/baseline" element={<BaselineReactionTest />} />
        <Route path="/profile" element={<AthleteProfile />} />
        <Route path="/check-in" element={<PreWorkoutCheckIn />} />
        <Route path="/plan" element={<WorkoutPlan />} />
        <Route path="/workout" element={<DuringWorkout />} />
        <Route path="/post-workout" element={<PostWorkout />} />
        <Route path="/calendar" element={<CalendarArchive />} />
        <Route path="*" element={<Navigate to="/baseline" replace />} />
      </Route>
    </Routes>
  )
}

export default App
