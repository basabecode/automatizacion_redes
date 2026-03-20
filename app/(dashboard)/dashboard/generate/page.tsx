'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle,
  Facebook,
  ImageIcon,
  Instagram,
  Layers3,
  Loader2,
  Send,
  Sparkles,
  Upload,
  Video,
  Wand2,
  X,
  XCircle,
} from 'lucide-react'
import { publishPostById } from '@/lib/admin-api-client'
import { CONTENT_TYPE_OPTIONS, getNetworkColor, getNetworkLabel } from '@/lib/admin-ui'
import type { AdminNetwork } from '@/lib/admin-ui'
import { ALLOWED_IMAGE_MEDIA_TYPES } from '@/lib/media-types'

interface Project {
  id: string
  name: string
  slug: string
  brandColor: string | null
}

interface Post {
  id: string
  network: AdminNetwork
  contentType: string
  title: string
  description: string
  hashtags: string[]
  cta: string
  imageUrl: string | null
  mediaUrls: string[]
  videoUrl: string | null
  status: string
  tip?: string
}

interface ReferenceImage {
  dataUrl: string
  mediaType: string
}

const NETWORKS = [
  { id: 'FACEBOOK' as const, label: getNetworkLabel('FACEBOOK'), icon: Facebook },
  { id: 'INSTAGRAM' as const, label: getNetworkLabel('INSTAGRAM'), icon: Instagram },
  { id: 'TIKTOK' as const, label: getNetworkLabel('TIKTOK'), icon: Video },
]

const CONTENT_ICONS = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  CAROUSEL: Layers3,
  STORY: Wand2,
} as const

const STYLE_PRESETS = [
  { id: 'photo', label: 'Fotográfico', hint: 'realistic photographic style, high definition, professional photography' },
  { id: 'editorial', label: 'Editorial', hint: 'clean editorial magazine style, elegant and refined' },
  { id: 'cinematic', label: 'Cinemático', hint: 'cinematic style, dramatic lighting, rich saturated colors, film-like' },
  { id: 'illustration', label: 'Ilustración', hint: 'digital illustration, vibrant flat colors, modern vector design' },
  { id: 'minimal', label: 'Minimalista', hint: 'minimalist, clean white background, product-focused, studio lighting' },
  { id: '3d', label: '3D / CGI', hint: 'high quality 3D render, photorealistic CGI, studio quality' },
]

function toggleValue(values: string[], next: string) {
  return values.includes(next) ? values.filter(value => value !== next) : [...values, next]
}

function hashtagText(tags: string[]) {
  return tags.map(tag => `#${tag}`).join(' ')
}

function GenerateContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [networks, setNetworks] = useState<string[]>(['FACEBOOK', 'INSTAGRAM'])
  const [contentTypes, setContentTypes] = useState<string[]>(['IMAGE'])
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null)
  const [stylePreset, setStylePreset] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [publishing, setPublishing] = useState<Record<string, boolean>>({})
  const [published, setPublished] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  const selectedProject = useMemo(
    () => projects.find(p => p.id === projectId),
    [projectId, projects]
  )

  const canGenerate = Boolean(projectId && topic.trim() && networks.length > 0 && contentTypes.length > 0)

  const processFile = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_MEDIA_TYPES.includes(file.type as typeof ALLOWED_IMAGE_MEDIA_TYPES[number])) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImage({
        dataUrl: e.target?.result as string,
        mediaType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  async function handleGenerate() {
    if (!canGenerate) return

    setGenerating(true)
    setPosts([])
    setPublished({})
    setErrors({})
    setWarnings([])

    try {
      const body: Record<string, unknown> = { projectId, topic, networks, contentTypes }
      if (referenceImage) {
        body.referenceImageBase64 = referenceImage.dataUrl.split(',')[1]
        body.referenceImageMediaType = referenceImage.mediaType
      }
      if (stylePreset) {
        const preset = STYLE_PRESETS.find(p => p.id === stylePreset)
        if (preset) body.styleHint = preset.hint
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
        if (Array.isArray(data.errors) && data.errors.length > 0) setWarnings(data.errors)
      } else {
        setErrors({ global: data.error ?? 'No se pudo generar el contenido' })
      }
    } catch {
      setErrors({ global: 'Error de conexión' })
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(postId: string) {
    setPublishing(c => ({ ...c, [postId]: true }))
    try {
      const { ok, data } = await publishPostById(postId)
      if (ok) {
        setPublished(c => ({ ...c, [postId]: true }))
      } else {
        setErrors(c => ({ ...c, [postId]: String(data.error ?? 'Error al publicar') }))
      }
    } catch {
      setErrors(c => ({ ...c, [postId]: 'Error al publicar' }))
    } finally {
      setPublishing(c => ({ ...c, [postId]: false }))
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Page header — compact */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--text-faint)' }}>
            Generador rápido
          </p>
          <h1
            className="font-bold leading-[1.05]"
            style={{
              color: 'var(--text)',
              fontFamily: 'Bricolage Grotesque, sans-serif',
              letterSpacing: '-0.035em',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            }}
          >
            Crea y publica sin pasar por calendario.
          </h1>
        </div>

        {/* ── HORIZONTAL FORM ──────────────────────────────────────────── */}
        <div
          className="rounded-[24px] border p-5"
          style={{
            background: 'rgba(255,255,255,0.92)',
            borderColor: 'rgba(12,29,22,0.08)',
            boxShadow: '0 8px 32px rgba(12,29,22,0.06)',
          }}
        >
          {/* Row 1: main controls */}
          <div className="flex flex-wrap gap-4 items-end">

            {/* Proyecto */}
            <div className="flex-shrink-0 w-44">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Proyecto
              </label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                <option value="">Seleccionar...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {selectedProject && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedProject.brandColor ?? 'var(--accent)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>/{selectedProject.slug}</span>
                </div>
              )}
            </div>

            {/* Tema — crece */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>
                  Tema o producto
                </label>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{topic.trim().length}/220</span>
              </div>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value.slice(0, 220))}
                rows={2}
                className="input resize-none"
                placeholder="Ej: Promoción de diagnóstico gratis y soporte remoto para empresas"
                style={{ lineHeight: 1.6 }}
              />
            </div>

            {/* Redes — compact pills */}
            <div className="flex-shrink-0">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Redes
              </label>
              <div className="flex gap-1.5">
                {NETWORKS.map(({ id, label, icon: Icon }) => {
                  const active = networks.includes(id)
                  const color = getNetworkColor(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setNetworks(c => toggleValue(c, id))}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
                      style={active ? {
                        background: `${color}14`,
                        borderColor: `${color}55`,
                        color,
                      } : {
                        background: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(12,29,22,0.10)',
                        color: 'var(--text-faint)',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Formatos — compact pills */}
            <div className="flex-shrink-0">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Formato
              </label>
              <div className="flex gap-1.5">
                {CONTENT_TYPE_OPTIONS.map(({ id, label }) => {
                  const active = contentTypes.includes(id)
                  const Icon = CONTENT_ICONS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setContentTypes(c => toggleValue(c, id))}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all"
                      style={active ? {
                        background: 'rgba(12,29,22,0.08)',
                        borderColor: 'rgba(12,29,22,0.28)',
                        color: 'var(--text)',
                      } : {
                        background: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(12,29,22,0.10)',
                        color: 'var(--text-faint)',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Generar — alineado al fondo */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="flex-shrink-0 rounded-xl px-5 py-[0.6rem] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ background: 'var(--text)', color: '#fff', whiteSpace: 'nowrap' }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
                : <><Sparkles className="w-4 h-4" />Generar contenido</>
              }
            </button>
          </div>

          {/* Divider */}
          <div className="my-4" style={{ borderTop: '1px solid rgba(12,29,22,0.07)' }} />

          {/* Row 2: secondary controls */}
          <div className="flex flex-wrap items-center gap-4">

            {/* Imagen de referencia — inline compact */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>
                Referencia visual
              </span>
              {referenceImage ? (
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(12,29,22,0.10)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={referenceImage.dataUrl} alt="Referencia" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>IA analiza estilo</span>
                  <button
                    type="button"
                    onClick={() => setReferenceImage(null)}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(12,29,22,0.10)', color: 'var(--text-muted)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={isDragging ? {
                    borderColor: 'var(--accent)',
                    background: 'rgba(0,184,144,0.06)',
                    color: 'var(--accent)',
                  } : {
                    borderStyle: 'dashed',
                    borderColor: 'rgba(12,29,22,0.20)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Agregar imagen
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Separador vertical */}
            <div className="hidden sm:block w-px h-5" style={{ background: 'rgba(12,29,22,0.10)' }} />

            {/* Estilo visual */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>
                Estilo
              </span>
              {STYLE_PRESETS.map(preset => {
                const active = stylePreset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setStylePreset(active ? '' : preset.id)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                    style={active ? {
                      background: 'var(--text)',
                      color: '#fff',
                    } : {
                      background: 'rgba(12,29,22,0.05)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Error global */}
            {errors.global && (
              <div className="ml-auto text-xs font-medium" style={{ color: 'var(--coral)' }}>
                {errors.global}
              </div>
            )}
          </div>
        </div>

        {/* ── RESULTS AREA ─────────────────────────────── */}
        <section className="space-y-5">

            {posts.length === 0 ? (
              <div
                className="rounded-[28px] border p-6 lg:p-8"
                style={{ background: 'rgba(255,255,255,0.84)', borderColor: 'rgba(12,29,22,0.08)' }}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-faint)' }}>
                  Antes de generar
                </p>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
                  Define una idea clara y una selección mínima.
                </h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ['Brief claro', 'Usa un beneficio concreto, no una descripción genérica.'],
                    ['Imagen de referencia', 'Sube una imagen y la IA creará visuales en el mismo estilo o complementarios.'],
                    ['Estilo visual', 'Selecciona un preset de estilo o deja que Claude decida según el contexto del proyecto.'],
                  ].map(([title, text]) => (
                    <div
                      key={title}
                      className="rounded-2xl border p-4"
                      style={{ background: 'rgba(244,248,246,0.9)', borderColor: 'rgba(12,29,22,0.08)' }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{title}</p>
                      <p className="text-sm leading-6" style={{ color: 'var(--text-body)' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div
                  className="rounded-[28px] border p-5"
                  style={{ background: 'rgba(255,255,255,0.84)', borderColor: 'rgba(12,29,22,0.08)' }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-faint)' }}>Resultado</p>
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                        {posts.length} pieza{posts.length !== 1 ? 's' : ''} lista{posts.length !== 1 ? 's' : ''} para revisión
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(0,184,144,0.10)', color: 'var(--accent)' }}>
                        {networks.length} redes
                      </span>
                      <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(12,29,22,0.06)', color: 'var(--text-body)' }}>
                        {contentTypes.length} formato{contentTypes.length !== 1 ? 's' : ''}
                      </span>
                      {referenceImage && (
                        <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(92,53,204,0.08)', color: 'var(--violet)' }}>
                          Con referencia visual
                        </span>
                      )}
                    </div>
                  </div>

                  {warnings.length > 0 && (
                    <div
                      className="mt-4 rounded-2xl border p-4"
                      style={{ background: 'rgba(200,124,0,0.06)', borderColor: 'rgba(200,124,0,0.22)' }}
                    >
                      <p className="font-semibold mb-2 text-sm" style={{ color: 'var(--amber)' }}>Incidencias detectadas</p>
                      <ul className="space-y-1 text-sm" style={{ color: 'var(--text-body)' }}>
                        {warnings.map((w, i) => <li key={`${w}-${i}`}>• {w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {posts.map(post => {
                  const networkColor = getNetworkColor(post.network)
                  const FormatIcon = CONTENT_ICONS[post.contentType as keyof typeof CONTENT_ICONS] ?? ImageIcon
                  const isPublished = Boolean(published[post.id])

                  return (
                    <article
                      key={post.id}
                      className="rounded-[30px] border overflow-hidden"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(243,247,245,0.95) 100%)',
                        borderColor: 'rgba(12,29,22,0.08)',
                        boxShadow: '0 18px 56px rgba(12,29,22,0.08)',
                      }}
                    >
                      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: `${networkColor}16`, color: networkColor }}>
                              {getNetworkLabel(post.network)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(12,29,22,0.06)', color: 'var(--text-body)' }}>
                              <FormatIcon className="w-3.5 h-3.5" />
                              {post.contentType}
                            </span>
                            {isPublished && (
                              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(0,184,144,0.12)', color: '#007A60' }}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Publicado
                              </span>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div>
                              {post.contentType === 'VIDEO' && post.videoUrl ? (
                                <video src={post.videoUrl} controls className="w-full rounded-[22px] aspect-video bg-black" />
                              ) : post.contentType === 'CAROUSEL' && post.mediaUrls?.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {post.mediaUrls.slice(0, 4).map((url, idx) => (
                                    <div key={`${url}-${idx}`} className="rounded-[18px] overflow-hidden aspect-square" style={{ background: 'rgba(12,29,22,0.06)' }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`${post.title} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              ) : post.imageUrl ? (
                                <div
                                  className={`rounded-[24px] overflow-hidden ${post.contentType === 'STORY' ? 'aspect-[9/16] max-h-[420px]' : 'aspect-square'}`}
                                  style={{ background: 'rgba(12,29,22,0.06)' }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div
                                  className="rounded-[24px] aspect-square flex items-center justify-center text-sm"
                                  style={{ background: 'rgba(12,29,22,0.05)', color: 'var(--text-faint)' }}
                                >
                                  Sin recurso visual
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] mb-1.5" style={{ color: 'var(--text-faint)' }}>Título</p>
                                <h3
                                  className="text-xl font-bold leading-tight"
                                  style={{ color: 'var(--text)', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.03em' }}
                                >
                                  {post.title}
                                </h3>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] mb-1.5" style={{ color: 'var(--text-faint)' }}>Descripción</p>
                                <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--text-body)' }}>{post.description}</p>
                              </div>
                              {post.hashtags.length > 0 && (
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-faint)' }}>Hashtags</p>
                                  <div className="flex flex-wrap gap-2">
                                    {post.hashtags.map(tag => (
                                      <span
                                        key={tag}
                                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                                        style={{ background: 'rgba(0,184,144,0.10)', color: 'var(--accent)' }}
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className="border-t lg:border-t-0 lg:border-l p-5 sm:p-6 space-y-4"
                          style={{ borderColor: 'rgba(12,29,22,0.08)', background: 'rgba(255,255,255,0.62)' }}
                        >
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-faint)' }}>CTA</p>
                            <div
                              className="rounded-2xl px-4 py-3 text-sm font-semibold"
                              style={{ background: 'rgba(12,29,22,0.05)', color: 'var(--text)' }}
                            >
                              {post.cta || 'Sin CTA definido'}
                            </div>
                          </div>

                          <div
                            className="rounded-2xl border p-4 text-sm leading-6"
                            style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(12,29,22,0.08)', color: 'var(--text-body)' }}
                          >
                            <p className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{post.title}</p>
                            <p>{post.description}</p>
                            {post.hashtags.length > 0 && (
                              <p className="mt-3" style={{ color: 'var(--accent)' }}>{hashtagText(post.hashtags)}</p>
                            )}
                          </div>

                          {post.tip && (
                            <div
                              className="rounded-2xl border px-4 py-3 text-sm"
                              style={{ background: 'rgba(92,53,204,0.06)', borderColor: 'rgba(92,53,204,0.16)', color: 'var(--text-body)' }}
                            >
                              <span style={{ color: 'var(--violet)', fontWeight: 700 }}>Tip:</span> {post.tip}
                            </div>
                          )}

                          {errors[post.id] && (
                            <div
                              className="rounded-2xl border px-4 py-3 text-sm flex items-start gap-2"
                              style={{ background: 'rgba(217,64,64,0.07)', borderColor: 'rgba(217,64,64,0.20)', color: 'var(--text-body)' }}
                            >
                              <XCircle className="w-4 h-4 mt-0.5" style={{ color: 'var(--coral)' }} />
                              <span>{errors[post.id]}</span>
                            </div>
                          )}

                          {!isPublished && (
                            <button
                              onClick={() => handlePublish(post.id)}
                              disabled={publishing[post.id]}
                              className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: networkColor, color: '#fff' }}
                            >
                              {publishing[post.id]
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</>
                                : <><Send className="w-4 h-4" />Publicar en {getNetworkLabel(post.network)}</>
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </>
            )}
        </section>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8" style={{ color: 'var(--text-muted)' }}>Cargando...</div>}>
      <GenerateContent />
    </Suspense>
  )
}
