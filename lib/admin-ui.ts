import type { WorkflowCalendarStatus, WorkflowPostStatus } from '@/lib/admin-workflow'

export type AdminNetwork = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'
export type AdminContentType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'STORY'

export const NETWORK_LABELS: Record<AdminNetwork, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
}

export const NETWORK_COLORS: Record<AdminNetwork, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TIKTOK: '#000000',
}

export const CONTENT_TYPE_OPTIONS: Array<{ id: AdminContentType; label: string }> = [
  { id: 'IMAGE', label: 'Imagen' },
  { id: 'VIDEO', label: 'Video' },
  { id: 'CAROUSEL', label: 'Carrusel' },
  { id: 'STORY', label: 'Story' },
]

export const POST_STATUS_LABELS: Record<WorkflowPostStatus, string> = {
  DRAFT: 'Borrador',
  GENERATING: 'Generando',
  READY: 'Listo',
  PUBLISHING: 'Publicando',
  PUBLISHED: 'Publicado',
  FAILED: 'Fallido',
}

export const CALENDAR_STATUS_LABELS: Record<WorkflowCalendarStatus, string> = {
  PENDING: 'Pendiente',
  GENERATING: 'Generando…',
  READY: 'Listo',
  APPROVED: 'Aprobado',
  PUBLISHED: 'Publicado',
  NEEDS_EDIT: 'Requiere edición',
}

export function getNetworkLabel(network: string) {
  return NETWORK_LABELS[network as AdminNetwork] ?? network
}

export function getNetworkColor(network: string, fallback = '#666') {
  return NETWORK_COLORS[network as AdminNetwork] ?? fallback
}
