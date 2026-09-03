import type { AppData, Food, Meal } from './types'

/**
 * Starting food database, built from your dieta actual (Etapa 1 del brief).
 * Every entry's source is noted so it's clear what's a real label value vs.
 * a standard commodity value vs. a temporary estimate pending confirmation.
 */
export const seedFoods: Food[] = [
  {
    id: 'claras-san-juan',
    name: 'Claras de huevo líquidas',
    brand: 'San Juan',
    unit: 'g',
    per100: { kcal: 47, protein: 10, carbs: 1, fat: 0 },
    notes: 'Etiqueta real del producto.',
  },
  {
    id: 'huevo-entero',
    name: 'Huevo entero',
    brand: 'San Juan',
    unit: 'g',
    per100: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
    unitWeight: 50,
    notes: 'Valor estándar de huevo entero crudo (commodity, no varía por marca).',
  },
  {
    id: 'aceite-oliva-mm',
    name: 'Aceite de oliva',
    brand: "Member's Mark",
    unit: 'g',
    per100: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
    notes: 'Valor estándar de aceite de oliva (commodity).',
  },
  {
    id: 'yoplait-griego-sin-azucar',
    name: 'Yogurt griego sin azúcar añadida',
    brand: 'Yoplait',
    unit: 'g',
    per100: { kcal: 74, protein: 7, carbs: 7.1, fat: 2 },
    notes: 'Etiqueta (FatSecret MX).',
  },
  {
    id: 'zarzamora-mm',
    name: 'Zarzamora congelada',
    brand: "Member's Mark",
    unit: 'g',
    per100: { kcal: 69, protein: 1.4, carbs: 15.7, fat: 0 },
    notes: 'Etiqueta del producto.',
  },
  {
    id: 'fresa-mm',
    name: 'Fresa congelada',
    brand: "Member's Mark",
    unit: 'g',
    per100: { kcal: 35, protein: 0.8, carbs: 8.3, fat: 0.2 },
    notes: 'Valor estándar de fresa congelada sin azúcar (commodity).',
  },
  {
    id: 'pan-integral-smart',
    name: 'Pan integral de caja',
    brand: 'Smart',
    unit: 'g',
    per100: { kcal: 247, protein: 13, carbs: 41, fat: 3.4 },
    unitWeight: 32,
    notes: 'ESTIMADO genérico de pan integral de caja — pendiente confirmar con etiqueta real de Smart.',
  },
  {
    id: 'aguacate-hass',
    name: 'Aguacate',
    brand: 'Hass',
    unit: 'g',
    per100: { kcal: 160, protein: 2, carbs: 8.5, fat: 14.7 },
    notes: 'Valor estándar de aguacate Hass (commodity).',
  },
  {
    id: 'pollo-pechuga-mm',
    name: 'Pechuga de pollo sin piel (cocida)',
    brand: "Member's Mark",
    unit: 'g',
    per100: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
    notes: 'Valor estándar de pechuga de pollo cocida (commodity, no varía por marca).',
  },
  {
    id: 'carne-molida-90-10-mm',
    name: 'Carne molida 90/10 (cocida)',
    brand: "Member's Mark",
    unit: 'g',
    per100: { kcal: 217, protein: 26, carbs: 0, fat: 12 },
    notes: 'Valor estándar de carne molida 90/10 cocida (commodity).',
  },
  {
    id: 'frijoles-isadora',
    name: 'Frijoles bayos bajos en grasa',
    brand: 'Isadora',
    unit: 'g',
    per100: { kcal: 71, protein: 5.6, carbs: 18.7, fat: 0.7 },
    notes: 'Open Food Facts — fuentes con ligera variación, confirmar con etiqueta si es posible.',
  },
  {
    id: 'arroz-blanco-cocido',
    name: 'Arroz blanco (cocido)',
    unit: 'g',
    per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    notes: 'Valor estándar de arroz blanco cocido (commodity).',
  },
  {
    id: 'lechuga-romana',
    name: 'Lechuga romana',
    unit: 'g',
    per100: { kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3 },
    notes: 'Valor estándar (commodity).',
  },
  {
    id: 'papa-cocida',
    name: 'Papa (cocida, puré)',
    unit: 'g',
    per100: { kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
    notes: 'Valor estándar de papa hervida (commodity), sin agregados.',
  },
  {
    id: 'mantequilla-lala',
    name: 'Mantequilla',
    brand: 'Lala',
    unit: 'g',
    per100: { kcal: 717, protein: 0.1, carbs: 0.1, fat: 81 },
    notes: 'Valor estándar de mantequilla (commodity).',
  },
  {
    id: 'limon',
    name: 'Limón',
    unit: 'g',
    per100: { kcal: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
    notes: 'Valor estándar (commodity); cantidad usada es mínima.',
  },
  {
    id: 'manzana-verde',
    name: 'Manzana verde',
    unit: 'g',
    per100: { kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
    notes: 'Valor estándar (commodity).',
  },
  {
    id: 'toronja',
    name: 'Toronja',
    unit: 'g',
    per100: { kcal: 42, protein: 0.8, carbs: 10.7, fat: 0.1 },
    notes: 'Valor estándar (commodity).',
  },
  {
    id: 'lala-100-light-proteina',
    name: 'Leche 100 Light con proteína',
    brand: 'Lala',
    unit: 'ml',
    per100: { kcal: 44, protein: 5.4, carbs: 3.4, fat: 1 },
    notes: 'Etiqueta (FatSecret MX).',
  },
  {
    id: 'coca-cola-zero',
    name: 'Coca-Cola Zero',
    unit: 'ml',
    per100: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    notes: 'Sitio oficial Coca-Cola México.',
  },
  {
    id: 'tortilla-maiz',
    name: 'Tortilla de maíz',
    unit: 'unidad',
    unitWeight: 25,
    per100: { kcal: 5450, protein: 142.5, carbs: 1115, fat: 71.25 },
    notes: 'Valor estándar de tortilla de maíz (commodity), ~25 g c/u.',
  },
  {
    id: 'monster-ultra-white',
    name: 'Monster Ultra White (sin azúcar)',
    brand: 'Monster',
    unit: 'ml',
    per100: { kcal: 2, protein: 0, carbs: 0.9, fat: 0 },
    notes: 'Etiqueta del producto (Open Food Facts / ficha oficial Monster).',
  },
  {
    id: 'xgear-zero-carb-choco',
    name: 'Proteína Zero Carb choco capuccino',
    brand: 'X-Gear',
    unit: 'unidad',
    unitWeight: 30,
    per100: { kcal: 15100, protein: 2700, carbs: 0, fat: 0 },
    notes: '1 unidad = 1 scoop (30 g). Etiqueta oficial x-gear.com.mx: 151 kcal, 27 g proteína por scoop.',
  },
  {
    id: 'creatina-hero-sport',
    name: 'Creatina monohidratada',
    brand: 'Hero Sport',
    unit: 'unidad',
    unitWeight: 5,
    per100: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    isSupplement: true,
    notes: '1 unidad = 1 dosis (5 g). La creatina monohidratada no aporta calorías ni macros.',
  },
]

/** Quick substitution suggestions shown when swapping a food, with a
 * sensible default quantity for the replacement (not just "same weight" —
 * e.g. rice ↔ 2 tortillas isn't equal grams). */
export const commonSubstitutes: Record<string, { foodId: string; quantity: number }[]> = {
  'pollo-pechuga-mm': [{ foodId: 'carne-molida-90-10-mm', quantity: 120 }],
  'carne-molida-90-10-mm': [{ foodId: 'pollo-pechuga-mm', quantity: 120 }],
  'zarzamora-mm': [{ foodId: 'fresa-mm', quantity: 80 }],
  'fresa-mm': [{ foodId: 'zarzamora-mm', quantity: 80 }],
  'arroz-blanco-cocido': [
    { foodId: 'papa-cocida', quantity: 150 },
    { foodId: 'tortilla-maiz', quantity: 2 },
  ],
  'papa-cocida': [
    { foodId: 'arroz-blanco-cocido', quantity: 85 },
    { foodId: 'tortilla-maiz', quantity: 2 },
  ],
}

export const seedDietTemplate: Meal[] = [
  {
    id: 'meal-desayuno',
    slot: 'desayuno',
    name: 'Desayuno',
    items: [
      { id: 'i-claras', foodId: 'claras-san-juan', quantity: 99 }, // 3 claras ≈ 33 g c/u
      { id: 'i-huevo', foodId: 'huevo-entero', quantity: 50 }, // 1 huevo
      { id: 'i-aceite-desayuno', foodId: 'aceite-oliva-mm', quantity: 14 }, // ~1 cda repartida
      { id: 'i-yogurt', foodId: 'yoplait-griego-sin-azucar', quantity: 120 },
      { id: 'i-frutosrojos', foodId: 'zarzamora-mm', quantity: 80 },
      { id: 'i-pan', foodId: 'pan-integral-smart', quantity: 32 }, // 1 rebanada
      { id: 'i-aguacate-d', foodId: 'aguacate-hass', quantity: 50 }, // 1/4 aguacate
    ],
  },
  {
    id: 'meal-comida',
    slot: 'comida',
    name: 'Comida',
    items: [
      { id: 'i-pollo-c', foodId: 'pollo-pechuga-mm', quantity: 120 },
      { id: 'i-frijoles', foodId: 'frijoles-isadora', quantity: 100 },
      { id: 'i-arroz', foodId: 'arroz-blanco-cocido', quantity: 85 },
      { id: 'i-aceite-arroz', foodId: 'aceite-oliva-mm', quantity: 14 },
      { id: 'i-lechuga-c', foodId: 'lechuga-romana', quantity: 100 }, // 2 tazas
      { id: 'i-aguacate-c', foodId: 'aguacate-hass', quantity: 50 },
    ],
  },
  {
    id: 'meal-cena',
    slot: 'cena',
    name: 'Cena',
    items: [
      { id: 'i-pollo-e', foodId: 'pollo-pechuga-mm', quantity: 120 },
      { id: 'i-papa', foodId: 'papa-cocida', quantity: 150 }, // papa chica, tamaño de un puño
      { id: 'i-mantequilla', foodId: 'mantequilla-lala', quantity: 14 }, // 1 cda
      { id: 'i-lechuga-e', foodId: 'lechuga-romana', quantity: 100 },
      { id: 'i-limon', foodId: 'limon', quantity: 10 },
    ],
  },
  {
    id: 'meal-snacks',
    slot: 'snacks',
    name: 'Snacks',
    items: [],
  },
]

/** Adds any built-in foods/snacks introduced since the user's data was
 * first seeded, without touching anything they've customized. Existing
 * ids are left completely alone. */
export function syncNewSeedFoods(data: AppData): AppData {
  if (data.foods.length === 0) return data
  const existingFoodIds = new Set(data.foods.map((f) => f.id))
  const newFoods = seedFoods.filter((f) => !existingFoodIds.has(f.id))

  const existingSnackFoodIds = new Set(data.savedSnacks.map((s) => s.foodId))
  const newSnacks = defaultSavedSnacks.filter((s) => !existingSnackFoodIds.has(s.foodId))

  if (newFoods.length === 0 && newSnacks.length === 0) return data
  return {
    ...data,
    foods: [...data.foods, ...newFoods],
    savedSnacks: [...data.savedSnacks, ...newSnacks],
  }
}

const defaultSavedSnacks = [
  { id: 'snack-manzana', foodId: 'manzana-verde', quantity: 150 },
  { id: 'snack-toronja', foodId: 'toronja', quantity: 200 },
  { id: 'snack-yogurt', foodId: 'yoplait-griego-sin-azucar', quantity: 120 },
  { id: 'snack-coca-zero', foodId: 'coca-cola-zero', quantity: 355 },
  { id: 'snack-lala-light', foodId: 'lala-100-light-proteina', quantity: 250 },
  { id: 'snack-xgear', foodId: 'xgear-zero-carb-choco', quantity: 1 },
  { id: 'snack-creatina', foodId: 'creatina-hero-sport', quantity: 1 },
  { id: 'snack-monster', foodId: 'monster-ultra-white', quantity: 473 },
]

export function withSeedData(data: AppData): AppData {
  if (data.foods.length > 0) return data
  return {
    ...data,
    foods: seedFoods,
    dietTemplate: { meals: seedDietTemplate },
    savedSnacks: defaultSavedSnacks,
  }
}
