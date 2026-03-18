'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, FileText, Settings,
  Zap, LogOut, Users, ChevronRight, Menu, X, CalendarDays,
} from 'lucide-react'

// ── Breadcrumb ────────────────────────────────────────────────────────────────
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Inicio',
  projects:  'Calendario',
  generate:  'Generar rápido',
  posts:     'Posts',
  settings:  'Configuración',
  accounts:  'Cuentas sociales',
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const [projectName, setProjectName] = useState<string | null>(null)

  // Extraer segmentos después de /dashboard
  const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean)

  // Si hay un ID de proyecto, intentar obtener su nombre
  useEffect(() => {
    if (segments[0] === 'projects' && segments[1]) {
      fetch('/api/projects')
        .then(r => r.json())
        .then((ps: { id: string; name: string }[]) => {
          const p = ps.find(p => p.id === segments[1])
          if (p) setProjectName(p.name)
        })
        .catch(() => {})
    } else {
      setProjectName(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Construir migas
  const crumbs: { label: string; href: string }[] = [
    { label: 'Inicio', href: '/dashboard' },
  ]

  let acc = '/dashboard'
  for (const seg of segments) {
    acc += '/' + seg
    const isId = !SEGMENT_LABELS[seg]
    const label = isId ? (projectName ?? 'Proyecto') : SEGMENT_LABELS[seg]
    crumbs.push({ label, href: acc })
  }

  if (crumbs.length <= 1) return null // en /dashboard no mostrar

  return (
    <nav
      className="flex items-center gap-1.5 px-5 py-2.5 text-xs"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      aria-label="Migas de pan"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />}
            {isLast ? (
              <span className="font-semibold truncate max-w-[180px]" style={{ color: 'var(--text)' }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors truncate max-w-[140px]"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

const nav = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Inicio',         activeExact: true  },
  { href: '/dashboard/projects', icon: CalendarDays,    label: 'Calendario',     activeExact: false },
  { href: '/dashboard/generate', icon: Zap,             label: 'Generar rápido', activeExact: false },
  { href: '/dashboard/posts',    icon: FileText,        label: 'Posts',          activeExact: false },
]

const navSettings = [
  { href: '/dashboard/settings/accounts', icon: Users,           label: 'Cuentas sociales' },
  { href: '/dashboard/settings',          icon: Settings,        label: 'API Keys'         },
]

function NavItem({
  href, icon: Icon, label, active, onClick,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean; activeExact?: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
      style={active ? {
        background: 'var(--sidebar-active-bg)',
        color: 'var(--text)',
        borderLeft: '2.5px solid var(--sidebar-active-border)',
        paddingLeft: '10px',
      } : {
        color: 'var(--sidebar-text)',
        borderLeft: '2.5px solid transparent',
        paddingLeft: '10px',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-hover)'
          e.currentTarget.style.color = 'var(--sidebar-text-hi)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--sidebar-text)'
        }
      }}
    >
      <Icon className="w-[17px] h-[17px] flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 opacity-40" />}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cerrar sidebar al cambiar de ruta en mobile
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,184,144,0.30)' }}
        >
          <Zap className="w-[15px] h-[15px]" style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-[15px] leading-none tracking-tight truncate"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
          >
            Yetzar
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>
            Content Studio
          </p>
        </div>
        {/* Botón cerrar — solo visible en mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon, label, activeExact }, i) => (
          <NavItem key={`${href}-${i}`} href={href} icon={icon} label={label}
            active={isActive(href, activeExact)} onClick={onClose} />
        ))}

        <div className="pt-5 pb-2 px-3">
          <p className="section-label">Configuración</p>
        </div>

        {navSettings.map(({ href, icon, label }) => (
          <NavItem key={href} href={href} icon={icon} label={label}
            active={isActive(href)} onClick={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 space-y-1"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {session?.user && (
          <div
            className="px-3 py-2.5 rounded-xl flex items-center gap-2.5 mb-1"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {session.user.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                {session.user.name ?? 'Admin'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>
                {session.user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--text-faint)', borderLeft: '2.5px solid transparent', paddingLeft: '10px' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(217,64,64,0.07)'
            e.currentTarget.style.color = 'var(--coral)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar desktop (lg+) ─────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed h-full z-20 w-60"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: '1px 0 8px rgba(12,29,22,0.04)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: backdrop + drawer ─────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(12,29,22,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className="lg:hidden fixed top-0 left-0 h-full z-40 w-72 flex flex-col transition-transform duration-250 ease-out"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: mobileOpen ? '4px 0 24px rgba(12,29,22,0.14)' : 'none',
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Top bar mobile */}
        <header
          className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 1px 6px rgba(12,29,22,0.05)',
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <Zap className="w-3 h-3" style={{ color: '#fff' }} />
            </div>
            <span
              className="font-bold text-sm"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}
            >
              Yetzar
            </span>
          </div>
        </header>

        <Breadcrumb pathname={pathname} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
