import { useState } from 'react'
import { useKeyboardInset } from '../useKeyboardInset'
import type { Food } from '../types'

interface AddSupplementProps {
  onAdd: (food: Food) => void
  onClose: () => void
  /** When present, the form edits this supplement instead of creating one. */
  editing?: Food
}

/** Supplements are stored with unit 'unidad', where one unit is one dose.
 * Macros are held per 100 units (the app-wide convention), so a per-dose
 * value entered here is multiplied by 100 on the way in. */
export function AddSupplement({ onAdd, onClose, editing }: AddSupplementProps) {
  const perDose = (v: number) => (v ? String(v / 100) : '')
  const [name, setName] = useState(editing?.name ?? '')
  const [brand, setBrand] = useState(editing?.brand ?? '')
  const [doseGrams, setDoseGrams] = useState(editing?.unitWeight ? String(editing.unitWeight) : '')
  const [hasMacros, setHasMacros] = useState(editing ? !editing.isSupplement : false)
  const [kcal, setKcal] = useState(perDose(editing?.per100.kcal ?? 0))
  const [protein, setProtein] = useState(perDose(editing?.per100.protein ?? 0))
  const [carbs, setCarbs] = useState(perDose(editing?.per100.carbs ?? 0))
  const [fat, setFat] = useState(perDose(editing?.per100.fat ?? 0))
  const keyboardInset = useKeyboardInset()

  const canSave = name.trim().length > 0

  function save() {
    if (!canSave) return
    const num = (v: string) => parseFloat(v) || 0
    onAdd({
      // Editing keeps the same id so existing log entries keep resolving.
      id: editing?.id ?? `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit: 'unidad',
      unitWeight: parseFloat(doseGrams) || undefined,
      isSupplement: !hasMacros,
      per100: hasMacros
        ? {
            kcal: num(kcal) * 100,
            protein: num(protein) * 100,
            carbs: num(carbs) * 100,
            fat: num(fat) * 100,
          }
        : { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      notes: hasMacros
        ? 'Suplemento con aporte de macros, capturado manualmente.'
        : 'No aporta calorías ni macros.',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
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
            {editing ? 'Editar suplemento' : 'Nuevo suplemento'}
          </h3>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <Field label="Nombre" value={name} onChange={setName} placeholder="Magnesio" autoFocus />
          <Field label="Marca (opcional)" value={brand} onChange={setBrand} placeholder="" />
          <Field
            label="Tamaño de la dosis en g (opcional)"
            value={doseGrams}
            onChange={setDoseGrams}
            placeholder="5"
            numeric
          />

          <label className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              checked={hasMacros}
              onChange={(e) => setHasMacros(e.target.checked)}
              className="w-5 h-5 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--text)]">Aporta calorías o macros</span>
          </label>

          {hasMacros ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="kcal por dosis" value={kcal} onChange={setKcal} placeholder="0" numeric />
              <Field label="Proteína (g)" value={protein} onChange={setProtein} placeholder="0" numeric />
              <Field label="Carbohidratos (g)" value={carbs} onChange={setCarbs} placeholder="0" numeric />
              <Field label="Grasas (g)" value={fat} onChange={setFat} placeholder="0" numeric />
            </div>
          ) : (
            <p className="text-xs text-[var(--text-faint)]">
              No se sumará nada a tus totales diarios — solo quedará registrado que lo tomaste.
            </p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className="flex-1 py-3 rounded-xl font-medium text-white"
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
        className="bg-[var(--surface-2)] rounded-xl px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none"
      />
    </label>
  )
}
