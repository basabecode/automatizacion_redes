'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Facebook,
  ImageIcon,
  Instagram,
  Layers3,
  Loader2,
  Send,
  Sparkles,
  Video,
  Wand2,
  XCircle,
} from 'lucide-react'
import { publishPostById } from '@/lib/admin-api-client'
import { CONTENT_TYPE_OPTIONS, getNetworkColor, getNetworkLabel } from '@/lib/admin-ui'
import type { AdminNetwork } from '@/lib/admin-ui'

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

function toggleValue(values: string[], next: string) {
  return values.includes(next) ? values.filter(value => value !== next) : [...values, next]
}

function hashtagText(tags: string[]) {
  return tags.map(tag => `#${tag}`).join(' ')
}

function GenerateContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('projectId') ?? ''

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(preselectedId)
  const [topic, setTopic] = useState('')
  const [networks, setNetworks] = useState<string[]>(['FACEBOOK', 'INSTAGRAM', 'TIKTOK'])
  const [contentTypes, setContentTypes] = useState<string[]>(['IMAGE'])
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [publishing, setPublishing] = useState<Record<string, boolean>>({})
  const [published, setPublished] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/projects').then(response => response.json()).then(setProjects)
  }, [])

  const selectedProject = useMemo(
    () => projects.find(project => project.id === projectId),
    [projectId, projects]
  )

  const canGenerate = Boolean(projectId && topic.trim() && networks.length > 0 && contentTypes.length > 0)

  async function handleGenerate() {
    if (!canGenerate) return

    setGenerating(true)
    setPosts([])
    setPublished({})
    setErrors({})
    setWarnings([])

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, topic, networks, contentTypes }),
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
    setPublishing(current => ({ ...current, [postId]: true }))

    try {
      const { ok, data } = await publishPostById(postId)
      if (ok) {
        setPublished(current => ({ ...current, [postId]: true }))
      } else {
        setErrors(current => ({ ...current, [postId]: String(data.error ?? 'Error al publicar') }))
      }
    } catch {
      setErrors(current => ({ ...current, [postId]: 'Error al publicar' }))
    } finally {
      setPublishing(current => ({ ...current, [postId]: false }))
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className="rounded-[32px] border p-6 sm:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(239,248,244,0.96) 48%, rgba(248,244,255,0.88) 100%)',
            borderColor: 'rgba(12,29,22,0.08)',
            boxShadow: '0 24px 70px rgba(12,29,22,0.09)',
          }}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_320px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--text-faint)' }}>
                Flujo rápido
              </p>
              <h1
                className="font-bold leading-[0.95] mb-3"
                style={{
                  color: 'var(--text)',
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  letterSpacing: '-0.04em',
                  fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                }}
              >
                Genera contenido sin pasar por calendario.
              </h1>
              <p className="max-w-2xl text-sm sm:text-base leading-7" style={{ color: 'var(--text-muted)' }}>
                Esta vista es para producción rápida. Selecciona proyecto, redacta un brief corto y genera piezas listas para publicar desde aquí.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {[`${networks.length} redes`, `${contentTypes.length} formatos`, `${posts.length} resultados`].map(item => (
                  <span
                    key={item}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.76)', color: 'var(--text-body)' }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(12,29,22,0.08)' }}>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>Proyecto activo</p>
                {selectedProject ? (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl border" style={{ background: selectedProject.brandColor ?? '#d8efe7', borderColor: 'rgba(12,29,22,0.06)' }} />
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{selectedProject.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/{selectedProject.slug}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Selecciona un proyecto para empezar.</p>
                )}
              </div>

              <div className="rounded-2xl border p-4" style={{ background: 'rgba(200,124,0,0.08)', borderColor: 'rgba(200,124,0,0.22)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--amber)' }} />
                  <p className="text-sm leading-6" style={{ color: 'var(--text-body)' }}>
                    Este flujo omite la aprobación editorial del calendario. Úsalo para campañas urgentes o contenido ad-hoc.
                  </p>
                </div>
                <Link href="/dashboard/projects" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Ir a proyectos
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border p-5 sm:p-6 xl:sticky xl:top-6 xl:self-start" style={{ background: 'rgba(255,255,255,0.88)', borderColor: 'rgba(12,29,22,0.08)', boxShadow: '0 18px 48px rgba(12,29,22,0.07)' }}>
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-faint)' }}>Configuración</p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Brief de generación</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-body)' }}>Proyecto</label>
                <select value={projectId} onChange={event => setProjectId(event.target.value)} className="input">
                  <option value="">Selecciona un proyecto...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-body)' }}>Tema o producto</label>
                  <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{topic.trim().length}/220</span>
                </div>
                <textarea
                  value={topic}
                  onChange={event => setTopic(event.target.value.slice(0, 220))}
                  rows={5}
                  className="input resize-none"
                  placeholder="Ej: Promoción de diagnóstico gratis y soporte remoto para empresas"
                  style={{ lineHeight: 1.7 }}
                />
                <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                  Describe una sola idea central con contexto suficiente para convertirla en copy útil.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-body)' }}>Redes</label>
                <div className="grid gap-2">
                  {NETWORKS.map(({ id, label, icon: Icon }) => {
                    const active = networks.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setNetworks(current => toggleValue(current, id))}
                        className="rounded-2xl border px-4 py-3 text-left transition-all"
                        style={active ? {
                          background: `${getNetworkColor(id)}14`,
                          borderColor: `${getNetworkColor(id)}55`,
                          color: getNetworkColor(id),
                        } : {
                          background: 'rgba(255,255,255,0.76)',
                          borderColor: 'rgba(12,29,22,0.08)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: active ? `${getNetworkColor(id)}18` : 'rgba(12,29,22,0.05)' }}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{label}</span>
                            <span className="block text-[11px]" style={{ color: active ? getNetworkColor(id) : 'var(--text-faint)' }}>
                              {active ? 'Incluida en esta tanda' : 'No seleccionada'}
                            </span>
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-body)' }}>Formatos</label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {CONTENT_TYPE_OPTIONS.map(({ id, label }) => {
                    const active = contentTypes.includes(id)
                    const Icon = CONTENT_ICONS[id]
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setContentTypes(current => toggleValue(current, id))}
                        className="rounded-2xl border px-4 py-3 text-left transition-all"
                        style={active ? {
                          background: 'rgba(12,29,22,0.06)',
                          borderColor: 'rgba(12,29,22,0.24)',
                          color: 'var(--text)',
                        } : {
                          background: 'rgba(255,255,255,0.76)',
                          borderColor: 'rgba(12,29,22,0.08)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(12,29,22,0.05)' }}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-semibold">{label}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {errors.global && (
                <div className="rounded-2xl border px-4 py-3 text-sm" style={{ background: 'rgba(217,64,64,0.08)', borderColor: 'rgba(217,64,64,0.20)', color: 'var(--text-body)' }}>
                  <span style={{ color: 'var(--coral)', fontWeight: 700 }}>Error:</span> {errors.global}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--text)', color: '#fff' }}
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generando contenido...</> : <><Sparkles className="w-4 h-4" />Generar contenido</>}
              </button>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Redes activas', networks.length],
                ['Formatos activos', contentTypes.length],
                ['Resultados generados', posts.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[24px] border p-4" style={{ background: 'rgba(255,255,255,0.82)', borderColor: 'rgba(12,29,22,0.08)' }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(0,184,144,0.10)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Bricolage Grotesque, sans-serif' }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="rounded-[28px] border p-6 lg:p-7" style={{ background: 'rgba(255,255,255,0.84)', borderColor: 'rgba(12,29,22,0.08)' }}>
                <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-faint)' }}>Antes de generar</p>
                <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>Define una idea clara y una selección mínima.</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    'Usa un beneficio concreto, no una descripción genérica.',
                    'Selecciona solo las redes que realmente vas a publicar.',
                    'Elige el formato por intención: imagen, carrusel, video o story.',
                  ].map(text => (
                    <div key={text} className="rounded-2xl border p-4" style={{ background: 'rgba(244,248,246,0.9)', borderColor: 'rgba(12,29,22,0.08)' }}>
                      <p className="text-sm leading-6" style={{ color: 'var(--text-body)' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-[28px] border p-5" style={{ background: 'rgba(255,255,255,0.84)', borderColor: 'rgba(12,29,22,0.08)' }}>
                  <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-faint)' }}>Resultado</p>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                    {posts.length} pieza{posts.length !== 1 ? 's' : ''} generada{posts.length !== 1 ? 's' : ''} para revisión
                  </h2>
                  {warnings.length > 0 && (
                    <div className="mt-4 rounded-2xl border p-4" style={{ background: 'rgba(200,124,0,0.06)', borderColor: 'rgba(200,124,0,0.22)' }}>
                      <p className="font-semibold mb-2" style={{ color: 'var(--amber)' }}>Incidencias detectadas</p>
                      <ul className="space-y-1 text-sm" style={{ color: 'var(--text-body)' }}>
                        {warnings.map((warning, index) => <li key={`${warning}-${index}`}>• {warning}</li>)}
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
                                  {post.mediaUrls.slice(0, 4).map((url, index) => (
                                    <div key={`${url}-${index}`} className="rounded-[18px] overflow-hidden aspect-square" style={{ background: 'rgba(12,29,22,0.06)' }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`${post.title} ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              ) : post.imageUrl ? (
                                <div className={`rounded-[24px] overflow-hidden ${post.contentType === 'STORY' ? 'aspect-[9/16] max-h-[420px]' : 'aspect-square'}`} style={{ background: 'rgba(12,29,22,0.06)' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="rounded-[24px] aspect-square flex items-center justify-center text-sm" style={{ background: 'rgba(12,29,22,0.05)', color: 'var(--text-faint)' }}>
                                  Sin recurso visual
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] mb-1.5" style={{ color: 'var(--text-faint)' }}>Título</p>
                                <h3 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.03em' }}>
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
                                      <span key={tag} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(0,184,144,0.10)', color: 'var(--accent)' }}>
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t lg:border-t-0 lg:border-l p-5 sm:p-6 space-y-4" style={{ borderColor: 'rgba(12,29,22,0.08)', background: 'rgba(255,255,255,0.62)' }}>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--text-faint)' }}>CTA</p>
                            <div className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(12,29,22,0.05)', color: 'var(--text)' }}>
                              {post.cta || 'Sin CTA definido'}
                            </div>
                          </div>

                          <div className="rounded-2xl border p-4 text-sm leading-6" style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(12,29,22,0.08)', color: 'var(--text-body)' }}>
                            <p className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{post.title}</p>
                            <p>{post.description}</p>
                            {post.hashtags.length > 0 && <p className="mt-3" style={{ color: 'var(--accent)' }}>{hashtagText(post.hashtags)}</p>}
                          </div>

                          {post.tip && (
                            <div className="rounded-2xl border px-4 py-3 text-sm" style={{ background: 'rgba(92,53,204,0.06)', borderColor: 'rgba(92,53,204,0.16)', color: 'var(--text-body)' }}>
                              <span style={{ color: 'var(--violet)', fontWeight: 700 }}>Tip:</span> {post.tip}
                            </div>
                          )}

                          {errors[post.id] && (
                            <div className="rounded-2xl border px-4 py-3 text-sm flex items-start gap-2" style={{ background: 'rgba(217,64,64,0.07)', borderColor: 'rgba(217,64,64,0.20)', color: 'var(--text-body)' }}>
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
                              {publishing[post.id] ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</> : <><Send className="w-4 h-4" />Publicar en {getNetworkLabel(post.network)}</>}
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
