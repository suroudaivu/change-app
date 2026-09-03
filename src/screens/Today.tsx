import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Apple,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Coffee,
  Dumbbell,
  Moon,
  Pencil,
  Share,
  ShieldAlert,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AppData, DayLog, Macros, MealSlot } from '../types'
import {
  buildDayFromTemplate,
  computeDayMacros,
  computeMealMacros,
  daysSinceLastExport,
  findFood,
  needsBackupReminder,
  todayISO,
} from '../storage'
import { DaySummary } from '../components/DaySummary'
import { FoodPicker } from '../components/FoodPicker'
import { buildShareCard, shareCard } from '../shareCard'
import { commonSubstitutes } from '../seedData'

const SLOT_LABEL: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snacks: 'Snacks y suplementos',
}

const SLOT_ICON: Record<MealSlot, LucideIcon> = {
  desayuno: Coffee,
  comida: UtensilsCrossed,
  cena: Moon,
  snacks: Apple,
}

interface TodayProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
  updateUndoable: (fn: (current: AppData) => AppData, message: string) => void
  onGoToBackup: () => void
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function weekdayOf(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function Today({ data, update, updateUndoable, onGoToBackup }: TodayProps) {
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [backupDismissed, setBackupDismissed] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [swapTarget, setSwapTarget] = useState<{
    slot: MealSlot
    itemId: string
    foodId: string
    foodName: string
    macros: Macros
  } | null>(null)

  const persistedLog = data.dayLogs[date]

  // Today starts pre-filled from the diet template (in memory — the mutating
  // handlers below persist it on the first real edit). Memoized so item ids
  // stay stable across renders; regenerating them would break inline editing,
  // which keys off the id of the row being edited.
  const draftLog = useMemo(
    () => buildDayFromTemplate(data, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, data.dietTemplate],
  )

  // A past day that was never logged stays genuinely empty, so browsing
  // history never shows an assumed diet as if it were recorded data.
  const emptyLog: DayLog = useMemo(() => ({ date, meals: [] }), [date])
  const isPast = date !== today
  const log = persistedLog ?? (isPast ? emptyLog : draftLog)
  // Also covers a past day touched only by the gym toggle, which persists a
  // log with no meals — it still needs the offer to fill the day in.
  const isUnlogged = isPast && log.meals.length === 0

  const totals = computeDayMacros(data, log)
  const goals = data.goals

  function fillDayFromTemplate() {
    update((current) => ({
      ...current,
      dayLogs: {
        ...current.dayLogs,
        // Keep anything already recorded for the day (e.g. the gym mark).
        [date]: { ...buildDayFromTemplate(current, date), gymDay: current.dayLogs[date]?.gymDay },
      },
    }))
  }

  /** Applies a change to the day being viewed, persisting it. An unvisited
   * day starts from the diet template only if it's today — a past day stays
   * empty unless it was explicitly filled in. */
  function mutateDay(fn: (log: DayLog) => DayLog, undoMessage?: string) {
    const apply = (current: AppData) => {
      // Falls back to the very log being rendered, not a freshly built one:
      // a rebuild would carry new item ids and edits keyed to what's on
      // screen (delete, swap, quantity) would silently miss.
      const base = current.dayLogs[date] ?? log
      return { ...current, dayLogs: { ...current.dayLogs, [date]: fn(base) } }
    }
    if (undoMessage) updateUndoable(apply, undoMessage)
    else update(apply)
  }

  function mutateMeals(fn: (meals: DayLog['meals']) => DayLog['meals'], undoMessage?: string) {
    mutateDay((log) => ({ ...log, meals: fn(log.meals) }), undoMessage)
  }

  function addItem(slot: MealSlot, foodId: string, quantity: number) {
    mutateMeals((meals) =>
      meals.map((m) =>
        m.slot === slot
          ? { ...m, items: [...m.items, { id: crypto.randomUUID(), foodId, quantity }] }
          : m,
      ),
    )
    setPickerSlot(null)
  }

  function removeItem(slot: MealSlot, itemId: string, foodName: string) {
    mutateMeals(
      (meals) =>
        meals.map((m) => {
          if (m.slot !== slot) return m
          const items = m.items.filter((i) => i.id !== itemId)
          // A meal with nothing left in it can't meaningfully stay "comido".
          return { ...m, items, eaten: items.length === 0 ? false : m.eaten }
        }),
      `${foodName} eliminado`,
    )
  }

  function toggleEaten(slot: MealSlot) {
    mutateMeals((meals) => meals.map((m) => (m.slot === slot ? { ...m, eaten: !m.eaten } : m)))
  }

  function swapItem(slot: MealSlot, itemId: string, foodId: string, quantity: number) {
    mutateMeals((meals) =>
      meals.map((m) =>
        m.slot === slot
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, foodId, quantity } : i)) }
          : m,
      ),
    )
    setSwapTarget(null)
  }

  function toggleGymDay() {
    mutateDay((log) => ({ ...log, gymDay: !log.gymDay }))
  }

  async function handleShare() {
    try {
      const latestWeight = [...data.weightLog].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
      const blob = await buildShareCard({
        date,
        totals,
        goals,
        weightKg: latestWeight?.kg,
        gymDay: log.gymDay,
      })
      await shareCard(blob, date)
    } catch {
      // Sharing can fail where neither the OS share sheet nor a download is
      // available — say so rather than appearing to do nothing.
      setShareError('No se pudo compartir la imagen en este dispositivo.')
      setTimeout(() => setShareError(null), 4000)
    }
  }

  function updateQuantity(slot: MealSlot, itemId: string, quantity: number) {
    mutateMeals((meals) =>
      meals.map((m) =>
        m.slot === slot
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }
          : m,
      ),
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-4 flex items-center justify-between">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[var(--text)]">
          {date === today ? 'Hoy' : capitalize(weekdayOf(date))}
        </h1>
        <div className="flex items-center gap-1 -mr-2">
          <button
            onClick={toggleGymDay}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ backgroundColor: log.gymDay ? 'var(--accent-bg)' : 'transparent' }}
            aria-label="Marcar día de gym"
            title="Fui al gym"
          >
            <Dumbbell size={19} color={log.gymDay ? 'var(--accent)' : 'var(--text-faint)'} />
          </button>
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            aria-label="Compartir resumen del día"
          >
            <Share size={19} color="var(--text-faint)" />
          </button>
        </div>
      </div>

      {/* The chevrons flank the date itself, so stepping through days reads
          as one control instead of loose buttons parked next to a label. */}
      <div className="px-3 flex items-center gap-1">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0"
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} color="var(--text-faint)" />
        </button>
        <span className="text-sm text-[var(--text-dim)] tabular-nums">
          {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
          })}
        </span>
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          disabled={date === today}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0"
          style={{ opacity: date === today ? 0.3 : 1 }}
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} color="var(--text-faint)" />
        </button>
        {date !== today && (
          <button
            onClick={() => setDate(today)}
            className="h-8 px-3 ml-1 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
          >
            Hoy
          </button>
        )}
      </div>

      {/* A nudge, not an alarm — it shouldn't outweigh the day's numbers. */}
      {!backupDismissed && needsBackupReminder(data) && (
        <div className="mx-5 mt-3 flex items-center gap-2 text-xs">
          <ShieldAlert size={14} color="var(--text-faint)" className="shrink-0" />
          <span className="text-[var(--text-faint)] flex-1 min-w-0 truncate">
            {daysSinceLastExport() === null
              ? 'Sin respaldo todavía'
              : `Último respaldo hace ${daysSinceLastExport()} días`}
          </span>
          <button
            onClick={onGoToBackup}
            className="font-semibold h-8 px-2.5 rounded-full shrink-0 active:scale-95 transition-transform"
            style={{ color: 'var(--accent)' }}
          >
            Exportar
          </button>
          <button
            onClick={() => setBackupDismissed(true)}
            className="w-8 h-8 -mr-1 flex items-center justify-center text-[var(--text-faint)] shrink-0"
            aria-label="Descartar"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="px-5 mt-4">
        <DaySummary totals={totals} goals={goals} />
        {shareError && (
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--danger)' }}>
            {shareError}
          </p>
        )}
      </div>

      {isUnlogged && (
        <div className="px-4 mt-6 text-center">
          <p className="text-sm text-[var(--text)]">No registraste este día.</p>
          <p className="text-xs text-[var(--text-faint)] mt-1 mb-4">
            Se queda vacío para que tu historial refleje solo lo que sí registraste.
          </p>
          <button
            onClick={fillDayFromTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
          >
            <CalendarPlus size={16} />
            Llenar con mi dieta base
          </button>
        </div>
      )}

      {log.meals.map((meal) => {
        const mealMacros = computeMealMacros(data, meal)
        const isEmpty = meal.items.length === 0
        const isPending = meal.slot !== 'snacks' && !meal.eaten
        const SlotIcon = SLOT_ICON[meal.slot]
        return (
          <div key={meal.id} className="px-5 mt-6">
            <div className="flex justify-between items-center mb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <SlotIcon size={16} color="var(--text-dim)" className="shrink-0" />
                <h2 className="text-[15px] font-semibold text-[var(--text)] truncate">
                  {SLOT_LABEL[meal.slot]}
                </h2>
                <span className="text-xs text-[var(--text-faint)] tabular-nums shrink-0">
                  {Math.round(mealMacros.kcal)} kcal
                </span>
              </div>

              {/* One compact control instead of a full-width button repeated
                  down the page — the state and the action are the same tap. */}
              {meal.slot !== 'snacks' && !isEmpty && (
                <button
                  onClick={() => toggleEaten(meal.slot)}
                  className="flex items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95"
                  style={
                    isPending
                      ? { color: 'var(--text-dim)', backgroundColor: 'var(--surface)' }
                      : { color: 'var(--success)', backgroundColor: 'rgba(48,209,88,0.14)' }
                  }
                  aria-pressed={!isPending}
                >
                  {isPending ? <Circle size={15} /> : <CheckCircle2 size={15} />}
                  {isPending ? 'Pendiente' : 'Comido'}
                </button>
              )}
            </div>

            <div
              className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)] transition-opacity"
              style={{ opacity: isPending ? 0.75 : 1 }}
            >
              {meal.items.length === 0 && (
                <p className="px-4 py-3 text-sm text-[var(--text-faint)]">Sin alimentos</p>
              )}
              {meal.items.map((item) => {
                const food = findFood(data, item.foodId)
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
                          className="flex items-center gap-1 text-xs text-[var(--text-faint)] py-2 -my-1"
                        >
                          {item.quantity} {food.unit === 'unidad' ? 'u' : food.unit} · {kcal} kcal
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSwapTarget({
                          slot: meal.slot,
                          itemId: item.id,
                          foodId: food.id,
                          foodName: food.name,
                          macros: itemMacros,
                        })
                      }
                      className="w-11 h-11 flex items-center justify-center text-[var(--text-faint)] shrink-0"
                      aria-label="Sustituir"
                      title="Sustituir"
                    >
                      <ArrowLeftRight size={16} />
                    </button>
                    <button
                      onClick={() => removeItem(meal.slot, item.id, food.name)}
                      className="w-11 h-11 flex items-center justify-center text-[var(--text-faint)] shrink-0"
                      aria-label="Quitar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              })}
            </div>

            {meal.slot === 'snacks' && data.savedSnacks.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 -mx-1 px-1">
                {data.savedSnacks.map((snack) => {
                  const food = findFood(data, snack.foodId)
                  if (!food) return null
                  return (
                    <button
                      key={snack.id}
                      onClick={() => addItem('snacks', snack.foodId, snack.quantity)}
                      className="shrink-0 px-3.5 h-10 rounded-full text-xs font-medium whitespace-nowrap"
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
              className="w-full mt-2 h-11 rounded-xl text-sm font-medium"
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
            >
              + Agregar {meal.slot === 'snacks' ? 'snack o suplemento' : 'alimento'}
            </button>
          </div>
        )
      })}

      {pickerSlot && (
        <FoodPicker
          foods={data.foods}
          onPick={(foodId, qty) => addItem(pickerSlot, foodId, qty)}
          onClose={() => setPickerSlot(null)}
        />
      )}

      {swapTarget && (
        <FoodPicker
          foods={data.foods}
          title={`Sustituir "${swapTarget.foodName}"`}
          compareTo={swapTarget.macros}
          suggestions={commonSubstitutes[swapTarget.foodId]}
          onPick={(foodId, qty) => swapItem(swapTarget.slot, swapTarget.itemId, foodId, qty)}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  )
}
