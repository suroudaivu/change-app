import type { Goals, Macros } from './types'

interface CardInput {
  date: string
  totals: Macros
  goals: Goals
  weightKg?: number
  gymDay?: boolean
}

const W = 1080
const H = 1350

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

function bar(
  ctx: CanvasRenderingContext2D,
  y: number,
  label: string,
  consumed: number,
  goal: number,
  unit: string,
  color: string,
) {
  const x = 90
  const w = W - 180

  ctx.fillStyle = '#f5f5f7'
  ctx.font = '600 38px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label, x, y)

  ctx.fillStyle = '#9a9aa5'
  ctx.textAlign = 'right'
  ctx.font = '400 34px -apple-system, system-ui, sans-serif'
  ctx.fillText(`${Math.round(consumed)} / ${Math.round(goal)} ${unit}`, x + w, y)

  ctx.fillStyle = '#1f1f27'
  roundRect(ctx, x, y + 22, w, 20, 10)

  const pct = goal > 0 ? Math.min(1, consumed / goal) : 0
  if (pct > 0) {
    ctx.fillStyle = color
    roundRect(ctx, x, y + 22, Math.max(20, w * pct), 20, 10)
  }
}

export async function buildShareCard({ date, totals, goals, weightKg, gymDay }: CardInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo generar la imagen.')

  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.fillStyle = '#0a84ff'
  ctx.font = '700 44px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Change', 90, 130)

  ctx.fillStyle = '#66666f'
  ctx.font = '400 34px -apple-system, system-ui, sans-serif'
  ctx.fillText(
    new Date(date + 'T00:00:00').toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    90,
    185,
  )

  // Gym day badge
  if (gymDay) {
    ctx.font = '400 52px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('🏋️', W - 90, 145)
  }

  // Calories headline
  ctx.fillStyle = '#f5f5f7'
  ctx.font = '700 150px -apple-system, system-ui, sans-serif'
  ctx.fillText(String(Math.round(totals.kcal)), 90, 380)
  ctx.fillStyle = '#66666f'
  ctx.font = '400 40px -apple-system, system-ui, sans-serif'
  ctx.fillText(`de ${Math.round(goals.kcal)} kcal`, 90, 440)

  // Macro bars
  bar(ctx, 570, 'Calorías', totals.kcal, goals.kcal, 'kcal', '#0a84ff')
  bar(ctx, 700, 'Proteína', totals.protein, goals.protein, 'g', '#30d158')
  bar(ctx, 830, 'Carbohidratos', totals.carbs, goals.carbs, 'g', '#ff9f0a')
  bar(ctx, 960, 'Grasas', totals.fat, goals.fat, 'g', '#bf5af2')

  // Weight
  if (weightKg != null) {
    ctx.fillStyle = '#17171d'
    roundRect(ctx, 90, 1060, W - 180, 150, 32)

    ctx.fillStyle = '#66666f'
    ctx.font = '400 32px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Peso', 140, 1125)

    ctx.fillStyle = '#f5f5f7'
    ctx.font = '600 58px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${weightKg} kg`, W - 140, 1140)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo generar la imagen.'))
    }, 'image/png')
  })
}

/** Shares the card through the OS share sheet when possible, otherwise
 * falls back to downloading it. */
export async function shareCard(blob: Blob, date: string): Promise<void> {
  const file = new File([blob], `change-${date}.png`, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      // User dismissed the share sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `change-${date}.png`
  a.click()
  URL.revokeObjectURL(url)
}
