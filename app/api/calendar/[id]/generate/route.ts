import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { prisma } from '@/lib/prisma'
import { canRegenerateEntry, deriveCalendarStatus } from '@/lib/admin-workflow'
import { generateSocialContent } from '@/lib/services/content.service'
import { generateImage } from '@/lib/services/image.service'
import { generateVideo } from '@/lib/services/video.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const entry = await prisma.calendarEntry.findUniqueOrThrow({
    where: { id },
    include: {
      project: true,
      posts: {
        select: { id: true, status: true },
      },
    },
  })

  if (!canRegenerateEntry(entry.status, entry.posts)) {
    return NextResponse.json(
      { error: 'No se puede regenerar mientras haya publicaciones en curso o contenido ya publicado.' },
      { status: 409 }
    )
  }

  // Mark as generating
  await prisma.calendarEntry.update({
    where: { id },
    data: { status: 'GENERATING' },
  })

  try {
    const { project, topic, networks, contentType } = entry

    if (entry.posts.length > 0) {
      await prisma.post.deleteMany({
        where: {
          calendarEntryId: id,
          status: { in: ['DRAFT', 'READY', 'FAILED'] },
        },
      })
    }

    // 1. Generate copy for each network
    const contents = await generateSocialContent({
      topic,
      projectName: project.name,
      industry:    project.industry ?? 'general',
      tone:        project.tone,
      audience:    project.audience ?? 'audiencia general',
      networks:    networks as ('FACEBOOK'|'INSTAGRAM'|'TIKTOK')[],
    })

    // 2. Generate image/video per network
    const results = await Promise.allSettled(
      contents.map(async (content) => {
        let finalType = contentType as 'IMAGE'|'VIDEO'|'CAROUSEL'|'STORY'
        const isTiktok = content.network === 'TIKTOK'
        if (isTiktok) finalType = 'VIDEO'

        const imageSize = (finalType === 'STORY' || isTiktok) ? 'portrait_16_9' : 'square_hd'
        const numImages = finalType === 'CAROUSEL' ? 3 : 1

        const urls     = await generateImage(content.imagePrompt, imageSize, numImages)
        const imageUrl = urls[0]
        const mediaUrls = finalType === 'CAROUSEL' ? urls : []

        let videoUrl: string | undefined
        if (finalType === 'VIDEO') {
          videoUrl = await generateVideo(content.imagePrompt, imageUrl)
        }

        return prisma.post.create({
          data: {
            projectId:       project.id,
            calendarEntryId: id,
            topic,
            title:           content.title || 'Generado automáticamente',
            description:     content.description || '',
            hashtags:        Array.isArray(content.hashtags) ? content.hashtags : [],
            cta:             content.cta || '',
            imagePrompt:     content.imagePrompt,
            imageUrl,
            mediaUrls,
            videoUrl,
            contentType:     finalType,
            network:         content.network as 'FACEBOOK'|'INSTAGRAM'|'TIKTOK',
            status:          'READY',
          },
        })
      })
    )

    const posts = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason instanceof Error ? r.reason.message : 'Error desconocido durante la generacion')

    if (posts.length === 0) {
      throw new Error('Fallaron todas las generaciones: ' + errors.join(', '))
    }

    const nextStatus = errors.length > 0
      ? 'NEEDS_EDIT'
      : deriveCalendarStatus('READY', posts)

    await prisma.calendarEntry.update({
      where: { id },
      data:  { status: nextStatus },
    })

    return NextResponse.json({
      success: true,
      posts,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/calendar/generate]', msg, err)
    // Revert status silently — don't let a failed update hide the real error
    try {
      await prisma.calendarEntry.update({ where: { id }, data: { status: 'PENDING' } })
    } catch {}
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
