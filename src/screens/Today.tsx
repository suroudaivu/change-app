import { useState } from 'react'
import type { AppData, Macros, MealSlot } from '../types'
import { computeDayMacros, computeMealMacros, findFood, getOrCreateDayLog, todayISO } from '../storage'
import { ProgressBar } from '../components/ProgressBar'
import { FoodPicker } from '../components/FoodPicker'

const SLOT_LABEL: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snacks: 'Snacks',
}

interface TodayProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function Today({ data, update }: TodayProps) {
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [swapTarget, setSwapTarget] = useState<{
    slot: MealSlot
    itemId: string
    foodName: string
    macros: Macros
  } | null>(null)

  // Derived in-memory from the diet template until the user actually edits
  // today (the mutating handlers below persist it at that point).
  const { data: ensuredData, log } = getOrCreateDayLog(data, date)

  const totals = computeDayMacros(ensuredData, log)
  const goals = ensuredData.goals

  function addItem(slot: MealSlot, foodId: string, quantity: number) {
    update((current) => {
      const { data: withLog, log: currentLog } = getOrCreateDayLog(current, date)
      const meals = currentLog.meals.map((m) =>
        m.slot === slot
          ? { ...m, items: [...m.items, { id: crypto.randomUUID(), foodId, quantity }] }
          : m,
      )
      return { ...withLog, dayLogs: { ...withLog.dayLogs, [date]: { ...currentLog, meals } } }
    })
    setPickerSlot(null)
  }

  function removeItem(slot: MealSlot, itemId: string) {
    update((current) => {
      const { data: withLog, log: currentLog } = getOrCreateDayLog(current, date)
      const meals = currentLog.meals.map((m) =>
        m.slot === slot ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m,
      )
      return { ...withLog, dayLogs: { ...withLog.dayLogs, [date]: { ...currentLog, meals } } }
    })
  }

  function toggleEaten(slot: MealSlot) {
    update((current) => {
      const { data: withLog, log: currentLog } = getOrCreateDayLog(current, date)
      const meals = currentLog.meals.map((m) => (m.slot === slot ? { ...m, eaten: !m.eaten } : m))
      return { ...withLog, dayLogs: { ...withLog.dayLogs, [date]: { ...currentLog, meals } } }
    })
  }

