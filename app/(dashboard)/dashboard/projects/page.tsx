'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Loader2, X, Calendar } from 'lucide-react'

interface Project {
  id: string; slug: string; name: string
  description: string | null
  logoUrl: string | null
  industry: string | null; brandColor: string | null
  tone: string; audience: string | null
  _count: { posts: number }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const emptyForm = {
    slug: '',
    name: '',
    description: '',
    logoUrl: '',
    industry: '',
    brandColor: '#6366f1',
    tone: 'cercano y casual',
    audience: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({
    slug: '',
    name: '',
    description: '',
    logoUrl: '',
    industry: '',
    brandColor: '',
    tone: '',
    audience: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const p = await res.json()
      if (!res.ok) {
        alert('Error al crear proyecto: ' + (p.error ?? 'Error desconocido'))
        return
      }
      setProjects(prev => [...prev, p])
      setShowForm(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  function openEdit(p: Project) {
    setEditingProject(p)
    setEditForm({
      slug: p.slug,
      name: p.name,
      description: p.description ?? '',
      logoUrl: p.logoUrl ?? '',
      industry: p.industry ?? '',
      brandColor: p.brandColor ?? '#6366f1',
      tone: p.tone,
      audience: p.audience ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editingProject) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success) {
        setProjects(prev => prev.map(p => p.id === editingProject.id ? data.project : p))
        setEditingProject(null)
      } else {
        alert('Error al actualizar proyecto: ' + (data.error ?? 'Error desconocido'))
      }
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Archivar este proyecto? Se ocultará del panel, pero su historial seguirá en la base de datos.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert('Error al eliminar el proyecto: ' + (data.error ?? 'Error desconocido'))
        return
      }
      setProjects(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Proyectos</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Crear proyecto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="SomosTécnicos" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (único, sin espacios)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="somostecnicos" className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Qué hace el proyecto, cómo se posiciona o qué ofrece..." className="input min-h-[88px]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="tecnología, barbería, salud..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de marca</label>
              <div className="flex gap-2">
                <input type="color" value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))} className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer" />
                <input value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))} className="input flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tono de comunicación</label>
              <select value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} className="input">
                <option>cercano y casual</option>
                <option>profesional</option>
                <option>urgente y persuasivo</option>
                <option>educativo</option>
                <option>inspiracional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audiencia objetivo</label>
              <input value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="jóvenes 18-35 interesados en..." className="input" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !form.slug || !form.name} className="btn-primary">
              {saving ? 'Guardando...' : 'Crear proyecto'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: p.brandColor ?? '#6366f1' }}>
                {p.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400">{p.industry} · {p.audience ?? 'Sin audiencia definida'}</p>
                {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <span className="text-xs text-gray-400">{p._count.posts} posts</span>
              <Link href={`/dashboard/projects/${p.id}`} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                <Calendar className="w-3.5 h-3.5" />Calendario
              </Link>
              <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Editar">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50" title="Archivar">
                {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {editingProject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Editar proyecto</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="input" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="input min-h-[88px]" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input value={editForm.logoUrl} onChange={e => setEditForm(f => ({ ...f, logoUrl: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
                <input value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color de marca</label>
                <div className="flex gap-2">
                  <input type="color" value={editForm.brandColor} onChange={e => setEditForm(f => ({ ...f, brandColor: e.target.value }))} className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer" />
                  <input value={editForm.brandColor} onChange={e => setEditForm(f => ({ ...f, brandColor: e.target.value }))} className="input flex-1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
                <select value={editForm.tone} onChange={e => setEditForm(f => ({ ...f, tone: e.target.value }))} className="input">
                  <option>cercano y casual</option>
                  <option>profesional</option>
                  <option>urgente y persuasivo</option>
                  <option>educativo</option>
                  <option>inspiracional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audiencia</label>
                <input value={editForm.audience} onChange={e => setEditForm(f => ({ ...f, audience: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditingProject(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={savingEdit || !editForm.name || !editForm.slug} className="btn-primary flex items-center gap-2">
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
