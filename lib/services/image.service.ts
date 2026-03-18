import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export type ImageSize = 'square_hd' | 'portrait_4_3' | 'portrait_16_9'

export async function generateImage(
  prompt: string,
  size: ImageSize = 'square_hd',
  numImages: number = 1
): Promise<string[]> {
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt,
      image_size: size,
      num_inference_steps: 4,
      num_images: numImages,
    },
  }) as { data: { images: Array<{ url: string }> } }

  return result.data.images.map((img) => img.url)
}

export async function generateImagePro(
  prompt: string,
  size: ImageSize = 'square_hd'
): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
    input: {
      prompt,
      image_size: size,
      num_images: 1,
    },
  }) as { data: { images: Array<{ url: string }> } }

  return result.data.images[0].url
}
