'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Zap, FileText, Sparkles, TrendingUp, Target,
  Copy, ArrowRight, RefreshCw, Lightbulb, Flame,
  BookOpen, Share2, ChevronRight, FolderOpen,
} from 'lucide-react'

interface Project {
  id: string
  slug: string
  name: string
  industry: string | null
  brandColor: string | null
  tone: string
  _count: { posts: number }
}

// ── Ideas basadas en las fórmulas del skill social-content ──────────────────
const HOOK_IDEAS = [
  {
    categoria: 'Curiosidad radical',
    formula: 'La verdad que nadie te dice sobre [tema]...',
    ejemplo: 'La verdad que nadie te dice sobre crecer en Instagram sin pagar ads',
    tip: 'Las preguntas implícitas retienen un 40% más de atención. Ideal para carruseles de 8-10 slides.',
    red: 'Instagram',
    tipo: 'Carrusel',
    color: 'var(--violet)',
    bgColor: 'rgba(92,53,204,0.09)',
  },
  {
    categoria: 'Historia de transformación',
    formula: 'Hace [tiempo] [estado pasado]. Hoy [estado actual]. Esto lo cambió todo:',
    ejemplo: 'Hace 90 días tenía 0 seguidores. Hoy 12K. Esto lo cambió todo:',
    tip: 'Las historias de transformación generan 3× más saves que el contenido informativo. Incluye números reales.',
    red: 'TikTok',
    tipo: 'Video corto',
    color: 'var(--coral)',
    bgColor: 'rgba(217,64,64,0.09)',
  },
  {
    categoria: 'Opinión contraria',
    formula: 'Opinión impopular: [práctica común] está destruyendo tu [resultado deseado]',
    ejemplo: 'Opinión impopular: publicar todos los días está destruyendo tu engagement',
    tip: 'El contenido contrarian genera debate activo. Es el formato con mayor alcance orgánico en Facebook.',
    red: 'Facebook',
    tipo: 'Post de texto',
    color: 'var(--amber)',
    bgColor: 'rgba(200,124,0,0.09)',
  },
  {
    categoria: 'Lista de valor',
    formula: '[N] errores que cuestan [resultado] (y cómo evitarlos)',
    ejemplo: '7 errores que hacen perder clientes en redes (y cómo evitarlos)',
    tip: 'Los números impares funcionan mejor. El 7 históricamente tiene el CTR más alto en títulos de lista.',
    red: 'LinkedIn',
    tipo: 'Carrusel',
    color: 'var(--accent)',
    bgColor: 'var(--accent-dim)',
  },
  {
    categoria: 'Detrás del escenario',
    formula: 'Lo que no ves cuando [referente del sector] hace [acción]:',
    ejemplo: 'Lo que no ves cuando las grandes marcas publican sus Reels:',
    tip: 'El contenido BTS genera 2× más saves. La autenticidad supera a la perfección en engagement.',
    red: 'Instagram',
    tipo: 'Reel',
    color: 'var(--text-body)',
    bgColor: 'rgba(12,29,22,0.07)',
  },
]

const PILLARES = [
  { nombre: 'Insights de industria', pct: 30, color: 'var(--violet)' },
  { nombre: 'Behind-the-scenes',     pct: 25, color: 'var(--accent)' },
  { nombre: 'Educativo / How-to',    pct: 25, color: 'var(--amber)'  },
  { nombre: 'Historia personal',     pct: 15, color: 'var(--coral)'  },
  { nombre: 'Promocional',           pct: 5,  color: 'var(--text-muted)' },
]

const TACTICAS = [
  {
    titulo: 'Hook de apertura fuerte',
    desc: 'Las primeras 3 palabras deciden si alguien sigue leyendo. Empieza siempre con tensión, número o pregunta.',
    icono: Flame,
    color: 'var(--coral)',
    bg: 'rgba(217,64,64,0.08)',
  },
  {
    titulo: 'Carrusel educativo',
    desc: 'Mayor save rate que cualquier otro formato. Úsalos para frameworks paso a paso y comparativas visuales.',
    icono: BookOpen,
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
  },
  {
    titulo: 'Repurposing × 7',
    desc: '1 post semanal → 7 piezas distribuidas en todas las redes. Multiplica el alcance sin esfuerzo extra.',
    icono: RefreshCw,
    color: 'var(--amber)',
    bg: 'rgba(200,124,0,0.08)',
  },
]

