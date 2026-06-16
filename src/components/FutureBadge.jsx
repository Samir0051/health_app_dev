import { Clock } from 'lucide-react'

export function FutureBadge({ label = 'Future' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  )
}

export function FutureCard({ title, description, children }) {
  return (
    <div className="card relative p-5 opacity-70">
      <div className="absolute right-4 top-4">
        <FutureBadge />
      </div>
      <h3 className="font-display text-sm font-semibold text-paper pr-16">{title}</h3>
      {description && <p className="mt-1 text-sm text-mist">{description}</p>}
      {children && <div className="mt-3 pointer-events-none grayscale-[40%]">{children}</div>}
    </div>
  )
}
