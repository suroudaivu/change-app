import { useState } from 'react'
import type { Food } from '../types'
import { useKeyboardInset } from '../useKeyboardInset'

interface FoodFormProps {
  onSave: (food: Food) => void
  onClose: () => void
  /** Editing an existing food, rather than creating one. */
  editing?: Food
  /** Prefills the name when created straight from a search that found nothing. */
  initialName?: string
  /** Supplements default to contributing nothing and are dosed per unit. */
  supplement?: boolean
}

const UNITS = [
  { id: 'g', label: 'Gramos', basis: 'por 100 g' },
  { id: 'ml', label: 'Mililitros', basis: 'por 100 ml' },
  { id: 'unidad', label: 'Por pieza', basis: 'por pieza' },
] as const

/**
 * Creates or edits any food. Nutrition is entered the way labels print it —
 * per 100 g/ml, or per piece — and converted to the per-100-units basis the
 * rest of the app calculates with.
 */
export function FoodForm({ onSave, onClose, editing, initialName, supplement }: FoodFormProps) {
  const isSupplement = supplement ?? editing?.isSupplement ?? false
  // Per-piece foods store macros per 100 pieces, so displaying one means
  // dividing back down.
  const toInput = (v: number, unit: Food['unit']) => {
    const shown = unit === 'unidad' ? v / 100 : v
    return shown ? String(Number(shown.toFixed(2))) : ''
  }

  const [name, setName] = useState(editing?.name ?? initialName ?? '')
  const [brand, setBrand] = useState(editing?.brand ?? '')
  const [unit, setUnit] = useState<Food['unit']>(editing?.unit ?? (isSupplement ? 'unidad' : 'g'))
  const [unitWeight, setUnitWeight] = useState(editing?.unitWeight ? String(editing.unitWeight) : '')
  const [noMacros, setNoMacros] = useState(editing ? !!editing.isSupplement : isSupplement)
  const [kcal, setKcal] = useState(toInput(editing?.per100.kcal ?? 0, editing?.unit ?? 'g'))
  const [protein, setProtein] = useState(toInput(editing?.per100.protein ?? 0, editing?.unit ?? 'g'))
  const [carbs, setCarbs] = useState(toInput(editing?.per100.carbs ?? 0, editing?.unit ?? 'g'))
  const [fat, setFat] = useState(toInput(editing?.per100.fat ?? 0, editing?.unit ?? 'g'))
  const keyboardInset = useKeyboardInset()

  const basis = UNITS.find((u) => u.id === unit)?.basis ?? ''
  const canSave = name.trim().length > 0

  function save() {
    if (!canSave) return
    const num = (v: string) => parseFloat(v) || 0
    // Per-piece entries are scaled up to the per-100-units basis.
    const scale = unit === 'unidad' ? 100 : 1
    onSave({
      // Editing keeps the id so logged entries keep resolving to this food.
      id: editing?.id ?? `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit,
      unitWeight: parseFloat(unitWeight) || undefined,
      isSupplement: noMacros || undefined,
      per100: noMacros
        ? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        : {
            kcal: num(kcal) * scale,
            protein: num(protein) * scale,
            carbs: num(carbs) * scale,
            fat: num(fat) * scale,
          },
      notes: editing?.notes ?? 'Capturado manualmente.',
    })
  }

  return (
    /* z above the picker it's opened from, whichever order they render in. */
    <div
      className="fixed inset-0 z-[55] flex flex-col justify-end bg-black/50"
      onClick={onClose}
      style={{ paddingBottom: keyboardInset }}
    >
      <div
        className="bg-[var(--surface)] rounded-t-2xl max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {editing ? 'Editar alimento' : isSupplement ? 'Nuevo suplemento' : 'Nuevo alimento'}
          </h3>
          {editing?.notes?.includes('ESTIMADO') && (
            <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
              Los valores actuales son un estimado. Captura los de la etiqueta para que tus totales
              sean exactos.
            </p>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <Field label="Nombre" value={name} onChange={setName} placeholder="Pan integral" autoFocus={!editing} />
          <Field label="Marca (opcional)" value={brand} onChange={setBrand} placeholder="" />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[var(--text-faint)]">Se mide en</span>
            <div className="flex gap-2">
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setUnit(u.id)}
                  className="flex-1 h-10 rounded-xl text-xs font-semibold active:scale-95 transition-all"
                  style={
                    unit === u.id
                      ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }
                      : { backgroundColor: 'var(--surface-2)', color: 'var(--text-faint)' }
                  }
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {unit === 'unidad' && (
            <Field
              label="Peso de una pieza en g (opcional)"
              value={unitWeight}
              onChange={setUnitWeight}
              placeholder="30"
              numeric
            />
          )}

          <label className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              checked={noMacros}
              onChange={(e) => setNoMacros(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--text)]">No aporta calorías ni macros</span>
          </label>

          {noMacros ? (
            <p className="text-xs text-[var(--text-faint)]">
              No se sumará nada a tus totales — solo quedará registrado que lo tomaste.
            </p>
          ) : (
            <>
              <p className="text-xs text-[var(--text-faint)] -mb-1">
                Valores {basis}, como vienen en la etiqueta
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Calorías" value={kcal} onChange={setKcal} placeholder="0" numeric />
                <Field label="Proteína (g)" value={protein} onChange={setProtein} placeholder="0" numeric />
                <Field label="Carbohidratos (g)" value={carbs} onChange={setCarbs} placeholder="0" numeric />
                <Field label="Grasas (g)" value={fat} onChange={setFat} placeholder="0" numeric />
              </div>
            </>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className="flex-1 h-12 rounded-xl font-semibold text-white"
              style={{ backgroundColor: 'var(--accent)', opacity: canSave ? 1 : 0.4 }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  numeric?: boolean
  autoFocus?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--text-faint)]">{label}</span>
      <input
        autoFocus={autoFocus}
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'decimal' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[var(--surface-2)] rounded-xl px-3.5 h-11 text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
      />
    </label>
  )
}
