import { anthropic } from '@/lib/anthropic-client'
import type { AllowedImageMediaType } from '@/lib/media-types'

export async function analyzeReferenceImage(
  base64: string,
  mediaType: AllowedImageMediaType
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 250,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: 'Describe the visual style of this image in 2-3 sentences, focusing on: color palette, lighting quality, photography/illustration style, mood, and composition. Be specific and descriptive. Reply only with the description in English.',
        },
      ],
    }],
  })
  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
