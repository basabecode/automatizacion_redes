import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export async function generateVideo(
  prompt: string,
  imageUrl?: string
): Promise<string> {
  // Si hay imagen base → image-to-video (mejor calidad)
  if (imageUrl) {
    const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/image-to-video', {
      input: {
        prompt,
        image_url: imageUrl,
        duration: '5',
        aspect_ratio: '9:16',
      },
    }) as { data: { video: { url: string } } }

    return result.data.video.url
  }

  // Sin imagen → text-to-video
  const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/text-to-video', {
    input: {
      prompt,
      duration: '5',
      aspect_ratio: '9:16',
    },
  }) as { data: { video: { url: string } } }

  return result.data.video.url
}
