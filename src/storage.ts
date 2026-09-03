import type { AppData, DayLog, Food, Macros, Meal } from './types'
import { withSeedData } from './seedData'

const STORAGE_KEY = 'change-app:data'
const CURRENT_VERSION = 1

function emptyData(): AppData {
  return {
    version: CURRENT_VERSION,
    foods: [],
    dietTemplate: { meals: [] },
    dayLogs: {},
    weightLog: [],
    goals: { kcal: 2400, protein: 190, carbs: 260, fat: 65 },
    savedSnacks: [],
    frequentFoodIds: [],
  }
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return withSeedData(emptyData())
  try {
    const parsed = JSON.parse(raw) as AppData
    // Future migrations by version would go here.
    return withSeedData({ ...emptyData(), ...parsed })
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

export function computeDayMacros(data: AppData, log: DayLog): Macros {
  return log.meals.reduce((total, meal) => addMacros(total, computeMealMacros(data, meal)), ZERO)
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2)
}

export function importData(json: string): void {
  const parsed = JSON.parse(json) as AppData
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    throw new Error('Archivo inválido: no parece un backup de Change.')
  }
  saveData({ ...emptyData(), ...parsed })
}
