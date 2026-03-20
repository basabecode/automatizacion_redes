import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')
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

import { prisma } from '../lib/prisma'
import { decrypt } from '../lib/encrypt'

async function main() {
  const accounts = await prisma.socialAccount.findMany({ where: { active: true } })
  console.log(`\nCuentas activas: ${accounts.length}`)
  for (const acc of accounts) {
    try {
      const token = decrypt(acc.accessToken)
      const valid = token.startsWith('EAA')
      console.log(`  ${acc.network}: ${valid ? '✓ Token OK (' + token.slice(0, 15) + '...)' : '✗ Token inválido: ' + token.slice(0, 30)}`)
    } catch (e) {
      console.log(`  ${acc.network}: ✗ Error al descifrar — ${(e as Error).message}`)
    }
  }
  await prisma.$disconnect()
}

main()
