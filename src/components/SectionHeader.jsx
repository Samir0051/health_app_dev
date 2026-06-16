export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-track mb-2">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold text-paper">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-mist">{description}</p>}
      <div className="tick-divider mt-5" />
    </div>
  )
}

export function CardHeading({ title, dotColor = 'gate' }) {
  const dot = {
    gate: 'bg-gate',
    track: 'bg-track',
    signal: 'bg-signal',
    alert: 'bg-alert',
    mist: 'bg-mist',
  }[dotColor]

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <h3 className="font-display text-sm font-semibold text-paper">{title}</h3>
    </div>
  )
}
