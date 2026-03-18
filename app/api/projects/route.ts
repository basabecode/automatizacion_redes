import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const schema = z.object({
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2),
    description: z.string().max(500).optional(),
    industry: z.string().max(120).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    brandColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
    tone: z.string().max(120).optional(),
    audience: z.string().max(240).optional(),
  })

  try {
    const rawData = schema.parse(await req.json())
    const data = {
      ...rawData,
      description: rawData.description?.trim() || null,
      industry: rawData.industry?.trim() || null,
      logoUrl: rawData.logoUrl?.trim() || null,
      audience: rawData.audience?.trim() || null,
    }

    const project = await prisma.project.create({
      data,
      include: { _count: { select: { posts: true } } },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
