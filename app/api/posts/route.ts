import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PostStatus = z.enum(['DRAFT', 'GENERATING', 'READY', 'PUBLISHING', 'PUBLISHED', 'FAILED'])
const Network = z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK'])

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const rawStatus = searchParams.get('status')
  const rawNetwork = searchParams.get('network')

  if (rawStatus) {
    const parsed = PostStatus.safeParse(rawStatus)
    if (!parsed.success) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  if (rawNetwork) {
    const parsed = Network.safeParse(rawNetwork)
    if (!parsed.success) return NextResponse.json({ error: 'Network inválida' }, { status: 400 })
  }

  const status  = rawStatus  ? PostStatus.parse(rawStatus)  : undefined
  const network = rawNetwork ? Network.parse(rawNetwork)    : undefined

  const posts = await prisma.post.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status    ? { status }    : {}),
      ...(network   ? { network }   : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { project: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(posts)
}
