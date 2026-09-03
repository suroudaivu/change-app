import { useMemo, useState } from 'react'
import type { Food } from '../types'

interface FoodPickerProps {
  foods: Food[]
  onPick: (foodId: string, quantity: number) => void
  onClose: () => void
}

export function FoodPicker({ foods, onPick, onClose }: FoodPickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('100')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q),
    )
  }, [foods, query])

  function confirm() {
    if (!selected) return
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return
    onPick(selected.id, qty)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--surface)] rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-3" />
          {!selected ? (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full bg-[var(--surface-2)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
            />
          ) : (
            <div>
              <p className="text-sm text-[var(--text-dim)]">{selected.brand}</p>
              <h3 className="text-lg font-semibold text-[var(--text)]">{selected.name}</h3>
            </div>
          )}
        </div>

        {!selected ? (
          <div className="overflow-y-auto flex-1 px-2 py-2">
            {results.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelected(f)
                  setQuantity(f.unit === 'unidad' ? '1' : (f.unitWeight ? String(f.unitWeight) : '100'))
                }}
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
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-[var(--surface-2)] rounded-xl px-4 py-3 text-lg text-[var(--text)] outline-none"
              />
            </label>
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
                Agregar
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
