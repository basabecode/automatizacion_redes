import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { deriveCalendarStatus, summarizeEntryPosts } from '@/lib/admin-workflow'
import { z } from 'zod'

const patchSchema = z.object({
  topic:       z.string().min(3).optional(),
  notes:       z.string().optional(),
  networks:    z.array(z.enum(['FACEBOOK','INSTAGRAM','TIKTOK'])).optional(),
  contentType: z.enum(['IMAGE','VIDEO','CAROUSEL','STORY']).optional(),
  status:      z.enum(['PENDING','GENERATING','READY','APPROVED','PUBLISHED','NEEDS_EDIT']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const data = patchSchema.parse(await req.json())

  const existing = await prisma.calendarEntry.findUnique({
    where: { id },
    include: {
      posts: {
        select: { status: true },
      },
    },
  })

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Entrada no encontrada' }, { status: 404 })
  }

  if (data.status) {
    const summary = summarizeEntryPosts(existing.posts)

    if (data.status === 'PUBLISHED' && !summary.isFullyPublished) {
      return NextResponse.json(
        { success: false, error: 'No se puede marcar como publicado hasta completar todos los posts.' },
        { status: 400 }
      )
    }

    if (data.status === 'APPROVED' && (summary.totalPosts === 0 || summary.failedPosts > 0 || summary.publishingPosts > 0)) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes aprobar entradas con posts listos y sin errores.' },
        { status: 400 }
      )
    }

    if (data.status === 'READY' || data.status === 'GENERATING') {
      return NextResponse.json(
        { success: false, error: 'Ese cambio de estado solo puede hacerlo el servidor.' },
        { status: 400 }
      )
    }
  }

  const entry = await prisma.calendarEntry.update({
    where: { id },
    data,
    include: { posts: { select: { id: true, status: true, imageUrl: true, title: true, description: true, network: true, contentType: true, hashtags: true, cta: true, videoUrl: true } } },
  })

  const normalizedStatus = deriveCalendarStatus(entry.status, entry.posts)
  const normalizedEntry = normalizedStatus === entry.status
    ? entry
    : await prisma.calendarEntry.update({
        where: { id },
        data: { status: normalizedStatus },
        include: { posts: { select: { id: true, status: true, imageUrl: true, title: true, description: true, network: true, contentType: true, hashtags: true, cta: true, videoUrl: true } } },
      })

  return NextResponse.json({ success: true, entry: normalizedEntry })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.calendarEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
