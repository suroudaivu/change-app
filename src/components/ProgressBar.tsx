interface ProgressBarProps {
  label: string
  consumed: number
  goal: number
  unit: string
  color: string
}

export function ProgressBar({ label, consumed, goal, unit, color }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  const remaining = Math.round(goal - consumed)

  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        <span className="text-sm text-[var(--text-dim)]">
          {Math.round(consumed)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-[var(--text-faint)] mt-1">
        {remaining >= 0 ? `Faltan ${remaining} ${unit}` : `${-remaining} ${unit} sobre el objetivo`}
      </p>
    </div>
  )
}
