/**
 * test-publish-db.ts
 * Prueba el flujo completo de publicación usando los posts y cuentas reales de la BD.
 * Llama a los mismos servicios que usa /api/publish pero sin pasar por el servidor HTTP.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
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
} catch { /* ignorar */ }

// También cargar .env como fallback
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1')
    if (key && !process.env[key]) process.env[key] = val
  }
} catch { /* ignorar */ }

import { prisma } from '../lib/prisma'
import { decrypt } from '../lib/encrypt'
import { publishToFacebook, publishToInstagram } from '../lib/services/publish.service'

const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'
const CYAN  = '\x1b[36m'
const BOLD  = '\x1b[1m'
const RESET = '\x1b[0m'

async function main() {
  console.log(`\n${BOLD}Test de publicación desde BD${RESET}`)
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET?.slice(0, 10)}...`)

  // 1. Verificar cuentas y descifrado
  console.log(`\n${CYAN}── Cuentas sociales en BD ──────────────────${RESET}`)
  const accounts = await prisma.socialAccount.findMany({ where: { active: true } })

  if (accounts.length === 0) {
    console.log(`${RED}✗ No hay cuentas activas en la BD${RESET}`)
    await prisma.$disconnect()
    return
  }

  for (const acc of accounts) {
    try {
      const token = decrypt(acc.accessToken)
      const valid = token.startsWith('EAA')
      console.log(`  ${acc.network}: ${valid ? GREEN + '✓ Token OK' : RED + '✗ Token inválido (' + token.slice(0, 20) + ')'}${RESET}`)
    } catch (e) {
      console.log(`  ${acc.network}: ${RED}✗ Error al descifrar — ${(e as Error).message}${RESET}`)
    }
  }

  // 2. Buscar un post READY para probar
  console.log(`\n${CYAN}── Posts READY disponibles ─────────────────${RESET}`)
  const posts = await prisma.post.findMany({
    where: { status: 'READY' },
    include: { socialAccount: true },
    take: 3,
  })

  if (posts.length === 0) {
    console.log(`${RED}✗ No hay posts en estado READY${RESET}`)
    await prisma.$disconnect()
    return
  }

  for (const post of posts) {
    console.log(`  ${post.network} · ${post.id.slice(-8)} · ${post.contentType} · img: ${post.imageUrl ? '✓' : '✗'}`)
  }

  // 3. Probar publicación con el primer post FACEBOOK READY
  const fbPost = posts.find(p => p.network === 'FACEBOOK')
  if (fbPost) {
    console.log(`\n${CYAN}── Publicando post Facebook (${fbPost.id.slice(-8)}) ────${RESET}`)

    // Resolver cuenta
    let account = fbPost.socialAccount
    if (!account) {
      account = await prisma.socialAccount.findFirst({
        where: { projectId: fbPost.projectId, network: 'FACEBOOK', active: true },
      }) as typeof account
    }

    if (!account) {
      console.log(`${RED}✗ No se encontró cuenta FACEBOOK activa${RESET}`)
    } else {
      try {
        const token = decrypt(account.accessToken)
        console.log(`  Token descifrado: ${GREEN}✓ (${token.slice(0, 15)}...)${RESET}`)

        const caption = [fbPost.description ?? '', (fbPost.hashtags ?? []).map((h: string) => `#${h}`).join(' ')].join('\n\n')

        const result = await publishToFacebook({
          accessToken: token,
          pageId:      account.accountId,
          message:     caption,
          contentType: fbPost.contentType,
          imageUrl:    fbPost.imageUrl ?? undefined,
          mediaUrls:   fbPost.mediaUrls,
        })

        if (result.success) {
          console.log(`  ${GREEN}${BOLD}✓ Publicado en Facebook${RESET}`)
          console.log(`  Post ID: ${result.postId}`)
          if (result.postUrl) console.log(`  URL: ${result.postUrl}`)

          // Actualizar BD
          await prisma.post.update({
            where: { id: fbPost.id },
            data: { status: 'PUBLISHED', publishedAt: new Date(), publishedUrl: result.postUrl ?? null },
          })
          console.log(`  ${GREEN}✓ Estado actualizado en BD → PUBLISHED${RESET}`)
        } else {
          console.log(`  ${RED}✗ Error: ${result.error}${RESET}`)
        }
      } catch (e) {
        console.log(`  ${RED}✗ Excepción: ${(e as Error).message}${RESET}`)
      }
    }
  }

  await prisma.$disconnect()
  console.log(`\n${BOLD}Test completado${RESET}\n`)
}

main().catch(err => {
  console.error(`\n${RED}Error fatal:${RESET}`, err)
  process.exit(1)
})
