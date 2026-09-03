import { useState } from 'react'
import type { AppData, MealSlot } from '../types'
import { findFood } from '../storage'
import { FoodPicker } from '../components/FoodPicker'

const SLOT_LABEL: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snacks: 'Snacks frecuentes',
}

interface AjustesProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
}

export function Ajustes({ data, update }: AjustesProps) {
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  function addTemplateItem(slot: MealSlot, foodId: string, quantity: number) {
    update((current) => ({
      ...current,
      dietTemplate: {
        meals: current.dietTemplate.meals.map((m) =>
          m.slot === slot
            ? { ...m, items: [...m.items, { id: crypto.randomUUID(), foodId, quantity }] }
            : m,
        ),
      },
    }))
    setPickerSlot(null)
  }

  function removeTemplateItem(slot: MealSlot, itemId: string) {
    update((current) => ({
      ...current,
      dietTemplate: {
        meals: current.dietTemplate.meals.map((m) =>
          m.slot === slot ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m,
        ),
      },
    }))
  }

  function updateTemplateQuantity(slot: MealSlot, itemId: string, quantity: number) {
    update((current) => ({
      ...current,
      dietTemplate: {
        meals: current.dietTemplate.meals.map((m) =>
          m.slot === slot
            ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }
            : m,
        ),
      },
    }))
  }

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="px-4 pt-4 mb-2">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Ajustes</h1>
      </div>

      <div className="px-4 mb-4">
        <h2 className="text-base font-semibold text-[var(--text)] mb-1">Mi dieta</h2>
        <p className="text-xs text-[var(--text-faint)] mb-3">
          Esto es tu dieta base. Cambios aquí afectan todos los días futuros — para ajustar solo hoy, hazlo desde la
          pantalla Hoy.
        </p>

        {data.dietTemplate.meals
          .filter((m) => m.slot !== 'snacks')
          .map((meal) => (
            <div key={meal.id} className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-dim)] mb-2">{SLOT_LABEL[meal.slot]}</h3>
              <div className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]">
                {meal.items.length === 0 && (
                  <p className="px-4 py-3 text-sm text-[var(--text-faint)]">Sin alimentos</p>
                )}
                {meal.items.map((item) => {
                  const food = findFood(data, item.foodId)
                  if (!food) return null
                  const kcal = Math.round((food.per100.kcal * item.quantity) / 100)
                  const isEditing = editingItem === item.id
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
                              if (v > 0) updateTemplateQuantity(meal.slot, item.id, v)
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
                        onClick={() => removeTemplateItem(meal.slot, item.id)}
                        className="text-[var(--text-faint)] text-lg px-2"
                        aria-label="Quitar"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => setPickerSlot(meal.slot)}
                className="w-full mt-2 py-2 rounded-xl text-sm font-medium"
                style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
              >
                + Agregar alimento
              </button>
            </div>
          ))}
      </div>

      {pickerSlot && (
        <FoodPicker
          foods={data.foods}
          onPick={(foodId, qty) => addTemplateItem(pickerSlot, foodId, qty)}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  )
}