// ── Componente stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color, bg }: {
  label: string; value: string | number; Icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="stat-card card-hover">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: bg }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold leading-none mb-1"
        style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [ideaIdx, setIdeaIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [dateLabel, setDateLabel] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches')
    setDateLabel(new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    }))
  }, [])

  const idea = HOOK_IDEAS[ideaIdx]
  const totalPosts = projects.reduce((a, p) => a + p._count.posts, 0)

  function copyFormula() {
    navigator.clipboard.writeText(idea.formula)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', padding: 'clamp(20px, 4vw, 40px)' }}
    >

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2 capitalize"
            style={{ color: 'var(--text-faint)' }}
          >
            {dateLabel}
          </p>
          <h1
            className="font-bold leading-tight"
            style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              color: 'var(--text)',
              letterSpacing: '-0.03em',
              fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)',
            }}
          >
            {greeting || 'Bienvenido'},{' '}
            <span style={{ color: 'var(--accent)' }}>Yetzar</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {loading
              ? 'Cargando proyectos...'
              : projects.length > 0
                ? `${projects.length} proyecto${projects.length > 1 ? 's' : ''} activo${projects.length > 1 ? 's' : ''} · ${totalPosts} posts generados`
                : 'Crea tu primer proyecto y empieza a generar contenido con IA'
            }
          </p>
        </div>

        <Link
          href="/dashboard/generate"
          className="btn-primary self-start sm:self-auto whitespace-nowrap flex-shrink-0"
        >
          <Zap className="w-4 h-4" />
          Generar contenido
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Proyectos activos"
          value={loading ? '—' : projects.length}
          Icon={FolderOpen}
          color="var(--violet)"
          bg="rgba(92,53,204,0.09)"
        />
        <StatCard
          label="Posts generados"
          value={loading ? '—' : totalPosts}
          Icon={FileText}
          color="var(--accent)"
          bg="var(--accent-dim)"
        />
        <StatCard
          label="Redes disponibles"
          value={3}
          Icon={Share2}
          color="var(--amber)"
          bg="rgba(200,124,0,0.09)"
        />
        <StatCard
          label="Motores de IA"
          value={2}
          Icon={Sparkles}
          color="var(--coral)"
          bg="rgba(217,64,64,0.08)"
        />
      </div>

      {/* ── CHISPA IA + PILARES ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Chispa IA — ocupa 3 columnas en lg */}
        <div
          className="card lg:col-span-3 p-5 sm:p-6 relative overflow-hidden"
          style={{ borderTop: `3px solid ${idea.color}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ background: idea.bgColor }}>
                <Lightbulb className="w-4 h-4" style={{ color: idea.color }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  Chispa IA del día
                </p>
                <p className="text-xs font-bold mt-0.5" style={{ color: idea.color }}>
                  {idea.categoria}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Paginación de puntos */}
              <div className="hidden sm:flex items-center gap-1">
                {HOOK_IDEAS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdeaIdx(i)}
                    style={{
                      width: i === ideaIdx ? '18px' : '6px',
                      height: '6px',
                      borderRadius: '99px',
                      background: i === ideaIdx ? idea.color : 'var(--border-strong)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdeaIdx(i => (i + 1) % HOOK_IDEAS.length)}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}
                title="Siguiente idea"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ejemplo destacado */}
          <p
            className="font-semibold mb-3 leading-snug"
            style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              color: 'var(--text)',
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              letterSpacing: '-0.01em',
            }}
          >
            &ldquo;{idea.ejemplo}&rdquo;
          </p>

          {/* Fórmula */}
          <div
            className="px-3.5 py-3 rounded-xl mb-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <p className="section-label mb-1.5">Fórmula</p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-body)', fontFamily: 'monospace', lineHeight: 1.6 }}
            >
              {idea.formula}
            </p>
          </div>

          {/* Tip */}
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            {idea.tip}
          </p>

          {/* Footer de la card */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: idea.bgColor, color: idea.color }}
              >
                {idea.red}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {idea.tipo}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyFormula}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: copied ? 'var(--accent)' : 'var(--text-faint)' }}
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copiada' : 'Copiar fórmula'}
              </button>
              <Link
                href="/dashboard/generate"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: idea.bgColor, color: idea.color }}
              >
                Generar con esto
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Pilares de contenido — ocupa 2 columnas en lg */}
        <div className="card lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4" style={{ color: 'var(--violet)' }} />
            <p
              className="text-sm font-bold"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
            >
              Pilares de contenido
            </p>
          </div>

          <div className="space-y-4">
            {PILLARES.map(p => (
              <div key={p.nombre}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs" style={{ color: 'var(--text-body)' }}>{p.nombre}</p>
                  <p className="text-xs font-bold tabular-nums" style={{ color: p.color }}>{p.pct}%</p>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-5 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="section-label mb-1.5">Regla de oro</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              70% en educación y valor, máximo 10% en promoción. Así maximizas el alcance orgánico.
            </p>
          </div>
        </div>
      </div>

      {/* ── PROYECTOS ───────────────────────────────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold text-base"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
          >
            Tus proyectos
          </h2>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Ver todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="card p-5 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl mb-4" style={{ background: 'var(--bg-alt)' }} />
                <div className="h-3.5 rounded-lg mb-2" style={{ background: 'var(--bg-alt)', width: '65%' }} />
                <div className="h-2.5 rounded-lg" style={{ background: 'var(--border)', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/generate?projectId=${p.id}`}
                className="card card-hover block p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: p.brandColor ?? 'var(--text)' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {p.name}
                    </h3>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>
                      {p.industry ?? 'Sin industria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                    <FileText className="w-3 h-3" />
                    {p._count.posts} posts
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    <Zap className="w-3 h-3" />
                    Generar
                  </span>
                </div>
              </Link>
            ))}

            {/* Nuevo proyecto */}
            <Link
              href="/dashboard/projects"
              className="flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-2xl transition-all duration-150 p-5"
              style={{
                background: 'transparent',
                border: '1.5px dashed var(--border-strong)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-border)'
                e.currentTarget.style.background = 'var(--accent-dim)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Nuevo proyecto
              </p>
            </Link>
          </div>
        )}
      </section>

      {/* ── TÁCTICAS ────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h2
            className="font-bold text-base"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
          >
            Tácticas de alto impacto
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TACTICAS.map(({ titulo, desc, icono: Icon, color, bg }) => (
            <div key={titulo} className="card card-hover p-5">
              <div
                className="w-9 h-9 flex items-center justify-center mb-3 rounded-xl"
                style={{ background: bg }}
              >
                <Icon className="w-[17px] h-[17px]" style={{ color }} />
              </div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                {titulo}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
