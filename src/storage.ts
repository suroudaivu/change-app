import type { AppData, DayLog, Food, Macros, Meal } from './types'
import { syncNewSeedFoods, withSeedData } from './seedData'

const STORAGE_KEY = 'change-app:data'
const CURRENT_VERSION = 2
const DEFAULT_MAINTENANCE_KCAL = 2915

function emptyData(): AppData {
  return {
    version: CURRENT_VERSION,
    foods: [],
    dietTemplate: { meals: [] },
    dayLogs: {},
    weightLog: [],
    goals: {
      kcal: 2400,
      protein: 190,
      carbs: 260,
      fat: 65,
      maintenanceKcal: DEFAULT_MAINTENANCE_KCAL,
    },
    savedSnacks: [],
    frequentFoodIds: [],
  }
}

/**
 * Schema migrations, keyed by the version they upgrade *from*. To change the
 * shape of stored data: bump CURRENT_VERSION, then add the step that converts
 * the previous version's data into the new shape, e.g.
 *
 *   2: (data) => ({ ...data, meals: renameSomething(data.meals) })
 *
 * Steps run in order, so old installs catch up through every intermediate
 * version. Never edit a released step — add a new one.
 */
const migrations: Record<number, (data: AppData) => AppData> = {
  // v1 had no maintenance figure, so the deficit couldn't be derived. Seed it
  // from the TDEE estimate; it's editable in Ajustes.
  1: (data) => ({
    ...data,
    goals: {
      ...data.goals,
      maintenanceKcal: data.goals.maintenanceKcal ?? DEFAULT_MAINTENANCE_KCAL,
    },
  }),
}

function migrate(data: AppData): AppData {
  let migrated = data
  let version = typeof data.version === 'number' ? data.version : 1

  while (version < CURRENT_VERSION) {
    const step = migrations[version]
    if (step) migrated = step(migrated)
    version++
  }

  return { ...migrated, version: CURRENT_VERSION }
}

/** Rejects a file that isn't ours — or one whose contents would break
 * rendering — before it replaces real data, while still accepting a backup
 * that merely predates newer optional fields. */
export function isValidAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false
  const d = value as Partial<AppData>

  if (!Array.isArray(d.foods) || !Array.isArray(d.weightLog)) return false
  if (typeof d.dayLogs !== 'object' || d.dayLogs === null) return false
  if (typeof d.goals !== 'object' || d.goals === null) return false

  const goalsOk = (['kcal', 'protein', 'carbs', 'fat'] as const).every(
    (k) => typeof d.goals![k] === 'number' && Number.isFinite(d.goals![k]),
  )
  if (!goalsOk) return false

  const foodsOk = d.foods.every(
    (f) => f && typeof f.id === 'string' && typeof f.name === 'string' && typeof f.per100 === 'object',
  )
  if (!foodsOk) return false

  const logsOk = Object.values(d.dayLogs).every(
    (log) => log && typeof log.date === 'string' && Array.isArray(log.meals),
  )
  if (!logsOk) return false

  return d.weightLog.every((w) => w && typeof w.date === 'string' && typeof w.kg === 'number')
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return withSeedData(emptyData())
  try {
    const parsed = JSON.parse(raw) as AppData
    const upgraded = syncNewSeedFoods(withSeedData(migrate({ ...emptyData(), ...parsed })))
    // Write the upgraded shape back, so what's stored matches what's running
    // instead of being re-migrated on every load.
    if (parsed.version !== CURRENT_VERSION) saveData(upgraded)
    return upgraded
  } catch {
    console.error('Datos corruptos en localStorage, iniciando con datos vacíos.')
    return withSeedData(emptyData())
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function todayISO(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 10)
}

/** Deep-clones the diet template into a fresh day log for the given date. */
export function buildDayFromTemplate(data: AppData, date: string): DayLog {
  return {
    date,
    meals: data.dietTemplate.meals.map((meal) => ({
      ...meal,
      id: crypto.randomUUID(),
      items: meal.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
      eaten: meal.slot === 'snacks',
    })),
  }
}

/** Returns the log for `date`, creating it from the diet template on first access. */
export function getOrCreateDayLog(data: AppData, date: string): { data: AppData; log: DayLog } {
  const existing = data.dayLogs[date]
  if (existing) return { data, log: existing }
  const log = buildDayFromTemplate(data, date)
  const next = { ...data, dayLogs: { ...data.dayLogs, [date]: log } }
  return { data: next, log }
}

export function findFood(data: AppData, foodId: string): Food | undefined {
  return data.foods.find((f) => f.id === foodId)
}

function scaleMacros(per100: Macros, quantity: number): Macros {
  const factor = quantity / 100
  return {
    kcal: per100.kcal * factor,
    protein: per100.protein * factor,
    carbs: per100.carbs * factor,
    fat: per100.fat * factor,
  }
}

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

export function computeMealMacros(data: AppData, meal: Meal): Macros {
  return meal.items.reduce((total, item) => {
    const food = findFood(data, item.foodId)
    if (!food || food.isSupplement) return total
    return addMacros(total, scaleMacros(food.per100, item.quantity))
  }, ZERO)
}

/** Only counts meals that are eaten (snacks always are) — a planned but
 * unconfirmed desayuno/comida/cena shouldn't inflate today's totals. */
export function computeDayMacros(data: AppData, log: DayLog): Macros {
  return log.meals.reduce((total, meal) => {
    if (meal.slot !== 'snacks' && !meal.eaten) return total
    return addMacros(total, computeMealMacros(data, meal))
  }, ZERO)
}

const LAST_EXPORT_KEY = 'change-app:lastExport'
const BACKUP_INTERVAL_DAYS = 7

export function markExported(): void {
  localStorage.setItem(LAST_EXPORT_KEY, String(Date.now()))
}

export function daysSinceLastExport(): number | null {
  const raw = localStorage.getItem(LAST_EXPORT_KEY)
  if (!raw) return null
  return Math.floor((Date.now() - Number(raw)) / 86_400_000)
}

/** True once there's data worth losing and no recent backup. */
export function needsBackupReminder(data: AppData): boolean {
  const hasData = data.weightLog.length > 0 || Object.keys(data.dayLogs).length > 0
  if (!hasData) return false
  const days = daysSinceLastExport()
  return days === null || days >= BACKUP_INTERVAL_DAYS
}

export function exportData(): string {
  return JSON.stringify({ ...loadData(), exportedAt: new Date().toISOString() }, null, 2)
}

export interface BackupSummary {
  data: AppData
  exportedAt?: string
  loggedDays: number
  weightEntries: number
  foods: number
}

/** Parses and validates a backup file without applying it, so the user can
 * see what they're about to replace their data with. */
export function inspectBackup(json: string): BackupSummary {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }

  if (!isValidAppData(parsed)) {
    throw new Error('Este archivo no parece un respaldo de Change.')
  }

  const data = migrate({ ...emptyData(), ...parsed })
  return {
    data,
    exportedAt: (parsed as { exportedAt?: string }).exportedAt,
    loggedDays: Object.keys(data.dayLogs).length,
    weightEntries: data.weightLog.length,
    foods: data.foods.length,
  }
}

/** Applies an already-inspected backup. Replaces everything. */
export function applyBackup(summary: BackupSummary): void {
  saveData(summary.data)
}
