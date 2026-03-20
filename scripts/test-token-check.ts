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
import { decrypt } from '../lib/encrypt'

async function main() {
  const envToken = process.env.PAGE_FACEBOOK_ACCESS_TOKEN ?? ''

  const accounts = await prisma.socialAccount.findMany({ where: { active: true } })
  for (const acc of accounts) {
    const dbToken = decrypt(acc.accessToken)

    console.log(`\n${acc.network}:`)
    console.log(`  DB token length  : ${dbToken.length}`)
    console.log(`  ENV token length : ${envToken.length}`)
    console.log(`  DB starts with   : "${dbToken.slice(0, 20)}"`)
    console.log(`  ENV starts with  : "${envToken.slice(0, 20)}"`)
    console.log(`  DB has newline   : ${dbToken.includes('\n')}`)
    console.log(`  DB has space     : ${dbToken.includes(' ')}`)
    console.log(`  Tokens match     : ${dbToken === envToken}`)

    // Mostrar chars especiales
    const nonPrintable = [...dbToken].filter(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126)
    if (nonPrintable.length > 0) {
      console.log(`  Chars no imprimibles: ${nonPrintable.map(c => c.charCodeAt(0))}`)
    }
  }

  await prisma.$disconnect()
}

main()
