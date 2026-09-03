import { TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react'
import type { Goals, Macros } from '../types'

interface DaySummaryProps {
  totals: Macros
  goals: Goals
}

/**
 * The calorie goal already has the deficit baked into it, so "how big is my
 * deficit" is measured against maintenance, not against the goal. Eating
 * under the goal isn't automatically better — too deep a deficit is what
 * costs muscle — so this names both directions instead of only warning
 * about overeating.
 */
function deficitStatus(consumedKcal: number, goals: Goals) {
  const target = goals.maintenanceKcal - goals.kcal
  const actual = goals.maintenanceKcal - consumedKcal

  if (actual < 0) {
    return {
      icon: TrendingUp,
      color: 'var(--warning)',
      text: `Superávit de ${Math.abs(Math.round(actual)).toLocaleString('es-MX')} kcal`,
    }
  }
  // Deeper than about 1.6x the plan is where muscle loss risk climbs.
  if (target > 0 && actual > target * 1.6) {
    return {
      icon: AlertTriangle,
      color: 'var(--warning)',
      text: `Déficit de ${Math.round(actual).toLocaleString('es-MX')} kcal — más profundo de lo planeado`,
    }
  }
  if (target > 0 && actual < target * 0.5) {
    return {
      icon: Target,
      color: 'var(--text-dim)',
      text: `Déficit de ${Math.round(actual).toLocaleString('es-MX')} kcal — menor al planeado`,
    }
  }
  return {
    icon: TrendingDown,
    color: 'var(--success)',
    text: `Déficit de ${Math.round(actual).toLocaleString('es-MX')} kcal — en tu rango`,
  }
}

const MACROS = [
  { key: 'protein', label: 'Proteína', color: 'var(--success)' },
  { key: 'carbs', label: 'Carbos', color: 'var(--warning)' },
  { key: 'fat', label: 'Grasas', color: '#bf5af2' },
] as const

function Track({ pct, color, height }: { pct: number; color: string; height: number }) {
  return (
    <div
      className="rounded-full overflow-hidden w-full"
      style={{ height, backgroundColor: 'var(--surface-2)' }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
      />
    </div>
  )
}

/**
 * Leads with the one number that's actually consulted all day — calories
 * left — instead of giving it the same weight as everything else. Macros
 * stay visible but step down a level in the hierarchy.
 */
export function DaySummary({ totals, goals }: DaySummaryProps) {
  const remaining = Math.round(goals.kcal - totals.kcal)
  const over = remaining < 0
  const pct = goals.kcal > 0 ? (totals.kcal / goals.kcal) * 100 : 0
  const Status = deficitStatus(totals.kcal, goals)

  return (
    <div className="rounded-3xl bg-[var(--surface)] px-5 pt-5 pb-4">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-faint)] mb-0.5">
            {over ? 'Sobre el objetivo' : 'Te quedan'}
          </p>
          <p
            className="text-[44px] leading-none font-bold tracking-tight tabular-nums"
            style={{ color: over ? 'var(--warning)' : 'var(--text)' }}
          >
            {Math.abs(remaining).toLocaleString('es-MX')}
          </p>
        </div>
        <p className="text-sm text-[var(--text-faint)] tabular-nums pb-1">
          {Math.round(totals.kcal).toLocaleString('es-MX')} / {goals.kcal.toLocaleString('es-MX')} kcal
        </p>
      </div>

      <Track pct={pct} color={over ? 'var(--warning)' : 'var(--accent)'} height={8} />

      {goals.maintenanceKcal > 0 && (
        <div className="flex items-start gap-2 mt-3.5">
          <Status.icon size={14} color={Status.color} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-snug flex-1" style={{ color: Status.color }}>
            <span className="text-[var(--text-faint)]">Si cierras el día así: </span>
            {Status.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]">
        {MACROS.map(({ key, label, color }) => {
          const value = totals[key]
          const goal = goals[key]
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-[var(--text-faint)]">{label}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--text)] tabular-nums mb-1.5">
                {Math.round(value)}
                <span className="text-[var(--text-faint)] font-normal"> / {Math.round(goal)} g</span>
              </p>
              <Track pct={goal > 0 ? (value / goal) * 100 : 0} color={color} height={4} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