  function swapItem(slot: MealSlot, itemId: string, foodId: string, quantity: number) {
    update((current) => {
      const { data: withLog, log: currentLog } = getOrCreateDayLog(current, date)
      const meals = currentLog.meals.map((m) =>
        m.slot === slot
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, foodId, quantity } : i)) }
          : m,
      )
      return { ...withLog, dayLogs: { ...withLog.dayLogs, [date]: { ...currentLog, meals } } }
    })
    setSwapTarget(null)
  }

  function updateQuantity(slot: MealSlot, itemId: string, quantity: number) {
    update((current) => {
      const { data: withLog, log: currentLog } = getOrCreateDayLog(current, date)
      const meals = currentLog.meals.map((m) =>
        m.slot === slot
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }
          : m,
      )
      return { ...withLog, dayLogs: { ...withLog.dayLogs, [date]: { ...currentLog, meals } } }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="px-4 pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{date === today ? 'Hoy' : 'Día'}</h1>
          <p className="text-sm text-[var(--text-faint)] mb-2">
            {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate((d) => shiftDate(d, -1))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-dim)]"
            style={{ backgroundColor: 'var(--surface)' }}
            aria-label="Día anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setDate((d) => shiftDate(d, 1))}
            disabled={date === today}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--surface)',
              color: date === today ? 'var(--text-faint)' : 'var(--text-dim)',
              opacity: date === today ? 0.4 : 1,
            }}
            aria-label="Día siguiente"
          >
            ›
          </button>
        </div>
      </div>
      {date !== today && (
        <button
          onClick={() => setDate(today)}
          className="mx-4 mt-1 mb-1 text-xs font-medium"
          style={{ color: 'var(--accent)' }}
        >
          ← Volver a hoy
        </button>
      )}

      <div className="px-4 py-3 mb-2 bg-[var(--surface)] mx-4 rounded-2xl">
        <ProgressBar label="Calorías" consumed={totals.kcal} goal={goals.kcal} unit="kcal" color="var(--accent)" />
        <ProgressBar label="Proteína" consumed={totals.protein} goal={goals.protein} unit="g" color="var(--success)" />
        <ProgressBar label="Carbohidratos" consumed={totals.carbs} goal={goals.carbs} unit="g" color="var(--warning)" />
        <ProgressBar label="Grasas" consumed={totals.fat} goal={goals.fat} unit="g" color="#bf5af2" />
      </div>

      {log.meals.map((meal) => {
        const mealMacros = computeMealMacros(ensuredData, meal)
        const isPending = meal.slot !== 'snacks' && !meal.eaten
        return (
          <div key={meal.id} className="px-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text)]">{SLOT_LABEL[meal.slot]}</h2>
                {meal.slot !== 'snacks' && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={
                      isPending
                        ? { color: 'var(--text-faint)', backgroundColor: 'var(--surface-2)' }
                        : { color: 'var(--success)', backgroundColor: 'rgba(48,209,88,0.14)' }
                    }
                  >
                    {isPending ? 'Pendiente' : '✓ Comido'}
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--text-faint)]">{Math.round(mealMacros.kcal)} kcal</span>
            </div>

            {meal.slot !== 'snacks' && (
              <button
                onClick={() => toggleEaten(meal.slot)}
                className="w-full mb-2 py-2 rounded-xl text-sm font-medium border"
                style={
                  isPending
                    ? { color: 'var(--accent)', borderColor: 'var(--accent)', backgroundColor: 'transparent' }
                    : { color: 'var(--text-dim)', borderColor: 'var(--border)', backgroundColor: 'transparent' }
                }
              >
                {isPending ? 'Marcar como comido' : 'Desmarcar'}
              </button>
            )}

            <div
              className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]"
              style={{ opacity: isPending ? 0.55 : 1 }}
            >
              {meal.items.length === 0 && (
                <p className="px-4 py-3 text-sm text-[var(--text-faint)]">Sin alimentos</p>
              )}
              {meal.items.map((item) => {
                const food = findFood(ensuredData, item.foodId)
                if (!food) return null
                const factor = item.quantity / 100
                const kcal = Math.round(food.per100.kcal * factor)
                const isEditing = editingItem === item.id
                const itemMacros = {
                  kcal: food.per100.kcal * factor,
                  protein: food.per100.protein * factor,
                  carbs: food.per100.carbs * factor,
                  fat: food.per100.fat * factor,
                }
                return (
                  <div key={item.id} className="px-4 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] text-sm truncate">{food.name}</p>
                      {isEditing ? (
                        <input
                          autoFocus
                          type="number"
                          inputMode="decimal"
                          defaultValue={item.quantity}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value)
                            if (v > 0) updateQuantity(meal.slot, item.id, v)
                            setEditingItem(null)
                          }}
                          className="bg-[var(--surface-2)] rounded-lg px-2 py-1 mt-1 w-24 text-sm text-[var(--text)] outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="text-xs text-[var(--text-faint)]"
                        >
                          {item.quantity} {food.unit === 'unidad' ? 'u' : food.unit} · {kcal} kcal
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSwapTarget({ slot: meal.slot, itemId: item.id, foodName: food.name, macros: itemMacros })
                      }
                      className="text-[var(--text-faint)] text-sm px-1.5"
                      aria-label="Sustituir"
                      title="Sustituir"
                    >
                      ⇄
                    </button>
                    <button
                      onClick={() => removeItem(meal.slot, item.id)}
                      className="text-[var(--text-faint)] text-lg px-2"
                      aria-label="Quitar"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            {meal.slot === 'snacks' && ensuredData.savedSnacks.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 -mx-1 px-1">
                {ensuredData.savedSnacks.map((snack) => {
                  const food = findFood(ensuredData, snack.foodId)
                  if (!food) return null
                  return (
                    <button
                      key={snack.id}
                      onClick={() => addItem('snacks', snack.foodId, snack.quantity)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)' }}
                    >
                      + {food.name}
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setPickerSlot(meal.slot)}
              className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
            >
              + Agregar {meal.slot === 'snacks' ? 'snack' : 'alimento'}
            </button>
          </div>
        )
      })}

      {pickerSlot && (
        <FoodPicker
          foods={ensuredData.foods}
          onPick={(foodId, qty) => addItem(pickerSlot, foodId, qty)}
          onClose={() => setPickerSlot(null)}
        />
      )}

      {swapTarget && (
        <FoodPicker
          foods={ensuredData.foods}
          title={`Sustituir "${swapTarget.foodName}"`}
          compareTo={swapTarget.macros}
          onPick={(foodId, qty) => swapItem(swapTarget.slot, swapTarget.itemId, foodId, qty)}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  )
}
