/**
 * test-publish.ts
 * Script de prueba para el flujo completo de publicación en Facebook e Instagram.
 *
 * Uso:
 *   npx tsx scripts/test-publish.ts
 *   npx tsx scripts/test-publish.ts --fb-only
 *   npx tsx scripts/test-publish.ts --ig-only
 *   npx tsx scripts/test-publish.ts --dry-run   (no publica, solo valida credenciales)
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cargar .env manualmente (sin depender de dotenv)
const envPath = resolve(process.cwd(), '.env')
try {
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1')
    if (key && !process.env[key]) process.env[key] = val
  }
} catch { /* .env opcional */ }

import { publishToFacebook, publishToInstagram, type PublishResult } from '../lib/services/publish.service'

// ─── Configuración ────────────────────────────────────────────────────────────

const TOKEN      = process.env.PAGE_FACEBOOK_ACCESS_TOKEN!
const FB_PAGE_ID = '107540020768150'   // Página: CapiShoping
const IG_ACC_ID  = '17841429412278474' // Instagram: @somostecnico

// Imagen pública de prueba JPEG directa — Meta requiere URL sin redirects, JPEG/PNG
// Pexels sirve imágenes JPEG directas sin redirección
const TEST_IMAGE_URL = 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&dpr=1'

const args      = process.argv.slice(2)
const fbOnly    = args.includes('--fb-only')
const igOnly    = args.includes('--ig-only')
const dryRun    = args.includes('--dry-run')

const runFb = !igOnly
const runIg = !fbOnly

// ─── Helpers de output ────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const BOLD   = '\x1b[1m'
const RESET  = '\x1b[0m'

function ok(label: string, result: PublishResult) {
  console.log(`\n${GREEN}${BOLD}✓ ${label}${RESET}`)
  console.log(`  Post ID : ${result.postId}`)
  if (result.postUrl) console.log(`  URL     : ${result.postUrl}`)
}

function fail(label: string, result: PublishResult) {
  console.log(`\n${RED}${BOLD}✗ ${label}${RESET}`)
  console.log(`  Error   : ${result.error}`)
}

function section(title: string) {
  console.log(`\n${CYAN}${BOLD}── ${title} ${'─'.repeat(50 - title.length)}${RESET}`)
}

// ─── Validación de credenciales ───────────────────────────────────────────────

async function validateCredentials() {
  section('Validando credenciales Meta')

  if (!TOKEN) {
    console.log(`${RED}✗ PAGE_FACEBOOK_ACCESS_TOKEN no está definido en .env${RESET}`)
    process.exit(1)
  }

  const res  = await fetch(`https://graph.facebook.com/v21.0/${FB_PAGE_ID}?fields=id,name&access_token=${TOKEN}`)
  const data = await res.json() as { id?: string; name?: string; error?: { message: string } }

  if (data.error) {
    console.log(`${RED}✗ Token inválido: ${data.error.message}${RESET}`)
    process.exit(1)
  }

  console.log(`${GREEN}✓ Facebook Page: ${data.name} (${data.id})${RESET}`)

  const igRes  = await fetch(`https://graph.facebook.com/v21.0/${IG_ACC_ID}?fields=id,username,followers_count&access_token=${TOKEN}`)
  const igData = await igRes.json() as { id?: string; username?: string; followers_count?: number; error?: { message: string } }

  if (igData.error) {
    console.log(`${YELLOW}⚠ Instagram: ${igData.error.message}${RESET}`)
  } else {
    console.log(`${GREEN}✓ Instagram: @${igData.username} (${igData.followers_count} seguidores)${RESET}`)
  }
}

// ─── Tests de Facebook ────────────────────────────────────────────────────────

async function testFacebook() {
  section('Facebook — Tests')

  const caption = `[TEST ${new Date().toLocaleTimeString('es-ES')}] Post de prueba desde Yetzar Content Studio. Este post verifica el flujo de publicación automática.\n\n#test #automatizacion #yetzar`

  // 1. Texto solamente
  console.log(`\n${YELLOW}1/2 · Post solo texto${RESET}`)
  if (dryRun) {
    console.log('  [DRY RUN] Omitiendo publicación')
  } else {
    const r = await publishToFacebook({ accessToken: TOKEN, pageId: FB_PAGE_ID, message: caption })
    r.success ? ok('Facebook texto', r) : fail('Facebook texto', r)
  }

  // 2. Post con imagen
  console.log(`\n${YELLOW}2/2 · Post con imagen${RESET}`)
  console.log(`  Imagen: ${TEST_IMAGE_URL}`)
  if (dryRun) {
    console.log('  [DRY RUN] Omitiendo publicación')
  } else {
    const r = await publishToFacebook({
      accessToken: TOKEN,
      pageId:      FB_PAGE_ID,
      message:     caption,
      contentType: 'IMAGE',
      imageUrl:    TEST_IMAGE_URL,
    })
    r.success ? ok('Facebook imagen', r) : fail('Facebook imagen', r)
  }
}

// ─── Tests de Instagram ───────────────────────────────────────────────────────

async function testInstagram() {
  section('Instagram — Tests')

  const caption = `[TEST ${new Date().toLocaleTimeString('es-ES')}] Post de prueba desde Yetzar Content Studio. Verificando flujo de publicación automática.\n\n#test #automatizacion #yetzar`

  console.log(`\n${YELLOW}1/1 · Post con imagen${RESET}`)
  console.log(`  Imagen: ${TEST_IMAGE_URL}`)

  if (dryRun) {
    console.log('  [DRY RUN] Omitiendo publicación')
    return
  }

  // Verificar límite diario antes de publicar
  const limitRes  = await fetch(`https://graph.facebook.com/v21.0/${IG_ACC_ID}/content_publishing_limit?fields=config,quota_usage&access_token=${TOKEN}`)
  const limitData = await limitRes.json() as { data?: Array<{ config?: { quota_total: number }; quota_usage?: number }>; error?: { message: string } }
  if (limitData.data?.[0]) {
    const lim = limitData.data[0]
    console.log(`  Cuota de publicaciones: ${lim.quota_usage} / ${lim.config?.quota_total} usadas hoy`)
  }

  // Publicar vía publish.service.ts (maneja container + publish internamente)
  const r = await publishToInstagram({
    accessToken: TOKEN,
    igAccountId: IG_ACC_ID,
    caption,
    contentType: 'IMAGE',
    imageUrl:    TEST_IMAGE_URL,
  })

  r.success ? ok('Instagram imagen', r) : fail('Instagram imagen', r)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}Yetzar Content Studio — Test de publicación${RESET}`)
  console.log(`Modo: ${dryRun ? YELLOW + 'DRY RUN' : GREEN + 'REAL'}${RESET}`)
  console.log(`Redes: ${[runFb && 'Facebook', runIg && 'Instagram'].filter(Boolean).join(', ')}`)

  await validateCredentials()

  if (runFb) await testFacebook()
  if (runIg) await testInstagram()

  console.log(`\n${BOLD}Test completado${RESET}\n`)
}

main().catch(err => {
  console.error(`\n${RED}Error fatal:${RESET}`, err)
  process.exit(1)
})
