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
import type { AppData } from '../types'
import { todayISO } from '../storage'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface PesoProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
}

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

export function Peso({ data, update }: PesoProps) {
  const [kgInput, setKgInput] = useState('')
  const today = todayISO()

  const sorted = useMemo(
    () => [...data.weightLog].sort((a, b) => a.date.localeCompare(b.date)),
    [data.weightLog],
  )

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

  function deleteEntry(date: string) {
    update((current) => ({ ...current, weightLog: current.weightLog.filter((e) => e.date !== date) }))
  }

  const chartData = {
    labels: sorted.map((e) =>
      new Date(e.date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    ),
    datasets: [
      {
        data: sorted.map((e) => e.kg),
        borderColor: '#0a84ff',
        backgroundColor: 'rgba(10,132,255,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: sorted.length > 30 ? 0 : 3,
        pointBackgroundColor: '#0a84ff',
      },
    ],
  }

  const todayEntry = data.weightLog.find((e) => e.date === today)

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Peso</h1>
      </div>

      <div className="px-4 mt-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 flex gap-2 items-end">
          <label className="flex-1">
            <span className="text-xs text-[var(--text-faint)]">
              {todayEntry ? 'Actualizar peso de hoy' : 'Registrar peso de hoy'} (kg)
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={kgInput}
              onChange={(e) => setKgInput(e.target.value)}
              placeholder={todayEntry ? String(todayEntry.kg) : '0.0'}
              className="w-full bg-[var(--surface-2)] rounded-xl px-3 py-2.5 mt-1 text-[var(--text)] outline-none"
            />
          </label>
          <button
            onClick={saveWeight}
            className="py-2.5 px-4 rounded-xl font-medium text-white shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Guardar
          </button>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl bg-[var(--surface)] p-4" style={{ height: 200 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: sorted.length <= 14, ticks: { color: '#66666f', font: { size: 10 } }, grid: { display: false } },
                  y: { ticks: { color: '#66666f', font: { size: 10 } }, grid: { color: '#2a2a33' } },
                },
              }}
            />
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="px-4 mt-4 grid grid-cols-2 gap-2">
          <StatCard label="Peso actual" value={current ? `${current.kg} kg` : '—'} />
          <StatCard label="Peso inicial" value={initial ? `${initial.kg} kg` : '—'} />
          <StatCard
            label="Diferencia total"
            value={initial && current ? `${(current.kg - initial.kg).toFixed(1)} kg` : '—'}
            color={initial && current && current.kg < initial.kg ? 'var(--success)' : undefined}
          />
          <StatCard
            label="Últimos 7 días"
            value={sevenDaysAgo && current ? `${(current.kg - sevenDaysAgo.kg).toFixed(1)} kg` : '—'}
            color={sevenDaysAgo && current && current.kg < sevenDaysAgo.kg ? 'var(--success)' : undefined}
          />
        </div>
      )}

      {sorted.length > 0 && (
        <div className="px-4 mt-2">
          <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs text-[var(--text-faint)] mb-0.5">Tendencia</p>
            <p className="text-sm font-medium" style={{ color: trendColor }}>
              {trendLabel}
            </p>
            <p className="text-[11px] text-[var(--text-faint)] mt-1">
              Comparamos el promedio de esta semana contra la anterior — un solo día no cambia la tendencia.
            </p>
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <p className="px-4 mt-8 text-center text-sm text-[var(--text-faint)]">
          Registra tu primer peso para empezar a ver tu evolución.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-[var(--text-dim)] mb-2">Historial</h2>
          <div className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]">
            {[...sorted].reverse().slice(0, 30).map((e) => (
              <div key={e.date} className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-sm text-[var(--text)]">
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('es-MX', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-dim)]">{e.kg} kg</span>
                  <button
                    onClick={() => deleteEntry(e.date)}
                    className="text-[var(--text-faint)] text-lg px-1"
                    aria-label="Eliminar"
                  >
                    ×
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

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
      <p className="text-xs text-[var(--text-faint)] mb-0.5">{label}</p>
      <p className="text-lg font-semibold" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}
