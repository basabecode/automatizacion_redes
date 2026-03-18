import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  projectId:   z.string(),
  date:        z.string(), // ISO date string
  topic:       z.string().min(3),
  notes:       z.string().optional(),
  networks:    z.array(z.enum(['FACEBOOK','INSTAGRAM','TIKTOK'])).min(1).default(['FACEBOOK','INSTAGRAM']),
  contentType: z.enum(['IMAGE','VIDEO','CAROUSEL','STORY']).default('IMAGE'),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1)) // 1-12

  if (!projectId) return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })

  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 0, 23, 59, 59)

  const entries = await prisma.calendarEntry.findMany({
    where: { projectId, date: { gte: from, lte: to } },
    include: {
      posts: {
        select: {
          id: true, status: true, imageUrl: true, title: true,
          description: true, network: true, contentType: true,
          hashtags: true, cta: true, videoUrl: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const date = new Date(data.date)
    date.setUTCHours(0, 0, 0, 0)

    const entry = await prisma.calendarEntry.create({
      data: {
        projectId:   data.projectId,
        date,
        topic:       data.topic,
        notes:       data.notes,
        networks:    data.networks,
        contentType: data.contentType,
        status:      'PENDING',
      },
      include: { posts: true },
    })

    return NextResponse.json(entry)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
