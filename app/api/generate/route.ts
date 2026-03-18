import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.options'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateSocialContent } from '@/lib/services/content.service'
import { generateImage } from '@/lib/services/image.service'
import { generateVideo } from '@/lib/services/video.service'
import { checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  projectId: z.string(),
  topic: z.string().min(5).max(500),
  networks: z.array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK'])).min(1),
  contentTypes: z.array(z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'STORY'])).min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Rate limit: 10 generaciones por hora por sesión
  const rlKey = `generate:${session.user?.email ?? 'unknown'}`
  if (!checkRateLimit(rlKey, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Límite de generaciones alcanzado. Intenta nuevamente en una hora.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { projectId, topic, networks, contentTypes } = schema.parse(body)

    // 1. Obtener proyecto
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    })

    // 2. Generar texto con Claude
    const contents = await generateSocialContent({
      topic,
      projectName: project.name,
      industry: project.industry ?? 'general',
      tone: project.tone,
      audience: project.audience ?? 'audiencia general',
      networks,
    })

    // 3. Generar imagen/video por cada red social
    const results = await Promise.allSettled(
      contents.map(async (content) => {
        let finalContentType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'STORY' = 'IMAGE'
        const isTiktok = content.network === 'TIKTOK'
        
        if (isTiktok || contentTypes.includes('VIDEO')) finalContentType = 'VIDEO'
        if (contentTypes.includes('STORY') && !isTiktok) finalContentType = 'STORY'
        if (contentTypes.includes('CAROUSEL') && !isTiktok) finalContentType = 'CAROUSEL'

        const imageSize = (finalContentType === 'STORY' || isTiktok) ? 'portrait_16_9' : 'square_hd'
        const numImages = finalContentType === 'CAROUSEL' ? 3 : 1

        const urls = await generateImage(content.imagePrompt, imageSize, numImages)
        const imageUrl = urls[0]
        const mediaUrls = finalContentType === 'CAROUSEL' ? urls : []

        let videoUrl: string | undefined
        if (finalContentType === 'VIDEO') {
          videoUrl = await generateVideo(content.imagePrompt, imageUrl)
        }

        const post = await prisma.post.create({
          data: {
            projectId: project.id,
            topic,
            title: content.title || 'Generado automáticamente',
            description: content.description || '',
            hashtags: Array.isArray(content.hashtags) ? content.hashtags : [],
            cta: content.cta || '',
            imagePrompt: content.imagePrompt,
            imageUrl,
            mediaUrls,
            videoUrl,
            contentType: finalContentType,
            network: content.network as 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK',
            status: 'READY',
          },
        })

        return { ...post, tip: content.tip }
      })
    )

    const posts = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)

    const errorsList = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason.message)

    if (posts.length === 0) {
      throw new Error('Fallaron todas las generaciones: ' + errorsList.join(', '))
    }

    return NextResponse.json({ 
      success: true, 
      posts, 
      errors: errorsList.length > 0 ? errorsList : undefined 
    })
  } catch (err) {
    console.error('[/api/generate]', err)
    // Devolver mensaje amigable; el detalle técnico queda en el log del servidor
    const isZodError = err instanceof Error && err.name === 'ZodError'
    const message = isZodError ? 'Datos de entrada inválidos.' : 'Error al generar contenido. Revisa las claves de API.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
