'use client'

import { useState } from 'react'
import { Save, Eye, EyeOff } from 'lucide-react'

interface TokenField { key: string; label: string; placeholder: string; link: string }

const FIELDS: TokenField[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key',   placeholder: 'sk-ant-...', link: 'https://console.anthropic.com/settings/keys' },
  { key: 'FAL_KEY',           label: 'fal.ai API Key',      placeholder: 'fal-...',    link: 'https://fal.ai/dashboard/keys' },
  { key: 'META_APP_ID',       label: 'Meta App ID',         placeholder: '1234567890', link: 'https://developers.facebook.com/apps' },
  { key: 'META_APP_SECRET',   label: 'Meta App Secret',     placeholder: 'abc123...',  link: 'https://developers.facebook.com/apps' },
  { key: 'TIKTOK_CLIENT_KEY', label: 'TikTok Client Key',   placeholder: 'aw...',      link: 'https://developers.tiktok.com' },
  { key: 'TIKTOK_CLIENT_SECRET', label: 'TikTok Client Secret', placeholder: '...',   link: 'https://developers.tiktok.com' },
]

export default function SettingsPage() {
  const [show, setShow] = useState<Record<string, boolean>>({})

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Configuración</h1>
      <p className="text-gray-500 text-sm mb-8">
        Las claves API se configuran en el archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> en la raíz del proyecto.
        Reinicia Docker después de modificarlo.
      </p>

      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">APIs requeridas</h2>
        {FIELDS.map(({ key, label, placeholder, link }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand hover:underline">
                Obtener clave →
              </a>
            </div>
            <div className="relative">
              <input
                type={show[key] ? 'text' : 'password'}
                placeholder={placeholder}
                readOnly
                className="input pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-4">
        <h2 className="font-semibold text-gray-900 mb-3">Cómo configurar</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Abre el archivo <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> en la raíz del proyecto</li>
          <li>Pega tus claves en las variables correspondientes</li>
          <li>Abre el archivo <code className="bg-gray-100 px-1 rounded text-xs">.env</code> y replica los mismos valores</li>
          <li>Reinicia con <code className="bg-gray-100 px-1 rounded text-xs">docker-compose restart app</code></li>
        </ol>
      </div>
    </div>
  )
}
