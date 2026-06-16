import { NavLink } from 'react-router-dom'
import { Zap, UserRound, ClipboardCheck, ListTree, Activity, ClipboardList, CalendarDays } from 'lucide-react'

// eslint-disable-next-line react-refresh/only-export-components
export const STAGES = [
  { num: '01', to: '/baseline', label: 'Baseline reaction test', icon: Zap },
  { num: '02', to: '/profile', label: 'Athlete profile', icon: UserRound },
  { num: '03', to: '/check-in', label: 'Pre-workout check-in', icon: ClipboardCheck },
  { num: '04', to: '/plan', label: 'Workout plan', icon: ListTree },
  { num: '05', to: '/workout', label: 'During workout', icon: Activity },
  { num: '06', to: '/post-workout', label: 'Post-workout', icon: ClipboardList },
  { num: '07', to: '/calendar', label: 'Calendar & archive', icon: CalendarDays },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-surface-hairline bg-ink-soft">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gate shadow-glow" />
          <p className="font-display text-sm font-semibold tracking-wide text-paper">NEURAL READINESS</p>
        </div>
        <p className="mt-1 text-xs text-mist">Training console</p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto">
        {STAGES.map((stage) => (
          <NavLink
            key={stage.to}
            to={stage.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors border-l-2 ${
                isActive
                  ? 'border-track bg-surface text-paper'
                  : 'border-transparent text-mist hover:text-paper hover:bg-surface/60'
              }`
            }
          >
            <span className="num text-[11px] text-mist/70 w-5">{stage.num}</span>
            <stage.icon className="h-4 w-4 shrink-0" />
            <span className="leading-tight">{stage.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-surface-hairline space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-mist">
          <span className="h-1.5 w-1.5 rounded-full bg-gate" /> MVP — built &amp; functional
        </div>
        <div className="flex items-center gap-2 text-[11px] text-mist">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Future addition
        </div>
      </div>
    </aside>
  )
}
