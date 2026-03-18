import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { deriveCalendarStatus } from '@/lib/admin-workflow'
import { decrypt } from '@/lib/encrypt'
import {
  publishToFacebook,
  publishToInstagram,
  publishToTikTok,
} from '@/lib/services/publish.service'

const schema = z.object({ postId: z.string() })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let postId: string | undefined
  try {
    const body = schema.parse(await req.json())
    postId = body.postId

    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: {
        project: true,
        socialAccount: true,
      },
    })

    // Pasamos a estado publicando para bloquear la UI rápido
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'PUBLISHING', errorMessage: null },
    })

    let result: { success: boolean; error?: string; postUrl?: string } = { success: false, error: 'Proceso de publicación cancelado.' }
    
    try {
      // 1. Resolver la cuenta social (cubrimos casos donde generate no vinculó la cuenta por ID)
      let account = post.socialAccount
      if (!account) {
        account = await prisma.socialAccount.findFirst({
          where: { projectId: post.projectId, network: post.network, active: true }
        })
        if (account) {
          // Ligar el hilo con el DB
          await prisma.post.update({ where: { id: postId }, data: { socialAccountId: account.id } })
        }
      }

      if (!account || !account.active) {
        throw new Error('No hay cuenta de red social asociada a este proyecto y red.')
      }

      // 2. Descifrar el token en el instante de publicar
      let accessToken: string
      try {
         accessToken = decrypt(account.accessToken)
      } catch {
         throw new Error('Error de seguridad al acceder al token configurado. Intenta reasociar la cuenta social.')
      }

      const fullCaption = [
        post.description,
        post.hashtags.map((h: string) => `#${h}`).join(' '),
      ].join('\n\n')

      if (post.network === 'FACEBOOK') {
        result = await publishToFacebook({
          accessToken,
          pageId:      account.accountId,
          message:     fullCaption,
          contentType: post.contentType,
          imageUrl:    post.imageUrl ?? undefined,
          videoUrl:    post.videoUrl ?? undefined,
          mediaUrls:   post.mediaUrls,
        })
      } else if (post.network === 'INSTAGRAM') {
        result = await publishToInstagram({
          accessToken,
          igAccountId: account.accountId,
          caption:     fullCaption,
          contentType: post.contentType,
          imageUrl:    post.imageUrl ?? undefined,
          mediaUrls:   post.mediaUrls,
          videoUrl:    post.videoUrl ?? undefined,
        })
      } else if (post.network === 'TIKTOK') {
        if (!post.videoUrl) throw new Error('TikTok requiere un archivo de video válido.')
        
        result = await publishToTikTok({
          accessToken,
          videoUrl:    post.videoUrl,
          title:       post.title,
          description: post.description,
        })
      } else {
        throw new Error(`Red no soportada: ${post.network}`)
      }
    } catch (innerErr) {
      result = { success: false, error: innerErr instanceof Error ? innerErr.message : 'Fallo en la conexión publicadora', postUrl: undefined }
    }

    // ── Guardar log + actualizar estado final ───────────────────────────────
    await prisma.publishLog.create({
      data: {
        postId,
        success:  result.success,
        response: result as object,
        error:    result.error,
      },
    })

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status:       result.success ? 'PUBLISHED' : 'FAILED',
        publishedAt:  result.success ? new Date() : undefined,
        publishedUrl: result.postUrl,
        errorMessage: result.error,
      },
    })

    if (updatedPost.calendarEntryId) {
      const entryWithPosts = await prisma.calendarEntry.findUnique({
        where: { id: updatedPost.calendarEntryId },
        include: {
          posts: {
            select: { status: true },
          },
        },
      })

      if (entryWithPosts) {
        const nextEntryStatus = deriveCalendarStatus(entryWithPosts.status, entryWithPosts.posts)
        if (nextEntryStatus !== entryWithPosts.status) {
          await prisma.calendarEntry.update({
            where: { id: entryWithPosts.id },
            data: { status: nextEntryStatus },
          })
        }
      }
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/publish]', err)

    // Falla catastrófica (ej. el ID de post no existe): forzar FAILED en DB
    const safeMessage = 'Error inesperado al iniciar la publicación. Intenta de nuevo.'
    if (postId) {
      const dbMessage = err instanceof Error ? err.message : safeMessage
      await prisma.post.update({ where: { id: postId }, data: { status: 'FAILED', errorMessage: dbMessage } }).catch(() => null)
    }

    return NextResponse.json({ success: false, error: safeMessage }, { status: 500 })
  }
}
