import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const src = 'icon-source.svg'

const targets = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/apple-touch-icon.png', size: 180 },
]

for (const t of targets) {
  await sharp(src).resize(t.size, t.size).png().toFile(t.file)
  console.log('wrote', t.file)
}
