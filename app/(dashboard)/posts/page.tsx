'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface Post {
  id: string
  network: string
  title: string
  imageUrl: string | null
  status: string
  createdAt: string
  publishedAt: string | null
  project: { name: string; slug: string }
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  DRAFT:      { label: 'Borrador',    class: 'bg-gray-100 text-gray-600',   icon: Clock       },
  READY:      { label: 'Listo',       class: 'bg-blue-100 text-blue-700',   icon: Clock       },
  PUBLISHING: { label: 'Publicando',  class: 'bg-yellow-100 text-yellow-700', icon: Loader2   },
  PUBLISHED:  { label: 'Publicado',   class: 'bg-green-100 text-green-700', icon: CheckCircle },
  FAILED:     { label: 'Fallido',     class: 'bg-red-100 text-red-600',     icon: XCircle     },
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Historial de posts</h1>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400">No hay posts todavía. ¡Genera tu primer contenido!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
            const Icon = cfg.icon
            return (
              <div key={post.id} className="card p-4 flex items-center gap-4">
                {post.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden relative flex-shrink-0">
                    <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{post.title}</p>
                  <p className="text-sm text-gray-500">{post.project.name} · {post.network}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(post.createdAt).toLocaleString('es-CO')}
                  </p>
                </div>
                <span className={`badge flex items-center gap-1 ${cfg.class}`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
