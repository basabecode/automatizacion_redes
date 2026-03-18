'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Zap, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Email o contraseña incorrectos.')
    }
  }

  const ready = !loading && !!email && !!password

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: 'var(--bg)' }}
    >

      {/* ── Panel izquierdo — Marca ─────────────────────────────────────────── */}
      <div
        className="lg:w-[52%] flex flex-col p-8 sm:p-12 relative overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          minHeight: '280px',
        }}
      >
        {/* Patrón de puntos sutil */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.035 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="var(--text)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Acento de color — línea izquierda */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hidden lg:block"
          style={{ background: 'var(--accent)' }}
        />

        {/* Logo / header */}
        <div className="relative z-10 flex items-center gap-3 self-start">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 10px rgba(0,184,144,0.28)' }}
          >
            <Zap className="w-4 h-4" style={{ color: '#fff' }} />
          </div>
          <span
            className="font-bold text-lg"
            style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              color: 'var(--text)',
              letterSpacing: '-0.025em',
            }}
          >
            Yetzar
          </span>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-start justify-center gap-8 w-full max-w-sm text-left">
          {/* Copy — visible en lg */}
          <div className="hidden lg:block space-y-6 w-full">
            <div>
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                Content Studio · IA
              </span>
              <h1
                className="font-bold leading-tight"
                style={{
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  color: 'var(--text)',
                  letterSpacing: '-0.035em',
                  fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                }}
              >
                Contenido que<br />
                <span style={{ color: 'var(--accent)' }}>convierte.</span>
              </h1>
              <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-muted)' }}>
                Genera posts, imágenes y videos para Facebook, Instagram y TikTok con IA. Publica desde un solo lugar.
              </p>
            </div>

            {/* Métricas */}
            <div
              className="grid grid-cols-3 gap-4 pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {[
                { n: '3',  label: 'redes sociales' },
                { n: '4',  label: 'tipos de contenido' },
                { n: '∞',  label: 'proyectos' },
              ].map(({ n, label }) => (
                <div key={label}>
                  <p
                    className="text-2xl font-bold leading-none"
                    style={{
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                      color: 'var(--text)',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {n}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

            {/* Footer panel */}
            <p className="hidden lg:block text-[11px]" style={{ color: 'var(--text-faint)' }}>
              Herramienta interna · Acceso restringido
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — Formulario ──────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-full max-w-sm">

          {/* Encabezado */}
          <div className="mb-8">
            <h2
              className="font-bold mb-1.5"
              style={{
                fontFamily: 'Bricolage Grotesque, sans-serif',
                color: 'var(--text)',
                letterSpacing: '-0.025em',
                fontSize: 'clamp(1.4rem, 3vw, 1.75rem)',
              }}
            >
              Bienvenido de vuelta
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingresa con tu cuenta de administrador
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-body)' }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@ejemplo.com"
                  required
                  autoComplete="email"
                  className="input"
                  style={{ paddingLeft: '40px', background: 'var(--surface)' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--text-body)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }}
                />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input"
                  style={{ paddingLeft: '40px', background: 'var(--surface)' }}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(217,64,64,0.07)',
                  color: 'var(--coral)',
                  border: '1px solid rgba(217,64,64,0.18)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={!ready}
              className="btn-primary w-full mt-1"
              style={ready ? {} : { opacity: 0.38, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
                : <> Ingresar al panel <ArrowRight className="w-4 h-4" /> </>
              }
            </button>
          </form>

          {/* Hint — solo visible en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div
              className="mt-8 px-4 py-3 rounded-xl text-xs leading-relaxed"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-faint)',
              }}
            >
              Credenciales en{' '}
              <code className="font-mono" style={{ color: 'var(--text-muted)' }}>.env.local</code>
              {' '}→{' '}
              <code className="font-mono" style={{ color: 'var(--text-muted)' }}>ADMIN_EMAIL</code>
              {' '}/{' '}
              <code className="font-mono" style={{ color: 'var(--text-muted)' }}>ADMIN_PASSWORD</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
