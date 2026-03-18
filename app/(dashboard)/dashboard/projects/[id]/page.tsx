'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PostPreviewSimulator } from '@/components/admin/post-preview-simulator'
import { summarizeEntryPosts } from '@/lib/admin-workflow'
import type { WorkflowPostStatus } from '@/lib/admin-workflow'
import { publishPostById } from '@/lib/admin-api-client'
import { CALENDAR_STATUS_LABELS, getNetworkColor, getNetworkLabel, POST_STATUS_LABELS } from '@/lib/admin-ui'
import {
  ChevronLeft, ChevronRight, Plus, Zap, Loader2, X,
  Check, RefreshCw, Edit2, Trash2, Send, Calendar,
  FileText, CheckCircle, XCircle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string; name: string; slug: string
  industry: string | null; brandColor: string | null
  tone: string; audience: string | null
}

interface PostPreview {
  id: string; status: WorkflowPostStatus; imageUrl: string | null
  title: string; description: string; network: string
  contentType: string; hashtags: string[]; cta: string
  mediaUrls?: string[]; videoUrl: string | null
}

interface CalendarEntry {
  id: string; date: string; topic: string; notes: string | null
  networks: string[]; contentType: string; status: CalendarStatus
  posts: PostPreview[]
}

type CalendarStatus = 'PENDING'|'GENERATING'|'READY'|'APPROVED'|'PUBLISHED'|'NEEDS_EDIT'
type ActiveTab = 'calendar' | 'posts'

interface Post {
  id: string; title: string; description: string; network: string
  status: WorkflowPostStatus; imageUrl: string | null; contentType: string
  createdAt: string; publishedAt: string | null; hashtags: string[]
  cta: string; mediaUrls?: string[]; videoUrl?: string | null; errorMessage?: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
const MONTHS_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const STATUS_META: Record<CalendarStatus, { label: string; color: string; bg: string }> = {
  PENDING:    { label: CALENDAR_STATUS_LABELS.PENDING,    color: 'var(--text-muted)', bg: 'var(--surface-2)'       },
  GENERATING: { label: CALENDAR_STATUS_LABELS.GENERATING, color: 'var(--amber)',      bg: 'rgba(200,124,0,0.09)'   },
  READY:      { label: CALENDAR_STATUS_LABELS.READY,      color: 'var(--accent)',     bg: 'var(--accent-dim)'       },
  APPROVED:   { label: CALENDAR_STATUS_LABELS.APPROVED,   color: '#007A60',           bg: 'rgba(0,184,144,0.13)'   },
  PUBLISHED:  { label: CALENDAR_STATUS_LABELS.PUBLISHED,  color: '#007A60',           bg: 'rgba(0,184,144,0.13)'   },
  NEEDS_EDIT: { label: CALENDAR_STATUS_LABELS.NEEDS_EDIT, color: 'var(--coral)',      bg: 'rgba(217,64,64,0.09)'   },
}

const POST_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:      { label: POST_STATUS_LABELS.DRAFT,      color: 'var(--text-muted)', bg: 'var(--surface-2)'     },
  READY:      { label: POST_STATUS_LABELS.READY,      color: 'var(--sky)',        bg: 'rgba(0,119,204,0.10)' },
  GENERATING: { label: POST_STATUS_LABELS.GENERATING, color: 'var(--amber)',      bg: 'rgba(200,124,0,0.10)' },
  PUBLISHING: { label: POST_STATUS_LABELS.PUBLISHING, color: 'var(--amber)',      bg: 'rgba(200,124,0,0.10)' },
  PUBLISHED:  { label: POST_STATUS_LABELS.PUBLISHED,  color: '#007A60',           bg: 'rgba(0,184,144,0.13)' },
  FAILED:     { label: POST_STATUS_LABELS.FAILED,     color: 'var(--coral)',      bg: 'rgba(217,64,64,0.09)' },
}

// ── Calendar helpers ─────────────────────────────────────────────────────────
function getMonthWeeks(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = []
  const last = new Date(year, month, 0).getDate()
  let week: (Date | null)[] = new Array(5).fill(null)
  let hasDay = false

  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay() // 0=Sun…6=Sat
    if (dow === 0 || dow === 6) continue
    const idx = dow - 1 // Mon=0…Fri=4
    week[idx] = date
    hasDay = true
    if (dow === 5) { weeks.push(week); week = new Array(5).fill(null); hasDay = false }
  }
  if (hasDay) weeks.push(week)
  return weeks
}

