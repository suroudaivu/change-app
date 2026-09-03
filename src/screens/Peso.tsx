import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { X } from 'lucide-react'
import type { AppData } from '../types'
import { todayISO } from '../storage'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface PesoProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
  updateUndoable: (fn: (current: AppData) => AppData, message: string) => void
}

const RANGES = [
  { id: '30', label: '30 días', days: 30 },
  { id: '90', label: '90 días', days: 90 },
  { id: 'all', label: 'Todo', days: null },
] as const

type RangeId = (typeof RANGES)[number]['id']

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

/** Closest entry to `targetDate`, searching backward first (most recent
 * entry on or before that date), so a missed weigh-in doesn't break stats. */
function closestEntryOnOrBefore(sorted: AppData['weightLog'], targetDate: string) {
  let best: AppData['weightLog'][number] | undefined
  for (const e of sorted) {
    if (e.date <= targetDate) best = e
    else break
  }
  return best
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function Peso({ data, update, updateUndoable }: PesoProps) {
  const [kgInput, setKgInput] = useState('')
  const [range, setRange] = useState<RangeId>('30')
  const today = todayISO()

  const sorted = useMemo(
    () => [...data.weightLog].sort((a, b) => a.date.localeCompare(b.date)),
    [data.weightLog],
  )

  // Stats always use the full history; only the chart honours the range.
  const charted = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days
    if (!days) return sorted
    const from = daysAgoISO(days)
    return sorted.filter((e) => e.date >= from)
  }, [sorted, range])

  const current = sorted.at(-1)
  const initial = sorted[0]
  const sevenDaysAgo = closestEntryOnOrBefore(sorted, daysAgoISO(7))

  const last7 = sorted.filter((e) => e.date >= daysAgoISO(6))
  const prev7 = sorted.filter((e) => e.date >= daysAgoISO(13) && e.date < daysAgoISO(6))
  const avgLast7 = average(last7.map((e) => e.kg))
  const avgPrev7 = average(prev7.map((e) => e.kg))

  let trendLabel = 'Aún no hay suficientes datos'
  let trendColor = 'var(--text-faint)'
  if (avgLast7 != null && avgPrev7 != null) {
    const diff = avgLast7 - avgPrev7
    if (Math.abs(diff) < 0.15) {
      trendLabel = 'Estable esta semana'
      trendColor = 'var(--text-dim)'
    } else if (diff < 0) {
      trendLabel = `Bajando (${diff.toFixed(1)} kg vs. semana anterior)`
      trendColor = 'var(--success)'
    } else {
      trendLabel = `Subiendo (+${diff.toFixed(1)} kg vs. semana anterior)`
      trendColor = 'var(--warning)'
    }
  }

  function saveWeight() {
    const kg = parseFloat(kgInput)
    if (!kg || kg <= 0) return
    update((current) => {
      const existingIdx = current.weightLog.findIndex((e) => e.date === today)
      const next = [...current.weightLog]
      if (existingIdx >= 0) next[existingIdx] = { date: today, kg }
      else next.push({ date: today, kg })
      return { ...current, weightLog: next }
    })
    setKgInput('')
  }

  function deleteEntry(date: string, kg: number) {
    updateUndoable(
      (current) => ({ ...current, weightLog: current.weightLog.filter((e) => e.date !== date) }),
      `Registro de ${kg} kg eliminado`,
    )
  }

  const chartData = {
    labels: charted.map((e) =>
      new Date(e.date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    ),
    datasets: [
      {
        data: charted.map((e) => e.kg),
        borderColor: '#0a84ff',
        backgroundColor: 'rgba(10,132,255,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: charted.length > 40 ? 0 : 3,
        pointBackgroundColor: '#0a84ff',
      },
    ],
  }

  const todayEntry = data.weightLog.find((e) => e.date === today)

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="px-5 pt-4">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[var(--text)]">Peso</h1>
      </div>

      {/* Mirrors Hoy: the number you came to see leads, the action follows. */}
      <div className="px-5 mt-4">
        <div className="rounded-3xl bg-[var(--surface)] px-5 pt-5 pb-4">
          <p className="text-xs font-medium text-[var(--text-faint)] mb-0.5">
            {current ? 'Peso actual' : 'Sin registros'}
          </p>
          <div className="flex items-end justify-between mb-4">
            <p className="text-[44px] leading-none font-bold tracking-tight tabular-nums text-[var(--text)]">
              {current ? current.kg : '—'}
              {current && <span className="text-xl font-semibold text-[var(--text-faint)] ml-1">kg</span>}
            </p>
            {initial && current && current.kg !== initial.kg && (
              <p
                className="text-sm font-semibold tabular-nums pb-1"
                style={{ color: current.kg < initial.kg ? 'var(--success)' : 'var(--warning)' }}
              >
                {current.kg < initial.kg ? '↓' : '↑'} {Math.abs(current.kg - initial.kg).toFixed(1)} kg
              </p>
            )}
          </div>

          <div className="flex gap-2 items-center pt-4 border-t border-[var(--border)]">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={kgInput}
              onChange={(e) => setKgInput(e.target.value)}
              placeholder={todayEntry ? `Hoy: ${todayEntry.kg} kg` : 'Registrar peso de hoy'}
              className="flex-1 min-w-0 bg-[var(--surface-2)] rounded-xl px-3.5 h-11 text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
            />
            <button
              onClick={saveWeight}
              className="h-11 px-4 rounded-xl font-semibold text-white shrink-0 active:scale-95 transition-transform"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {todayEntry ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="px-5 mt-4">
          <div className="flex gap-2 mb-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className="px-3.5 h-9 rounded-full text-xs font-semibold active:scale-95 transition-all"
                style={
                  range === r.id
                    ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }
                    : { backgroundColor: 'var(--surface)', color: 'var(--text-faint)' }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="rounded-3xl bg-[var(--surface)] p-4" style={{ height: 200 }}>
            {charted.length === 0 ? (
              <p className="h-full flex items-center justify-center text-sm text-[var(--text-faint)]">
                Sin registros en este rango
              </p>
            ) : (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      // Always keep dates readable: thin the ticks out instead
                      // of hiding the axis once there's a lot of history.
                      ticks: {
                        color: '#8a8a94',
                        font: { size: 10 },
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        autoSkip: true,
                      },
                      grid: { display: false },
                    },
                    y: { ticks: { color: '#8a8a94', font: { size: 10 } }, grid: { color: '#2a2a33' } },
                  },
                }}
              />
            )}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="px-5 mt-4">
          <div className="rounded-3xl bg-[var(--surface)] px-5 py-4">
            <p className="text-sm font-semibold mb-1" style={{ color: trendColor }}>
              {trendLabel}
            </p>
            <p className="text-xs text-[var(--text-faint)] leading-relaxed">
              Comparamos el promedio de esta semana contra la anterior — un solo día no cambia la
              tendencia.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <Stat label="Peso inicial" value={initial ? `${initial.kg} kg` : '—'} />
              <Stat
                label="Últimos 7 días"
                value={sevenDaysAgo && current ? `${(current.kg - sevenDaysAgo.kg).toFixed(1)} kg` : '—'}
                color={
                  sevenDaysAgo && current && current.kg < sevenDaysAgo.kg ? 'var(--success)' : undefined
                }
              />
            </div>
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <p className="px-8 mt-8 text-center text-sm text-[var(--text-faint)] leading-relaxed">
          Registra tu primer peso para empezar a ver tu evolución.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="px-5 mt-6">
          <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2.5">Historial</h2>
          <div className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[...sorted].reverse().slice(0, 30).map((e) => (
              <div key={e.date} className="pl-4 pr-1 py-1 flex justify-between items-center">
                <span className="text-sm text-[var(--text-dim)]">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('es-MX', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-[var(--text)] tabular-nums">
                    {e.kg} kg
                  </span>
                  <button
                    onClick={() => deleteEntry(e.date, e.kg)}
                    className="w-11 h-11 flex items-center justify-center text-[var(--text-faint)] active:scale-90 transition-transform"
                    aria-label="Eliminar"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-faint)] mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}
