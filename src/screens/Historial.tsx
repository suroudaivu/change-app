import { Dumbbell } from 'lucide-react'
import type { AppData } from '../types'
import { computeDayMacros, todayISO } from '../storage'

interface HistorialProps {
  data: AppData
  onOpenDay: (date: string) => void
}

interface DayRow {
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  gymDay: boolean
  weightKg?: number
  logged: boolean
}

function buildRows(data: AppData): DayRow[] {
  // A day counts as history if it has a food log or a weigh-in — either one
  // is a real data point worth comparing.
  const dates = new Set([...Object.keys(data.dayLogs), ...data.weightLog.map((w) => w.date)])

  return [...dates]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const log = data.dayLogs[date]
      const macros = log ? computeDayMacros(data, log) : { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      return {
        date,
        ...macros,
        gymDay: !!log?.gymDay,
        weightKg: data.weightLog.find((w) => w.date === date)?.kg,
        logged: macros.kcal > 0,
      }
    })
}

export function Historial({ data, onOpenDay }: HistorialProps) {
  const rows = buildRows(data)
  const today = todayISO()

  // Averages only count days actually eaten on, so a missed day doesn't drag
  // the average down as if it were a zero-calorie day.
  const last7 = rows.filter((r) => r.date > shiftISO(today, -7))
  const logged7 = last7.filter((r) => r.logged)
  const avg = (pick: (r: DayRow) => number) =>
    logged7.length ? Math.round(logged7.reduce((s, r) => s + pick(r), 0) / logged7.length) : null

  const avgKcal = avg((r) => r.kcal)
  const avgProtein = avg((r) => r.protein)
  const gymCount = last7.filter((r) => r.gymDay).length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-4">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[var(--text)]">
          Historial
        </h1>
      </div>

      {rows.length === 0 ? (
        <p className="px-8 mt-8 text-center text-sm text-[var(--text-faint)] leading-relaxed">
          Aquí vas a ver tus días registrados para compararlos entre sí.
        </p>
      ) : (
        <>
          <div className="px-5 mt-4">
            <div className="rounded-3xl bg-[var(--surface)] px-5 py-4">
              <p className="text-xs font-medium text-[var(--text-faint)] mb-3">Últimos 7 días</p>
              <div className="grid grid-cols-3 gap-3">
                <Summary
                  label="Kcal / día"
                  value={avgKcal?.toLocaleString('es-MX') ?? '—'}
                  hint={`meta ${data.goals.kcal.toLocaleString('es-MX')}`}
                  off={avgKcal != null && Math.abs(avgKcal - data.goals.kcal) / data.goals.kcal > 0.1}
                />
                <Summary
                  label="Proteína / día"
                  value={avgProtein != null ? `${avgProtein} g` : '—'}
                  hint={`meta ${data.goals.protein} g`}
                  off={
                    avgProtein != null &&
                    Math.abs(avgProtein - data.goals.protein) / data.goals.protein > 0.1
                  }
                />
                <Summary
                  label="Registrados"
                  value={`${logged7.length}/7`}
                  hint={`${gymCount} de gym`}
                />
              </div>
            </div>
          </div>

          <div className="px-5 mt-5">
            <div className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <button
                  key={row.date}
                  onClick={() => onOpenDay(row.date)}
                  className="w-full text-left px-4 py-3 active:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {row.date === today ? 'Hoy' : formatDay(row.date)}
                      </span>
                      {row.gymDay && <Dumbbell size={13} color="var(--accent)" className="shrink-0" />}
                    </span>
                    <span className="text-sm font-semibold tabular-nums shrink-0 text-[var(--text)]">
                      {row.logged ? `${Math.round(row.kcal).toLocaleString('es-MX')} kcal` : (
                        <span className="text-[var(--text-faint)] font-normal">Sin registro</span>
                      )}
                    </span>
                  </div>

                  {row.logged && (
                    <div
                      className="h-1 rounded-full overflow-hidden mb-1.5"
                      style={{ backgroundColor: 'var(--surface-2)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (row.kcal / data.goals.kcal) * 100)}%`,
                          backgroundColor:
                            row.kcal > data.goals.kcal ? 'var(--warning)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-[11px] tabular-nums text-[var(--text-faint)]">
                    <span>
                      {row.logged
                        ? `${Math.round(row.protein)}P · ${Math.round(row.carbs)}C · ${Math.round(row.fat)}G`
                        : ''}
                    </span>
                    {row.weightKg != null && <span>{row.weightKg} kg</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Summary({
  label,
  value,
  hint,
  off,
}: {
  label: string
  value: string
  hint: string
  off?: boolean
}) {
  return (
    <div>
      <p className="text-[11px] text-[var(--text-faint)] mb-1">{label}</p>
      <p
        className="text-lg font-semibold tabular-nums leading-tight"
        style={{ color: off ? 'var(--warning)' : 'var(--text)' }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[var(--text-faint)] tabular-nums">{hint}</p>
    </div>
  )
}

function formatDay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
