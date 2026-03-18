import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  industry:    z.string().max(120).optional(),
  brandColor:  z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  tone:        z.string().max(120).optional(),
  audience:    z.string().max(240).optional(),
  description: z.string().max(500).optional(),
  logoUrl:     z.string().url().optional().or(z.literal('')),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const project = await prisma.project.findFirst({
      where: { id, active: true },
      include: { _count: { select: { posts: true } } },
    })

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al consultar proyecto'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.parse(body)
    const data = {
      ...parsed,
      description: parsed.description === undefined ? undefined : parsed.description.trim() || null,
      industry: parsed.industry === undefined ? undefined : parsed.industry.trim() || null,
      audience: parsed.audience === undefined ? undefined : parsed.audience.trim() || null,
      logoUrl: parsed.logoUrl === undefined ? undefined : parsed.logoUrl.trim() || null,
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: { _count: { select: { posts: true } } },
    })

    return NextResponse.json({ success: true, project: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.project.update({
      where: { id },
      data: { active: false },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
