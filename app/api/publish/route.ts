import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  publishToFacebook,
  publishToInstagram,
  publishToTikTok,
} from '@/lib/services/publish.service'

const schema = z.object({ postId: z.string() })

export async function POST(req: NextRequest) {
  try {
    const { postId } = schema.parse(await req.json())

    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: {
        project: true,
        socialAccount: true,
      },
    })

    if (!post.socialAccount) {
      return NextResponse.json(
        { success: false, error: 'No hay cuenta de red social configurada para este proyecto/red' },
        { status: 400 }
      )
    }

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'PUBLISHING' },
    })

    const fullCaption = [
      post.description,
      post.hashtags.map((h: string) => `#${h}`).join(' '),
    ].join('\n\n')

    let result

    if (post.network === 'FACEBOOK') {
      result = await publishToFacebook({
        accessToken: post.socialAccount.accessToken,
        pageId: post.socialAccount.accountId,
        message: fullCaption,
        imageUrl: post.imageUrl ?? undefined,
      })
    } else if (post.network === 'INSTAGRAM') {
      result = await publishToInstagram({
        accessToken: post.socialAccount.accessToken,
        igAccountId: post.socialAccount.accountId,
        caption: fullCaption,
        imageUrl: post.imageUrl ?? undefined,
        videoUrl: post.videoUrl ?? undefined,
      })
    } else if (post.network === 'TIKTOK') {
      if (!post.videoUrl) {
        return NextResponse.json(
          { success: false, error: 'TikTok requiere un video generado' },
          { status: 400 }
        )
      }
      result = await publishToTikTok({
        accessToken: post.socialAccount.accessToken,
        videoUrl: post.videoUrl,
        title: post.title,
        description: post.description,
      })
    } else {
      throw new Error(`Red no soportada: ${post.network}`)
    }

    // Guardar log + actualizar estado
    await prisma.publishLog.create({
      data: {
        postId,
        success: result.success,
        response: result as object,
        error: result.error,
      },
    })

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: result.success ? 'PUBLISHED' : 'FAILED',
        publishedAt: result.success ? new Date() : undefined,
        publishedUrl: result.postUrl,
        errorMessage: result.error,
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/publish]', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
