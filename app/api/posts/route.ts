import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const network = searchParams.get('network')

  const posts = await prisma.post.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(network ? { network: network as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { project: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(posts)
}
