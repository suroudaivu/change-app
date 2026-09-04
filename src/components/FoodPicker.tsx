import { useMemo, useState } from 'react'
import type { Food, Macros } from '../types'
import { useKeyboardInset } from '../useKeyboardInset'

interface FoodPickerProps {
  foods: Food[]
  onPick: (foodId: string, quantity: number) => void
  onClose: () => void
  /** When set, the picker shows a before/after macro comparison and the
   * confirm button reads "Sustituir" instead of "Agregar". */
  compareTo?: Macros
  title?: string
  /** Quick "common substitute" chips shown above the search, each with a
   * sensible default quantity for that specific swap. */
  suggestions?: { foodId: string; quantity: number }[]
}

function scale(f: Food, quantity: number): Macros {
  const factor = quantity / 100
  return {
    kcal: f.per100.kcal * factor,
    protein: f.per100.protein * factor,
    carbs: f.per100.carbs * factor,
    fat: f.per100.fat * factor,
  }
}

function Delta({ label, before, after, unit }: { label: string; before: number; after: number; unit: string }) {
  const diff = Math.round(after - before)
  const color = diff === 0 ? 'var(--text-faint)' : diff > 0 ? 'var(--warning)' : 'var(--success)'
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="text-[var(--text-faint)]">
        {Math.round(before)} → {Math.round(after)} {unit}
      </span>
      <span className="font-medium w-16 text-right" style={{ color }}>
        {diff > 0 ? '+' : ''}
        {diff} {unit}
      </span>
    </div>
  )
}

export function FoodPicker({ foods, onPick, onClose, compareTo, title, suggestions }: FoodPickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('100')
  const keyboardInset = useKeyboardInset()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q),
    )
  }, [foods, query])

  const suggestedFoods = useMemo(
    () =>
      (suggestions ?? [])
        .map((s) => ({ food: foods.find((f) => f.id === s.foodId), quantity: s.quantity }))
        .filter((s): s is { food: Food; quantity: number } => !!s.food),
    [suggestions, foods],
  )

  const qtyNum = parseFloat(quantity) || 0
  const newMacros = selected ? scale(selected, qtyNum) : null

  function pick(food: Food, presetQuantity?: number) {
    setSelected(food)
    setQuantity(
      presetQuantity != null
        ? String(presetQuantity)
        : food.unit === 'unidad'
          ? '1'
          : food.unitWeight
            ? String(food.unitWeight)
            : '100',
    )
  }

  function confirm() {
    if (!selected) return
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return
    onPick(selected.id, qty)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
      onClick={onClose}
      style={{ paddingBottom: keyboardInset }}
    >
      {/* Fixed height, not max-height: letting the sheet shrink to fit the
          results made it slide down behind the keyboard as soon as a search
          narrowed things to a couple of matches. */}
      <div
        className="bg-[var(--surface)] rounded-t-2xl flex flex-col"
        style={{ height: '78vh', maxHeight: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-3" />
          {!selected ? (
            <>
              {title && <p className="text-sm text-[var(--text-dim)] mb-2">{title}</p>}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full bg-[var(--surface-2)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
              />
            </>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-dim)]">{selected.brand}</p>
              <h3 className="text-lg font-semibold text-[var(--text)]">{selected.name}</h3>
            </div>
          )}
        </div>

        {!selected ? (
          <div className="overflow-y-auto flex-1 px-2 py-2">
            {suggestedFoods.length > 0 && !query && (
              <div className="px-1 pb-2 mb-2 border-b border-[var(--border)]">
                <p className="text-xs text-[var(--text-faint)] px-2 mb-1.5">Sustitutos comunes</p>
                <div className="flex gap-2 overflow-x-auto px-1 pb-1">
                  {suggestedFoods.map(({ food, quantity: q }) => (
                    <button
                      key={food.id}
                      onClick={() => pick(food, q)}
                      className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
                      style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      {food.name} · {q} {food.unit === 'unidad' ? 'u' : food.unit}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {results.map((f) => (
              <button
                key={f.id}
                onClick={() => pick(f)}
                className="w-full text-left px-3 py-3 rounded-xl active:bg-[var(--surface-2)] flex justify-between items-center"
              >
                <span>
                  <span className="text-[var(--text)]">{f.name}</span>
                  {f.brand && <span className="text-[var(--text-faint)] text-sm"> · {f.brand}</span>}
                </span>
                <span className="text-[var(--text-faint)] text-xs">
                  {Math.round((f.per100.kcal * (f.unit === 'unidad' ? 1 : 100)) / 100)} kcal/
                  {f.unit === 'unidad' ? 'u' : f.unit === 'ml' ? '100ml' : '100g'}
                </span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="text-center text-[var(--text-faint)] py-8 text-sm">Sin resultados</p>
            )}
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-[var(--text-dim)]">
                Cantidad ({selected.unit === 'unidad' ? 'unidades' : selected.unit})
              </span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-[var(--surface-2)] rounded-xl px-4 py-3 text-lg text-[var(--text)] outline-none"
              />
            </label>

            {compareTo && newMacros && (
              <div className="rounded-xl bg-[var(--surface-2)] px-3 py-1">
                <Delta label="Calorías" before={compareTo.kcal} after={newMacros.kcal} unit="kcal" />
                <Delta label="Proteína" before={compareTo.protein} after={newMacros.protein} unit="g" />
                <Delta label="Carbohidratos" before={compareTo.carbs} after={newMacros.carbs} unit="g" />
                <Delta label="Grasas" before={compareTo.fat} after={newMacros.fat} unit="g" />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-medium"
              >
                Atrás
              </button>
              <button
                onClick={confirm}
                className="flex-1 py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {compareTo ? 'Sustituir' : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="p-4 text-center text-[var(--text-dim)] border-t border-[var(--border)]"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
