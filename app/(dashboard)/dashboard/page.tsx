'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Zap, FileText, CheckCircle } from 'lucide-react'

interface Project {
  id: string
  slug: string
  name: string
  industry: string | null
  brandColor: string | null
  tone: string
  _count: { posts: number }
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ContentForge</h1>
          <p className="text-gray-500 mt-1">Selecciona un proyecto para generar contenido</p>
        </div>
        <Link href="/dashboard/projects/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/generate?projectId=${p.id}`}
              className="card p-5 hover:shadow-md hover:border-brand/30 transition-all group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: p.brandColor ?? '#6366f1' }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.industry ?? 'Sin industria'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {p._count.posts} posts
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-brand" />
                  Generar ahora
                </span>
              </div>
            </Link>
          ))}

          {/* Card nuevo proyecto */}
          <Link
            href="/dashboard/projects/new"
            className="card p-5 border-dashed hover:border-brand/40 hover:bg-brand/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Agregar proyecto</p>
          </Link>
        </div>
      )}

      {/* Stats rápidas */}
      {!loading && projects.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Proyectos activos', value: projects.length, icon: FolderOpen },
            { label: 'Posts generados', value: projects.reduce((a, p) => a + p._count.posts, 0), icon: FileText },
            { label: 'APIs conectadas', value: 3, icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FolderOpen({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  )
}
