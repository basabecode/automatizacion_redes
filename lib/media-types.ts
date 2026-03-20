export const ALLOWED_IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export type AllowedImageMediaType = typeof ALLOWED_IMAGE_MEDIA_TYPES[number]
