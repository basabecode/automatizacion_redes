/**
 * process-logo.ts
 * Genera todas las variantes del logo necesarias para favicon y UI del proyecto.
 * Fuente: public/logo/logo1.png (2048×2048 JPEG)
 *
 * Uso: pnpm tsx scripts/process-logo.ts
 */

import sharp from 'sharp'
import { resolve } from 'path'
import { existsSync } from 'fs'

const src = resolve(process.cwd(), 'public/logo/logo1.png')
const outDir = resolve(process.cwd(), 'public/logo')

if (!existsSync(src)) {
  console.error(`No se encontró el logo fuente en: ${src}`)
  process.exit(1)
}

type OutputSpec = {
  file: string
  size: number
  description: string
}

const outputs: OutputSpec[] = [
  { file: 'favicon-16.png',  size: 16,  description: 'Favicon 16×16 (browser tab small)' },
  { file: 'favicon-32.png',  size: 32,  description: 'Favicon 32×32 (browser tab estándar)' },
  { file: 'favicon-48.png',  size: 48,  description: 'Favicon 48×48 (Windows taskbar)' },
  { file: 'favicon-180.png', size: 180, description: 'Apple Touch Icon 180×180' },
  { file: 'favicon-512.png', size: 512, description: 'PWA / alta resolución 512×512' },
  { file: 'logo-sidebar.png', size: 32, description: 'Logo en sidebar (32×32)' },
  { file: 'logo-mobile.png',  size: 24, description: 'Logo en header mobile (24×24)' },
]

async function main() {
  console.log('\nProcesando logo fuente:', src)
  const meta = await sharp(src).metadata()
  console.log(`Dimensiones originales: ${meta.width}×${meta.height} · formato: ${meta.format}\n`)

  for (const { file, size, description } of outputs) {
    const outPath = resolve(outDir, file)
    await sharp(src)
      .resize(size, size, {
        fit: 'cover',       // rellena el cuadrado sin dejar bandas
        position: 'center',
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // colapsa alpha (si hubiera) sobre blanco
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(outPath)
    console.log(`  ✓ ${file.padEnd(22)} ${size}×${size}px  — ${description}`)
  }

  console.log('\n✓ Todos los archivos generados en public/logo/\n')
}

main().catch(err => {
  console.error('\nError:', err)
  process.exit(1)
})
