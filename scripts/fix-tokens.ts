/**
 * fix-tokens.ts — Actualiza los tokens de las cuentas sociales con el valor correcto del .env
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

for (const file of ['.env.local', '.env']) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), file), 'utf8')
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
}

import { prisma } from '../lib/prisma'
import { encrypt } from '../lib/encrypt'

async function main() {
  const token = process.env.PAGE_FACEBOOK_ACCESS_TOKEN
  if (!token || !token.startsWith('EAA')) {
    console.error('PAGE_FACEBOOK_ACCESS_TOKEN no encontrado o inválido en .env')
    process.exit(1)
  }

  console.log(`\nToken a guardar: ${token.slice(0, 20)}... (${token.length} chars)`)

  const encrypted = encrypt(token)
  console.log(`Token cifrado: ${encrypted.slice(0, 30)}...`)

  const updated = await prisma.socialAccount.updateMany({
    where: { active: true },
    data: { accessToken: encrypted },
  })

  console.log(`\n✓ Actualizadas ${updated.count} cuentas con el token correcto`)
  await prisma.$disconnect()
}

main()
