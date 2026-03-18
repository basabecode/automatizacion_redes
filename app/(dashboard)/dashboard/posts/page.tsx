'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { WorkflowPostStatus } from '@/lib/admin-workflow'
import { CheckCircle, XCircle, Clock, Loader2, Trash2, Send, Edit2, X } from 'lucide-react'
import { publishPostById } from '@/lib/admin-api-client'
import { getNetworkLabel, POST_STATUS_LABELS } from '@/lib/admin-ui'
import { PostPreviewSimulator } from '@/components/admin/post-preview-simulator'

interface Project { id: string; name: string; slug: string }

interface Post {
  id: string
  network: string
  title: string
  description: string
  imageUrl: string | null
  mediaUrls: string[]
  videoUrl: string | null
  hashtags: string[]
  cta: string
  contentType: string
  status: WorkflowPostStatus
  createdAt: string
  publishedAt: string | null
  project: { name: string; slug: string }
  errorMessage?: string
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  DRAFT:      { label: POST_STATUS_LABELS.DRAFT,      class: 'bg-gray-100 text-gray-600',     icon: Clock       },
  READY:      { label: POST_STATUS_LABELS.READY,      class: 'bg-blue-100 text-blue-700',     icon: Clock       },
  PUBLISHING: { label: POST_STATUS_LABELS.PUBLISHING, class: 'bg-yellow-100 text-yellow-700', icon: Loader2     },
  PUBLISHED:  { label: POST_STATUS_LABELS.PUBLISHED,  class: 'bg-green-100 text-green-700',   icon: CheckCircle },
  FAILED:     { label: POST_STATUS_LABELS.FAILED,     class: 'bg-red-100 text-red-600',       icon: XCircle     },
}

