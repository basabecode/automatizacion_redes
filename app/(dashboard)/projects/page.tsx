'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Zap } from 'lucide-react'

interface Project {
  id: string; slug: string; name: string
  industry: string | null; brandColor: string | null
  tone: string; audience: string | null
  _count: { posts: number }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ slug: '', name: '', industry: '', brandColor: '#6366f1', tone: 'cercano y casual', audience: '' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

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
      setProjects(prev => [...prev, p])
      setShowForm(false)
      setForm({ slug: '', name: '', industry: '', brandColor: '#6366f1', tone: 'cercano y casual', audience: '' })
    } finally {
      setSaving(false)
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
              </div>
              <span className="text-xs text-gray-400">{p._count.posts} posts</span>
              <Link href={`/dashboard/generate?projectId=${p.id}`} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                <Zap className="w-3.5 h-3.5" />Generar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
