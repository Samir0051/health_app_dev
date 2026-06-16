import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar, { STAGES } from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-surface-hairline bg-ink-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gate shadow-glow" />
            <p className="font-display text-sm font-semibold text-paper">NEURAL READINESS</p>
          </div>
          <button type="button" onClick={() => setMobileOpen(true)} className="text-paper p-1">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-ink/95 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-hairline">
              <p className="font-display text-sm font-semibold text-paper">Stages</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-paper p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {STAGES.map((stage) => (
                <NavLink
                  key={stage.to}
                  to={stage.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm border-l-2 ${
                      isActive ? 'border-track bg-surface text-paper' : 'border-transparent text-mist'
                    }`
                  }
                >
                  <span className="num text-[11px] text-mist/70 w-5">{stage.num}</span>
                  <stage.icon className="h-4 w-4 shrink-0" />
                  {stage.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 px-5 py-8 md:px-10 md:py-10 max-w-5xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