export default function PostsPage() {
  const [posts, setPosts]         = useState<Post[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)

  // Filtros
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterNetwork, setFilterNetwork] = useState('')

  // Modal de edición
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editForm, setEditForm]       = useState({ title: '', description: '' })
  const [savingEdit, setSavingEdit]   = useState(false)
  const [previewingPost, setPreviewingPost] = useState<Post | null>(null)

  // Cargar proyectos para el selector de filtros
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  // Cargar posts cuando cambian los filtros
  useEffect(() => { fetchPosts() }, [filterProject, filterStatus, filterNetwork])

  function fetchPosts() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterProject) params.set('projectId', filterProject)
    if (filterStatus)  params.set('status',    filterStatus)
    if (filterNetwork) params.set('network',   filterNetwork)
    const qs = params.toString()
    fetch(`/api/posts${qs ? '?' + qs : ''}`)
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setLoading(false))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro de que deseas eliminar este post?')) return
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok || !data.success) {
      alert('Error al eliminar el post: ' + (data.error ?? 'Error desconocido'))
      return
    }
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  async function handleRetry(post: Post) {
    setPublishing(post.id)
    try {
      const { ok, data } = await publishPostById(post.id)
      if (ok) {
        fetchPosts()
      } else {
        alert('Error: ' + (data.error || 'Desconocido'))
        fetchPosts()
      }
    } catch {
      alert('Error de conexión')
      fetchPosts()
    }
    setPublishing(null)
  }

  async function handlePublish(post: Post) {
    setPublishing(post.id)
    try {
      const { ok, data } = await publishPostById(post.id)
      if (ok) {
        fetchPosts()
      } else {
        alert('Error: ' + (data.error || 'Desconocido'))
        fetchPosts()
      }
    } catch {
      alert('Error de conexión')
      fetchPosts()
    } finally {
      setPublishing(null)
    }
  }

  function openEdit(post: Post) {
    setEditingPost(post)
    setEditForm({ title: post.title, description: post.description })
  }

  async function saveEdit() {
    if (!editingPost) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === editingPost.id
          ? { ...p, title: editForm.title, description: editForm.description }
          : p
        ))
        setEditingPost(null)
      } else {
        alert('Error al guardar: ' + data.error)
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const hasFilters = filterProject || filterStatus || filterNetwork

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Historial de posts</h1>
        {hasFilters && (
          <button
            onClick={() => { setFilterProject(''); setFilterStatus(''); setFilterNetwork('') }}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Proyecto */}
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="input w-full sm:w-auto"
          style={{ minWidth: '160px', paddingTop: '6px', paddingBottom: '6px' }}
        >
          <option value="">Todos los proyectos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-full sm:w-auto"
          style={{ minWidth: '140px', paddingTop: '6px', paddingBottom: '6px' }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {/* Red social */}
        <select
          value={filterNetwork}
          onChange={e => setFilterNetwork(e.target.value)}
          className="input w-full sm:w-auto"
          style={{ minWidth: '140px', paddingTop: '6px', paddingBottom: '6px' }}
        >
          <option value="">Todas las redes</option>
          {(['FACEBOOK', 'INSTAGRAM', 'TIKTOK'] as const).map((val) => (
            <option key={val} value={val}>{getNetworkLabel(val)}</option>
          ))}
        </select>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse flex gap-4 h-24" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: 'var(--text-faint)' }}>
          {hasFilters ? 'No hay posts con esos filtros.' : 'No hay posts todavía.'}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
            const Icon = cfg.icon
            const isPublishing = publishing === post.id

            return (
              <div key={post.id} className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPreviewingPost(post)}
                  className="flex flex-1 items-center gap-4 text-left rounded-xl transition-transform"
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {post.imageUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: 'var(--bg-alt)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{post.title}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {post.project.name} · {getNetworkLabel(post.network)}
                    </p>
                    {post.status === 'FAILED' && post.errorMessage && (
                      <p className="text-xs truncate mt-1" style={{ color: 'var(--coral)' }}>
                        Error: {post.errorMessage}
                      </p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>
                      Click para abrir simulador completo
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-3">
                  <span className={`badge flex items-center gap-1 ${cfg.class}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>

                  {post.status !== 'PUBLISHING' && post.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => openEdit(post)}
                      className="p-1.5 transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      title="Editar post"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {(post.status === 'READY' || post.status === 'FAILED') && (
                    <button
                      onClick={() => post.status === 'READY' ? handlePublish(post) : handleRetry(post)}
                      disabled={isPublishing}
                      className="p-1.5 transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      title={post.status === 'READY' ? 'Publicar post' : 'Reintentar publicación'}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                    >
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 transition-colors"
                    style={{ color: 'var(--text-faint)' }}
                    title="Eliminar post"
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de edición */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Editar Post</h2>
              <button
                onClick={() => setEditingPost(null)}
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>Título</label>
                <input
                  className="input"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>Descripción</label>
                <textarea
                  className="input min-h-[100px]"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button onClick={() => setEditingPost(null)} className="btn-secondary">Cancelar</button>
              <button onClick={saveEdit} disabled={savingEdit} className="btn-primary flex items-center justify-center gap-2">
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {previewingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(12,29,22,0.58)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPreviewingPost(null) }}
        >
          <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-[30px] border flex flex-col" style={{ background: 'linear-gradient(180deg, #f7fbf9 0%, #edf5f1 100%)', borderColor: 'rgba(12,29,22,0.08)' }}>
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(12,29,22,0.08)' }}>
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>Simulador</p>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  Vista previa de publicación
                </h2>
              </div>
              <button
                onClick={() => setPreviewingPost(null)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-faint)', background: 'rgba(255,255,255,0.65)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <PostPreviewSimulator
                post={previewingPost}
                initialNetwork={
                  previewingPost.network === 'INSTAGRAM'
                    ? 'INSTAGRAM'
                    : previewingPost.network === 'TIKTOK'
                      ? 'TIKTOK'
                      : 'FACEBOOK'
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
