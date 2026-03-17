'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Sparkles, Send, Loader2, CheckCircle, XCircle, Facebook, Instagram, Video } from 'lucide-react'

interface Project { id: string; name: string; slug: string; brandColor: string | null }

interface Post {
  id: string
  network: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'
  title: string
  description: string
  hashtags: string[]
  cta: string
  imageUrl: string | null
  videoUrl: string | null
  status: string
  tip?: string
}

const NETWORKS = [
  { id: 'FACEBOOK',  label: 'Facebook',  icon: Facebook  },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram },
  { id: 'TIKTOK',    label: 'TikTok',    icon: Video     },
]

const CONTENT_TYPES = [
  { id: 'IMAGE',    label: 'Imagen'   },
  { id: 'VIDEO',    label: 'Video'    },
  { id: 'CAROUSEL', label: 'Carrusel' },
  { id: 'STORY',    label: 'Story'    },
]

function NetworkIcon({ network }: { network: string }) {
  const colors: Record<string, string> = {
    FACEBOOK: '#1877F2', INSTAGRAM: '#E1306C', TIKTOK: '#000000',
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs font-medium"
      style={{ backgroundColor: colors[network] ?? '#666' }}>
      {network}
    </span>
  )
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

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function handleGenerate() {
    if (!projectId || !topic.trim() || networks.length === 0) return
    setGenerating(true)
    setPosts([])
    setPublished({})
    setErrors({})

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, topic, networks, contentTypes }),
      })
      const data = await res.json()
      if (data.success) setPosts(data.posts)
      else setErrors({ global: data.error })
    } catch {
      setErrors({ global: 'Error de conexión' })
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(postId: string) {
    setPublishing(p => ({ ...p, [postId]: true }))
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (data.success) setPublished(p => ({ ...p, [postId]: true }))
      else setErrors(e => ({ ...e, [postId]: data.error }))
    } catch {
      setErrors(e => ({ ...e, [postId]: 'Error al publicar' }))
    } finally {
      setPublishing(p => ({ ...p, [postId]: false }))
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Generar contenido</h1>

      {/* ── Formulario ── */}
      <div className="card p-6 mb-6 space-y-5">
        {/* Proyecto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Proyecto</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input">
            <option value="">Selecciona un proyecto...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tema */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tema o producto a promocionar
          </label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Ej: Descuento del 20% en reparación de computadoras este fin de semana"
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Redes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Redes sociales</label>
          <div className="flex gap-2 flex-wrap">
            {NETWORKS.map(({ id, label }) => (
              <button key={id} type="button"
                onClick={() => toggle(networks, setNetworks, id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  networks.includes(id)
                    ? 'bg-brand/10 text-brand border-brand/30'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipos de contenido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de contenido</label>
          <div className="flex gap-2 flex-wrap">
            {CONTENT_TYPES.map(({ id, label }) => (
              <button key={id} type="button"
                onClick={() => toggle(contentTypes, setContentTypes, id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  contentTypes.includes(id)
                    ? 'bg-brand/10 text-brand border-brand/30'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {errors.global && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.global}</p>
        )}

        <button onClick={handleGenerate}
          disabled={generating || !projectId || !topic.trim() || networks.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generando con IA...</>
            : <><Sparkles className="w-4 h-4" />Generar contenido</>
          }
        </button>
      </div>

      {/* ── Resultados ── */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Vista previa — {posts.length} posts listos</h2>
          {posts.map(post => (
            <div key={post.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <NetworkIcon network={post.network} />
                {published[post.id] && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />Publicado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Imagen */}
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square relative">
                    <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
                  </div>
                )}

                {/* Texto */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Título</p>
                    <p className="font-semibold text-gray-900 text-sm">{post.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Descripción</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{post.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hashtags</p>
                    <p className="text-sm text-brand">{post.hashtags.map(h => `#${h}`).join(' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">CTA</p>
                    <span className="badge bg-green-100 text-green-800">{post.cta}</span>
                  </div>
                  {post.tip && (
                    <div className="bg-amber-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-700">💡 {post.tip}</p>
                    </div>
                  )}
                </div>
              </div>

              {errors[post.id] && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />{errors[post.id]}
                </p>
              )}

              {!published[post.id] && (
                <button onClick={() => handlePublish(post.id)}
                  disabled={publishing[post.id]}
                  className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
                  {publishing[post.id]
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</>
                    : <><Send className="w-4 h-4" />Publicar en {post.network}</>
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Cargando...</div>}>
      <GenerateContent />
    </Suspense>
  )
}
