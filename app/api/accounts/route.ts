import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encrypt'
import { z } from 'zod'

const schema = z.object({
  projectId:    z.string().min(1),
  network:      z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK']),
  accountId:    z.string().min(1, 'El ID de cuenta es requerido'),
  accountName:  z.string().min(1, 'El nombre de cuenta es requerido'),
  accessToken:  z.string().min(10, 'El access token es requerido'),
  refreshToken: z.string().optional(),
  expiresAt:    z.string().optional(),
})

// ─── GET: listar cuentas sociales (opcionalmente filtradas por projectId) ───
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  const accounts = await prisma.socialAccount.findMany({
    where: { ...(projectId ? { projectId } : {}), active: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      projectId:   true,
      network:     true,
      accountId:   true,
      accountName: true,
      expiresAt:   true,
      active:      true,
      createdAt:   true,
      // NO devolver accessToken ni refreshToken (seguridad)
      project: { select: { name: true, slug: true, brandColor: true } },
    },
  })

  return NextResponse.json(accounts)
}

// ─── POST: crear o actualizar cuenta social ───
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const encryptedToken   = encrypt(data.accessToken)
    const encryptedRefresh = data.refreshToken ? encrypt(data.refreshToken) : undefined

    // upsert: si ya existe una cuenta para ese proyecto+red, la actualiza
    const account = await prisma.socialAccount.upsert({
      where: {
        projectId_network: {
          projectId: data.projectId,
          network:   data.network,
        },
      },
      update: {
        accountId:    data.accountId,
        accountName:  data.accountName,
        accessToken:  encryptedToken,
        refreshToken: encryptedRefresh ?? null,
        expiresAt:    data.expiresAt ? new Date(data.expiresAt) : null,
        active:       true,
      },
      create: {
        projectId:    data.projectId,
        network:      data.network,
        accountId:    data.accountId,
        accountName:  data.accountName,
        accessToken:  encryptedToken,
        refreshToken: encryptedRefresh ?? null,
        expiresAt:    data.expiresAt ? new Date(data.expiresAt) : null,
      },
      select: {
        id: true, projectId: true, network: true, accountId: true, accountName: true,
        expiresAt: true, active: true, createdAt: true,
        project: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
