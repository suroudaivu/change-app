export type MealSlot = 'desayuno' | 'comida' | 'cena' | 'snacks'

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** Nutritional data always per 100 units of `unit` (100 g or 100 ml). */
export interface Food {
  id: string
  name: string
  brand?: string
  unit: 'g' | 'ml' | 'unidad'
  per100: Macros
  /** If unit is 'unidad', the typical weight/volume one unit represents (for display only). */
  unitWeight?: number
  isSupplement?: boolean
  notes?: string
}

export interface FoodItem {
  id: string
  foodId: string
  quantity: number
}

export interface Meal {
  id: string
  slot: MealSlot
  name: string
  items: FoodItem[]
}

export interface DietTemplate {
  meals: Meal[]
}

export interface DayLog {
  date: string // YYYY-MM-DD
  meals: Meal[]
}

export interface WeightEntry {
  date: string // YYYY-MM-DD
  kg: number
}

export interface Goals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface AppData {
  version: number
  foods: Food[]
  dietTemplate: DietTemplate
  dayLogs: Record<string, DayLog>
  weightLog: WeightEntry[]
  goals: Goals
  savedSnacks: FoodItem[]
  frequentFoodIds: string[]
}
