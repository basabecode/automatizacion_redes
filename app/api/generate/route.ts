import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateSocialContent } from '@/lib/services/content.service'
import { generateImage } from '@/lib/services/image.service'
import { generateVideo } from '@/lib/services/video.service'

const schema = z.object({
  projectId: z.string(),
  topic: z.string().min(5),
  networks: z.array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TIKTOK'])).min(1),
  contentTypes: z.array(z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'STORY'])).min(1),
})

export async function POST(req: NextRequest) {
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
    const posts = await Promise.all(
      contents.map(async (content) => {
        const wantsVideo =
          contentTypes.includes('VIDEO') && content.network === 'TIKTOK'
        const imageSize =
          content.network === 'TIKTOK' ? 'portrait_16_9' : 'square_hd'

        // Siempre generar imagen
        const imageUrl = await generateImage(content.imagePrompt, imageSize)

        // Si quiere video para TikTok → generar a partir de la imagen
        let videoUrl: string | undefined
        if (wantsVideo) {
          videoUrl = await generateVideo(content.imagePrompt, imageUrl)
        }

        // 4. Guardar en DB como DRAFT
        const post = await prisma.post.create({
          data: {
            projectId: project.id,
            topic,
            title: content.title,
            description: content.description,
            hashtags: content.hashtags,
            cta: content.cta,
            imagePrompt: content.imagePrompt,
            imageUrl,
            videoUrl,
            contentType: wantsVideo ? 'VIDEO' : 'IMAGE',
            network: content.network as 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK',
            status: 'READY',
          },
        })

        return { ...post, tip: content.tip }
      })
    )

    return NextResponse.json({ success: true, posts })
  } catch (err) {
    console.error('[/api/generate]', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
