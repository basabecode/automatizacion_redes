import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const schema = z.object({
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2),
    description: z.string().optional(),
    industry: z.string().optional(),
    brandColor: z.string().optional(),
    tone: z.string().optional(),
    audience: z.string().optional(),
  })

  try {
    const data = schema.parse(await req.json())
    const project = await prisma.project.create({ data })
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
