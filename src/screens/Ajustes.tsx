import { useRef, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import type { AppData, Food, Goals, MealSlot } from '../types'
import {
  applyBackup,
  computeMealMacros,
  exportData,
  findFood,
  inspectBackup,
  loadData,
  markExported,
  type BackupSummary,
} from '../storage'
import { FoodPicker } from '../components/FoodPicker'
import { AddSupplement } from '../components/AddSupplement'

const SLOT_LABEL: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snacks: 'Snacks frecuentes',
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Shows a base-diet total next to its goal, tinted when it's well off. */
function MacroTotal({ label, value, goal }: { label: string; value: number; goal: number }) {
  const rounded = Math.round(value)
  const offBy = goal > 0 ? Math.abs(value - goal) / goal : 0
  const color = offBy > 0.1 ? 'var(--warning)' : 'var(--text)'
  return (
    <span>
      <span className="font-semibold" style={{ color }}>
        {rounded}
      </span>
      <span className="text-[var(--text-faint)]"> / {Math.round(goal)} {label}</span>
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="text-[var(--text)] font-medium">{value}</span>
    </div>
  )
}

interface AjustesProps {
  data: AppData
  update: (fn: (current: AppData) => AppData) => void
  updateUndoable: (fn: (current: AppData) => AppData, message: string) => void
}

export function Ajustes({ data, update, updateUndoable }: AjustesProps) {
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [goalsDraft, setGoalsDraft] = useState<Goals>(data.goals)
  const [goalsSaved, setGoalsSaved] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pendingImport, setPendingImport] = useState<{
    summary: BackupSummary
    fileName: string
  } | null>(null)
  // null = closed; { food: undefined } = creating; { food } = editing.
  const [supplementForm, setSupplementForm] = useState<{ food?: Food } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // What your base diet adds up to, so edits can be checked against goals
  // without leaving the screen.
  const templateTotals = data.dietTemplate.meals.reduce(
    (total, meal) => {
      const m = computeMealMacros(data, meal)
      return {
        kcal: total.kcal + m.kcal,
        protein: total.protein + m.protein,
        carbs: total.carbs + m.carbs,
        fat: total.fat + m.fat,
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  function saveSupplement(food: Food) {
    update((current) => {
      const exists = current.foods.some((f) => f.id === food.id)
      return {
        ...current,
        foods: exists
          ? current.foods.map((f) => (f.id === food.id ? food : f))
          : [...current.foods, food],
        // A new one also becomes a one-tap chip under Hoy → Snacks.
        savedSnacks: exists
          ? current.savedSnacks
          : [...current.savedSnacks, { id: crypto.randomUUID(), foodId: food.id, quantity: 1 }],
      }
    })
    setSupplementForm(null)
  }

  function removeSupplement(foodId: string, name: string) {
    updateUndoable(
      (current) => ({
        ...current,
        foods: current.foods.filter((f) => f.id !== foodId),
        savedSnacks: current.savedSnacks.filter((s) => s.foodId !== foodId),
      }),
      `${name} eliminado`,
    )
  }

  function saveGoals() {
    update((current) => ({ ...current, goals: goalsDraft }))
    setGoalsSaved(true)
    setTimeout(() => setGoalsSaved(false), 1500)
  }

  function handleExport() {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `change-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    markExported()
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        // Parsed and validated, but nothing is replaced until confirmed.
        setPendingImport({ summary: inspectBackup(String(reader.result)), fileName: file.name })
        setImportMsg(null)
      } catch (err) {
        setPendingImport(null)
        setImportMsg({ ok: false, text: err instanceof Error ? err.message : 'Archivo inválido.' })
      }
    }
    reader.readAsText(file)
  }

  function confirmImport() {
    if (!pendingImport) return
    applyBackup(pendingImport.summary)
    update(() => loadData())
    setPendingImport(null)
    setImportMsg({ ok: true, text: 'Datos restaurados correctamente.' })
  }

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

  function removeTemplateItem(slot: MealSlot, itemId: string, foodName: string) {
    updateUndoable(
      (current) => ({
        ...current,
        dietTemplate: {
          meals: current.dietTemplate.meals.map((m) =>
            m.slot === slot ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m,
          ),
        },
      }),
      `${foodName} quitado de tu dieta`,
    )
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

      <div className="px-4 mb-6">
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Objetivos diarios</h2>
        <div className="rounded-2xl bg-[var(--surface)] p-4 grid grid-cols-2 gap-3">
          {(
            [
              ['kcal', 'Calorías'],
              ['protein', 'Proteína (g)'],
              ['carbs', 'Carbohidratos (g)'],
              ['fat', 'Grasas (g)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-[var(--text-faint)]">{label}</span>
              <input
                type="number"
                inputMode="decimal"
                value={goalsDraft[key]}
                onChange={(e) => setGoalsDraft({ ...goalsDraft, [key]: parseFloat(e.target.value) || 0 })}
                className="bg-[var(--surface-2)] rounded-xl px-3 py-2 text-[var(--text)] outline-none"
              />
            </label>
          ))}
        </div>
        <button
          onClick={saveGoals}
          className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: goalsSaved ? 'var(--success)' : 'var(--accent)' }}
        >
          {goalsSaved ? '✓ Guardado' : 'Guardar objetivos'}
        </button>
      </div>

      <div className="px-4 mb-4">
        <h2 className="text-base font-semibold text-[var(--text)] mb-1">Mi dieta</h2>
        <p className="text-xs text-[var(--text-faint)] mb-3">
          Esto es tu dieta base. Cambios aquí afectan todos los días futuros — para ajustar solo hoy, hazlo desde la
          pantalla Hoy.
        </p>

        <div className="rounded-2xl px-4 py-3 mb-4" style={{ backgroundColor: 'var(--accent-bg)' }}>
          <p className="text-xs text-[var(--text-dim)] mb-1">Total de tu dieta base</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <MacroTotal label="kcal" value={templateTotals.kcal} goal={data.goals.kcal} />
            <MacroTotal label="P" value={templateTotals.protein} goal={data.goals.protein} />
            <MacroTotal label="C" value={templateTotals.carbs} goal={data.goals.carbs} />
            <MacroTotal label="G" value={templateTotals.fat} goal={data.goals.fat} />
          </div>
        </div>

        {data.dietTemplate.meals
          .filter((m) => m.slot !== 'snacks')
          .map((meal) => (
            <div key={meal.id} className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-sm font-semibold text-[var(--text-dim)]">{SLOT_LABEL[meal.slot]}</h3>
                <span className="text-xs text-[var(--text-faint)]">
                  {Math.round(computeMealMacros(data, meal).kcal)} kcal
                </span>
              </div>
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
                        onClick={() => removeTemplateItem(meal.slot, item.id, food.name)}
                        className="w-11 h-11 -mr-2 flex items-center justify-center text-[var(--text-faint)] shrink-0"
                        aria-label="Quitar"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => setPickerSlot(meal.slot)}
                className="w-full mt-2 h-11 rounded-xl text-sm font-medium"
                style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
              >
                + Agregar alimento
              </button>
            </div>
          ))}
      </div>

      <div className="px-4 mb-6">
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Suplementos</h2>
        <div className="rounded-2xl bg-[var(--surface)] divide-y divide-[var(--border)]">
          {data.foods
            .filter((f) => f.isSupplement || f.id === 'xgear-zero-carb-choco')
            .map((f) => (
              <div key={f.id} className="px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)]">
                    {f.name} {f.brand && <span className="text-[var(--text-faint)]">· {f.brand}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-faint)] mt-0.5">
                    {f.isSupplement
                      ? `No aporta calorías ni macros.${f.unitWeight ? ` Dosis: ${f.unitWeight} g.` : ''}`
                      : `1 unidad${f.unitWeight ? ` (${f.unitWeight} g)` : ''} · ${f.per100.kcal / 100} kcal, ${f.per100.protein / 100} g proteína`}
                  </p>
                </div>
                {f.id.startsWith('custom-') && (
                  <>
                    <button
                      onClick={() => setSupplementForm({ food: f })}
                      className="w-11 h-11 flex items-center justify-center text-[var(--text-faint)] shrink-0"
                      aria-label="Editar suplemento"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => removeSupplement(f.id, f.name)}
                      className="w-11 h-11 -mr-2 flex items-center justify-center text-[var(--text-faint)] shrink-0"
                      aria-label="Eliminar suplemento"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}
        </div>
        <button
          onClick={() => setSupplementForm({})}
          className="w-full mt-2 h-11 rounded-xl text-sm font-medium"
          style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}
        >
          + Agregar suplemento
        </button>
        <p className="text-xs text-[var(--text-faint)] mt-2">
          Regístralos desde Hoy → Snacks y suplementos, con los accesos rápidos.
        </p>
      </div>

      <div className="px-4 mb-6">
        <h2 className="text-base font-semibold text-[var(--text)] mb-2">Respaldo de datos</h2>
        <div className="rounded-2xl bg-[var(--surface)] p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm text-[var(--text)] mb-1">Exportar</p>
            <p className="text-xs text-[var(--text-faint)] mb-2">
              Descarga un archivo con toda tu dieta, historial y objetivos.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Exportar datos
            </button>
          </div>
          <div>
            <p className="text-sm text-[var(--text)] mb-1">Importar</p>
            <p className="text-xs text-[var(--text-faint)] mb-2">
              Restaura desde un archivo exportado anteriormente. Reemplaza los datos actuales.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl text-sm font-medium border"
              style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
            >
              Elegir archivo...
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = ''
              }}
            />
            {importMsg && (
              <p
                className="text-xs mt-2"
                style={{ color: importMsg.ok ? 'var(--success)' : 'var(--danger)' }}
              >
                {importMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {pendingImport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          onClick={() => setPendingImport(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-2xl bg-[var(--surface)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text)]">¿Restaurar este respaldo?</h3>
            <p className="text-xs text-[var(--text-faint)] mt-1 mb-3 break-all">{pendingImport.fileName}</p>

            <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm">
              <Row label="Días registrados" value={String(pendingImport.summary.loggedDays)} />
              <Row label="Registros de peso" value={String(pendingImport.summary.weightEntries)} />
              <Row label="Alimentos" value={String(pendingImport.summary.foods)} />
              {pendingImport.summary.exportedAt && (
                <Row
                  label="Exportado el"
                  value={new Date(pendingImport.summary.exportedAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
              )}
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--danger)' }}>
              Esto reemplaza por completo tus datos actuales ({plural(Object.keys(data.dayLogs).length, 'día', 'días')},{' '}
              {plural(data.weightLog.length, 'peso', 'pesos')}). No se puede deshacer.
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setPendingImport(null)}
                className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text)] font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {supplementForm && (
        <AddSupplement
          editing={supplementForm.food}
          onAdd={saveSupplement}
          onClose={() => setSupplementForm(null)}
        />
      )}

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
