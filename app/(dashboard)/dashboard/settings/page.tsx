'use client'

import { ShieldCheck, FileCode2, KeyRound, RefreshCw } from 'lucide-react'

interface TokenField { key: string; label: string; link: string }

const FIELDS: TokenField[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', link: 'https://console.anthropic.com/settings/keys' },
  { key: 'FAL_KEY', label: 'fal.ai API Key', link: 'https://fal.ai/dashboard/keys' },
  { key: 'META_APP_ID', label: 'Meta App ID', link: 'https://developers.facebook.com/apps' },
  { key: 'META_APP_SECRET', label: 'Meta App Secret', link: 'https://developers.facebook.com/apps' },
  { key: 'TIKTOK_CLIENT_KEY', label: 'TikTok Client Key', link: 'https://developers.tiktok.com' },
  { key: 'TIKTOK_CLIENT_SECRET', label: 'TikTok Client Secret', link: 'https://developers.tiktok.com' },
]

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">API Keys</h1>
      <p className="text-gray-500 text-sm mb-8">
        Esta pantalla es una guía operativa. Por seguridad, las claves sensibles no se leen ni se editan desde el panel.
        Deben mantenerse fuera de la UI y configurarse en los archivos de entorno del proyecto.
      </p>

      <div className="card p-6 mb-4" style={{ border: '1px solid rgba(0,184,144,0.18)', background: 'rgba(0,184,144,0.04)' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-1">Por que no se muestran aqui</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Evitamos exponer secretos en cliente, HTML renderizado o estado React. El panel solo documenta donde
              configurarlos y donde obtener cada credencial.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Credenciales requeridas</h2>
        {FIELDS.map(({ key, label, link }) => (
          <div key={key} className="flex flex-col gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <code className="text-xs text-gray-500">{key}</code>
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold whitespace-nowrap"
                style={{ color: 'var(--accent)' }}
              >
                Obtener clave →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-4">
        <h2 className="font-semibold text-gray-900 mb-3">Como configurar sin exponer secretos</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Abre <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> y actualiza solo las variables necesarias.</li>
          <li>Replica el cambio en <code className="bg-gray-100 px-1 rounded text-xs">.env</code> solo si tu entorno local lo requiere.</li>
          <li>Reinicia la app o el contenedor para que el servidor relea las variables.</li>
          <li>Usa <code className="bg-gray-100 px-1 rounded text-xs">Configuracion → Cuentas sociales</code> solo para tokens de usuario o pagina, no para secretos de plataforma.</li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileCode2 className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Archivo base</p>
            </div>
            <p className="text-xs text-gray-600"><code>.env.local</code> para app keys y secretos del servidor.</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Panel</p>
            </div>
            <p className="text-xs text-gray-600">Usa el panel solo para cuentas sociales y tokens cifrados por proyecto.</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Recarga</p>
            </div>
            <p className="text-xs text-gray-600">Reinicia la app despues de cambiar variables para evitar estados viejos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