function dateKey(d: Date) {
  // Use local date components to avoid UTC timezone shift
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [project,    setProject]    = useState<Project | null>(null)
  const [notFound,   setNotFound]   = useState(false)
  const [entries,    setEntries]    = useState<CalendarEntry[]>([])
  const [posts,      setPosts]      = useState<Post[]>([])
  const [tab,        setTab]        = useState<ActiveTab>('calendar')
  const [year,       setYear]       = useState(() => new Date().getFullYear())
  const [month,      setMonth]      = useState(() => new Date().getMonth() + 1) // 1-12
  const [loading,    setLoading]    = useState(true)
  const [genLoading, setGenLoading] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  // Modal crear entrada
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [entryForm, setEntryForm] = useState({
    topic: '', notes: '', networks: ['FACEBOOK','INSTAGRAM'] as string[], contentType: 'IMAGE',
  })
  const [savingEntry, setSavingEntry] = useState(false)

  // Modal editar entrada
  const [editingEntry, setEditingEntry] = useState<CalendarEntry | null>(null)
  const [editForm, setEditForm] = useState({ topic: '', notes: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Modal ver post
  const [viewingPost, setViewingPost] = useState<PostPreview | null>(null)

  const weeks = getMonthWeeks(year, month)
  // Use the date string directly (YYYY-MM-DD) to avoid timezone shifts
  const entryMap = Object.fromEntries(
    entries.map(e => [e.date.slice(0, 10), e])
  )

  // ── Fetch project ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(async r => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        if (!r.ok) throw new Error('No se pudo cargar el proyecto')
        return r.json()
      })
      .then((project: Project | null) => {
        if (!project) return
        setProject(project)
        setNotFound(false)
      })
      .catch(() => setNotFound(true))
  }, [id])

  // ── Fetch calendar ──────────────────────────────────────────────────────────
  const fetchEntries = useCallback(() => {
    fetch(`/api/calendar?projectId=${id}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then(setEntries)
  }, [id, year, month])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // ── Fetch posts ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(() => {
    setLoading(true)
    fetch(`/api/posts?projectId=${id}`)
      .then(r => r.json())
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { if (tab === 'posts') fetchPosts() }, [tab, fetchPosts])

  // ── Month navigation ──────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // ── Entry CRUD ──────────────────────────────────────────────────────────
  async function handleCreateEntry() {
    if (!selectedDate) return
    setSavingEntry(true)
    const dateStr = new Date(Date.UTC(
      selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()
    )).toISOString()
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, date: dateStr, ...entryForm }),
      })
      if (res.ok) {
        const entry = await res.json()
        setEntries(prev => [...prev.filter(e => dateKey(new Date(e.date)) !== dateKey(selectedDate)), entry])
        setSelectedDate(null)
        setEntryForm({ topic: '', notes: '', networks: ['FACEBOOK','INSTAGRAM'], contentType: 'IMAGE' })
      }
    } finally { setSavingEntry(false) }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('¿Eliminar este tema del calendario?')) return
    await fetch(`/api/calendar/${entryId}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  async function handleGenerate(entry: CalendarEntry) {
    setGenLoading(entry.id)
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'GENERATING' } : e))
    try {
      const res = await fetch(`/api/calendar/${entry.id}/generate`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchEntries()
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          alert(`La generacion termino con errores parciales:\n\n- ${data.errors.join('\n- ')}`)
        }
      } else {
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'PENDING' } : e))
        alert('Error al generar: ' + (data.error ?? 'desconocido'))
      }
    } catch {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'PENDING' } : e))
    } finally { setGenLoading(null) }
  }

  async function handleStatusChange(entryId: string, status: CalendarStatus) {
    const res = await fetch(`/api/calendar/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) {
      setEntries(prev => prev.map(e => e.id === entryId ? data.entry : e))
    }
  }

  async function handlePublishPost(postId: string) {
    setPublishing(postId)
    try {
      const { ok, data } = await publishPostById(postId)
      if (ok) {
        fetchEntries()
        if (tab === 'posts') fetchPosts()
      } else {
        alert('Error al publicar: ' + (data.error ?? 'desconocido'))
      }
    } finally { setPublishing(null) }
  }

  async function handleSaveEdit() {
    if (!editingEntry) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/calendar/${editingEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success) {
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? data.entry : e))
        setEditingEntry(null)
      }
    } finally { setSavingEdit(false) }
  }

  function toggleNetwork(net: string) {
    setEntryForm(f => ({
      ...f,
      networks: f.networks.includes(net)
        ? f.networks.filter(n => n !== net)
        : [...f.networks, net],
    }))
  }

  function openPreview(post: PostPreview | Post) {
    if (!project) return
    setViewingPost({
      id: post.id,
      status: post.status,
      imageUrl: post.imageUrl,
      title: post.title,
      description: post.description,
      network: post.network,
      contentType: post.contentType,
      hashtags: post.hashtags ?? [],
      cta: post.cta ?? '',
      mediaUrls: post.mediaUrls ?? [],
      videoUrl: post.videoUrl ?? null,
    })
  }

  // ── Day cell renderer ────────────────────────────────────────────────────
  function DayCell({ date }: { date: Date | null }) {
    if (!date) return <div className="min-h-[130px]" />

    const key   = dateKey(date)
    const entry = entryMap[key]
    const today = dateKey(new Date()) === key
    const isPast = date < new Date(new Date().setHours(0,0,0,0))

    const baseStyle: React.CSSProperties = {
      minHeight: '130px',
      borderRadius: '14px',
      border: '1px solid var(--border-strong)',
      background: 'var(--surface)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(12,29,22,0.06)',
    }

    if (today) {
      baseStyle.borderColor = 'var(--accent-border)'
      baseStyle.boxShadow = '0 0 0 2px var(--accent-dim)'
    }

    if (!entry) {
      return (
        <div style={baseStyle} className="p-2.5 flex flex-col gap-1">
          <span
            className="text-xs font-bold self-start px-1.5 py-0.5 rounded-md"
            style={{
              color: today ? 'var(--accent)' : 'var(--text-faint)',
              background: today ? 'var(--accent-dim)' : 'transparent',
            }}
          >
            {date.getDate()}
          </span>
          {!isPast && (
            <button
              onClick={() => {
                setSelectedDate(date)
                setEntryForm({ topic: '', notes: '', networks: ['FACEBOOK','INSTAGRAM'], contentType: 'IMAGE' })
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-dim)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-faint)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-medium">Agregar tema</span>
            </button>
          )}
        </div>
      )
    }

    const meta = STATUS_META[entry.status]
    const mainPost = entry.posts[0]
    const summary = summarizeEntryPosts(entry.posts)
    const nextReadyPost = entry.posts.find(post => post.status === 'READY') ?? null

    return (
      <div style={baseStyle} className="p-2.5 flex flex-col gap-2">
        {/* Header: fecha + status */}
        <div className="flex items-start justify-between gap-1">
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-md"
            style={{
              color: today ? 'var(--accent)' : 'var(--text-faint)',
              background: today ? 'var(--accent-dim)' : 'transparent',
            }}
          >
            {date.getDate()}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Thumbnail si existe */}
        {mainPost?.imageUrl && (
          <div
            className="rounded-lg overflow-hidden cursor-pointer"
            style={{ height: '52px', background: 'var(--bg)' }}
            onClick={() => openPreview(mainPost)}
          >
            <img
              src={mainPost.imageUrl}
              alt={entry.topic}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Topic */}
        {mainPost ? (
          <button
            type="button"
            onClick={() => openPreview(mainPost)}
            className="text-xs font-semibold leading-tight line-clamp-2 text-left"
            style={{ color: 'var(--text)' }}
          >
            {entry.topic}
          </button>
        ) : (
          <p
            className="text-xs font-semibold leading-tight line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {entry.topic}
          </p>
        )}

        {/* Networks */}
        <div className="flex gap-1">
          {entry.networks.map(n => (
            <span
              key={n}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${getNetworkColor(n)}18`, color: getNetworkColor(n) }}
            >
              {n === 'FACEBOOK' ? 'FB' : n === 'INSTAGRAM' ? 'IG' : 'TT'}
            </span>
          ))}
        </div>

        {summary.totalPosts > 0 && (
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {summary.publishedPosts}/{summary.totalPosts} publicado{summary.totalPosts !== 1 ? 's' : ''}
          </p>
        )}

        {mainPost && (
          <button
            type="button"
            onClick={() => openPreview(mainPost)}
            className="text-[10px] font-semibold text-left"
            style={{ color: 'var(--accent)' }}
          >
            Abrir simulador
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-auto">
          {entry.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleGenerate(entry)}
                disabled={genLoading === entry.id}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,184,144,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
              >
                <Zap className="w-3 h-3" />
                Generar
              </button>
              <button
                onClick={() => { setEditingEntry(entry); setEditForm({ topic: entry.topic, notes: entry.notes ?? '' }) }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDeleteEntry(entry.id)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          {entry.status === 'GENERATING' && (
            <div className="flex-1 flex items-center justify-center gap-1 py-1" style={{ color: 'var(--amber)' }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-medium">Generando…</span>
            </div>
          )}

          {entry.status === 'READY' && (
            <>
              <button
                onClick={() => handleStatusChange(entry.id, 'APPROVED')}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: 'rgba(0,184,144,0.10)', color: '#007A60' }}
                title="Aprobar"
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,184,144,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,184,144,0.10)'}
              >
                <Check className="w-3 h-3" />
                Aprobar
              </button>
              <button
                onClick={() => handleStatusChange(entry.id, 'NEEDS_EDIT')}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                title="Requiere edición"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleStatusChange(entry.id, 'PENDING')}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                title="Rechazar y regenerar"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <XCircle className="w-3 h-3" />
              </button>
            </>
          )}

          {entry.status === 'APPROVED' && nextReadyPost && (
            <button
              onClick={() => handlePublishPost(nextReadyPost.id)}
              disabled={publishing === nextReadyPost.id}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: 'var(--accent)', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hi)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              {publishing === nextReadyPost.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><Send className="w-3 h-3" /> Publicar siguiente</>
              }
            </button>
          )}

          {entry.status === 'PUBLISHED' && (
            <div className="flex-1 flex items-center justify-center gap-1 py-1" style={{ color: '#007A60' }}>
              <CheckCircle className="w-3 h-3" />
              <span className="text-[10px] font-medium">Publicado</span>
            </div>
          )}

          {entry.status === 'NEEDS_EDIT' && (
            <button
              onClick={() => handleGenerate(entry)}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: 'rgba(217,64,64,0.09)', color: 'var(--coral)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,64,64,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,64,64,0.09)'}
            >
              <RefreshCw className="w-3 h-3" />
              Regenerar
            </button>
          )}
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
        <p className="font-semibold" style={{ color: 'var(--text)' }}>Proyecto no encontrado</p>
        <a href="/dashboard/projects" className="text-sm" style={{ color: 'var(--accent)' }}>
          ← Volver a proyectos
        </a>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-faint)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: 'clamp(16px, 4vw, 36px)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ChevronLeft className="w-4 h-4" />
            Proyectos
          </Link>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: project.brandColor ?? 'var(--text)' }}
          >
            {project.name.charAt(0)}
          </div>
          <div>
            <h1
              className="font-bold leading-tight"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', letterSpacing: '-0.02em' }}
            >
              {project.name}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {project.industry ?? 'Sin industria'}{project.audience ? ` · ${project.audience}` : ''}
            </p>
          </div>
        </div>

      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {([['calendar', Calendar, 'Calendario'], ['posts', FileText, 'Posts']] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === key ? {
              background: 'var(--text)',
              color: '#fff',
              boxShadow: '0 1px 6px rgba(12,29,22,0.16)',
            } : {
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CALENDARIO
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'calendar' && (
        <div>
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2
                className="font-bold text-lg"
                style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)', letterSpacing: '-0.02em', minWidth: '180px', textAlign: 'center' }}
              >
                {MONTHS_ES[month - 1]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
              {Object.entries(STATUS_META).slice(0,4).map(([key, m]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: m.color }} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  {d}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-5 gap-2">
                {week.map((date, di) => (
                  <DayCell key={di} date={date} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: POSTS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'posts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {loading ? 'Cargando…' : `${posts.length} post${posts.length !== 1 ? 's' : ''} generados`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 mb-3" style={{ color: 'var(--text-faint)' }} />
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Sin posts todavía</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Agrega temas al calendario y genera contenido con IA
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map(post => {
                const sm = POST_STATUS_META[post.status] ?? POST_STATUS_META.DRAFT
                return (
                  <div
                    key={post.id}
                    onClick={() => openPreview(post)}
                    className="card p-4 w-full flex flex-col sm:flex-row sm:items-center gap-4 text-left transition-transform"
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPreview(post)
                      }
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--bg-alt)' }}
                    >
                      {post.imageUrl
                        ? <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5" style={{ color: 'var(--text-faint)' }} />
                          </div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {post.title}
                        </p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: sm.bg, color: sm.color }}
                        >
                          {sm.label}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: `${getNetworkColor(post.network, '#888')}18`,
                            color: getNetworkColor(post.network, '#888'),
                          }}
                        >
                          {getNetworkLabel(post.network)}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        {post.description}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                        {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--accent)' }}>
                        Click para abrir simulador
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                      {post.status === 'READY' && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            handlePublishPost(post.id)
                          }}
                          disabled={publishing === post.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                          style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                          {publishing === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Publicar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Crear entrada de calendario
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(12,29,22,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDate(null) }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 sm:p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
            style={{ background: 'var(--surface)', boxShadow: '0 20px 60px rgba(12,29,22,0.20)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  Agregar tema
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-body)' }}>
                Título del tema *
              </label>
              <input
                value={entryForm.topic}
                onChange={e => setEntryForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="Ej: 5 errores comunes al iniciar un negocio"
                className="input"
                style={{ background: 'var(--surface-2)' }}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-body)' }}>
                Notas adicionales
              </label>
              <textarea
                value={entryForm.notes}
                onChange={e => setEntryForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Contexto extra para la IA (opcional)"
                rows={2}
                className="input resize-none"
                style={{ background: 'var(--surface-2)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-body)' }}>
                Redes sociales
              </label>
              <div className="flex gap-2 flex-wrap">
                {['FACEBOOK','INSTAGRAM','TIKTOK'].map(net => (
                  <button
                    key={net}
                    onClick={() => toggleNetwork(net)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={entryForm.networks.includes(net) ? {
                      background: getNetworkColor(net),
                      color: '#fff',
                      border: `1.5px solid ${getNetworkColor(net)}`,
                    } : {
                      background: 'var(--surface-2)',
                      color: 'var(--text-faint)',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    {getNetworkLabel(net)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-body)' }}>
                Tipo de contenido
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['IMAGE','VIDEO','CAROUSEL','STORY'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setEntryForm(f => ({ ...f, contentType: type }))}
                    className="py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={entryForm.contentType === type ? {
                      background: 'var(--accent)',
                      color: '#fff',
                      border: '1.5px solid var(--accent)',
                    } : {
                      background: 'var(--surface-2)',
                      color: 'var(--text-faint)',
                      border: '1.5px solid var(--border)',
                    }}
                  >
                    {type === 'IMAGE' ? 'Imagen' : type === 'VIDEO' ? 'Video' : type === 'CAROUSEL' ? 'Carrusel' : 'Story'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                onClick={handleCreateEntry}
                disabled={savingEntry || !entryForm.topic.trim() || entryForm.networks.length === 0}
                className="btn-primary flex-1"
              >
                {savingEntry ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</> : 'Guardar tema'}
              </button>
              <button onClick={() => setSelectedDate(null)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Editar entrada
      ══════════════════════════════════════════════════════════════════════ */}
      {editingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(12,29,22,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingEntry(null) }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 sm:p-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
            style={{ background: 'var(--surface)', boxShadow: '0 20px 60px rgba(12,29,22,0.20)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Editar tema
              </h3>
              <button onClick={() => setEditingEntry(null)} style={{ color: 'var(--text-faint)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-body)' }}>Título del tema</label>
              <input value={editForm.topic} onChange={e => setEditForm(f => ({ ...f, topic: e.target.value }))} className="input" style={{ background: 'var(--surface-2)' }} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-body)' }}>Notas</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" style={{ background: 'var(--surface-2)' }} />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button onClick={handleSaveEdit} disabled={savingEdit || !editForm.topic.trim()} className="btn-primary flex-1">
                {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</> : 'Guardar cambios'}
              </button>
              <button onClick={() => setEditingEntry(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Ver post generado
      ══════════════════════════════════════════════════════════════════════ */}
      {viewingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(12,29,22,0.58)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setViewingPost(null) }}
        >
          <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] rounded-[30px] overflow-hidden border flex flex-col" style={{ background: 'linear-gradient(180deg, #f7fbf9 0%, #edf5f1 100%)', borderColor: 'rgba(12,29,22,0.08)' }}>
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(12,29,22,0.08)' }}>
              <div>
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>Simulador</p>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  Vista previa de publicación
                </h2>
              </div>
              <button
                onClick={() => setViewingPost(null)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-faint)', background: 'rgba(255,255,255,0.65)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <PostPreviewSimulator
                post={{
                  ...viewingPost,
                  project: {
                    name: project?.name ?? 'Proyecto',
                    slug: project?.slug ?? 'proyecto',
                  },
                }}
                initialNetwork={
                  viewingPost.network === 'INSTAGRAM'
                    ? 'INSTAGRAM'
                    : viewingPost.network === 'TIKTOK'
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
