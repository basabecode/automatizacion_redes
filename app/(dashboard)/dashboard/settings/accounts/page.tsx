'use client'

import { useEffect, useState } from 'react'
import {
  Facebook, Instagram, Video, Plus, Trash2, ShieldCheck,
  ChevronUp, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'

interface Project { id: string; name: string; slug: string; brandColor: string | null }

interface SocialAccount {
  id:          string
  projectId:   string
  network:     'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'
  accountId:   string
  accountName: string
  expiresAt:   string | null
  createdAt:   string
  project:     { name: string; slug: string }
}

type Network = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'

const NETWORK_META: Record<Network, { label: string; color: string; icon: React.ElementType; placeholder: { id: string; name: string } }> = {
  FACEBOOK:  { label: 'Facebook',  color: '#1877F2', icon: Facebook,  placeholder: { id: 'ID de la página (ej: 123456789)', name: 'Nombre de la página' } },
  INSTAGRAM: { label: 'Instagram', color: '#E1306C', icon: Instagram, placeholder: { id: 'ID cuenta IG Business (ej: 17841...)', name: 'Nombre de usuario' } },
  TIKTOK:    { label: 'TikTok',    color: '#000000', icon: Video,     placeholder: { id: 'open_id del usuario TikTok', name: 'Nombre de usuario' } },
}

const emptyForm = {
  projectId:    '',
  network:      'FACEBOOK' as Network,
  accountId:    '',
  accountName:  '',
  accessToken:  '',
  refreshToken: '',
  expiresAt:    '',
}

export default function AccountsPage() {
  const [projects,  setProjects]  = useState<Project[]>([])
  const [accounts,  setAccounts]  = useState<SocialAccount[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(emptyForm)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [toast,     setToast]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
    ]).then(([projs, accs]) => {
      setProjects(projs)
      setAccounts(accs)
    }).finally(() => setLoading(false))
  }, [])

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/accounts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')

      // Refrescar lista
      const updated = await fetch('/api/accounts').then(r => r.json())
      setAccounts(updated)
      setForm(emptyForm)
      setShowForm(false)
      showToast('ok', 'Cuenta vinculada y token cifrado correctamente')
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta social?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        showToast('err', data.error ?? 'No se pudo eliminar')
        return
      }
      setAccounts(prev => prev.filter(a => a.id !== id))
      showToast('ok', 'Cuenta eliminada')
    } catch {
      showToast('err', 'Error de conexión al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  // Agrupar cuentas por proyecto
  const byProject = projects.map(p => ({
    project:  p,
    accounts: accounts.filter(a => a.projectId === p.id),
  }))

  const netMeta = NETWORK_META[form.network]

  return (
    <div className="p-8 max-w-3xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'ok'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
            : <AlertCircle  className="w-4 h-4 text-red-600"   />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cuentas sociales</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Vincula las cuentas de cada proyecto. Los tokens se almacenan cifrados (AES-256-GCM).
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm
            ? <><ChevronUp className="w-4 h-4" />Cerrar</>
            : <><Plus      className="w-4 h-4" />Agregar cuenta</>
          }
        </button>
      </div>

      {/* Formulario de nueva cuenta */}
      {showForm && (
        <div className="card p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Vincular nueva cuenta
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Proyecto */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <select
                value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                className="input"
              >
                <option value="">Selecciona un proyecto...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Red social */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Red social</label>
              <div className="flex gap-2">
                {(Object.keys(NETWORK_META) as Network[]).map(n => {
                  const meta = NETWORK_META[n]
                  const Icon = meta.icon
                  const active = form.network === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, network: n }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all flex-1 justify-center ${
                        active
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                      style={active ? { backgroundColor: meta.color, borderColor: meta.color } : {}}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Account ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de cuenta
              </label>
              <input
                value={form.accountId}
                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                placeholder={netMeta.placeholder.id}
                className="input"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de cuenta
              </label>
              <input
                value={form.accountName}
                onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                placeholder={netMeta.placeholder.name}
                className="input"
              />
            </div>

            {/* Access Token */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
                <span className="ml-2 text-xs text-indigo-500 font-normal">
                  🔒 Se cifrará con AES-256-GCM al guardar
                </span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={form.accessToken}
                  onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                  placeholder="EAAxxxx... (token de larga duración)"
                  className="input pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Refresh Token (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Token <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="password"
                value={form.refreshToken}
                onChange={e => setForm(f => ({ ...f, refreshToken: e.target.value }))}
                placeholder="Solo si aplica"
                className="input font-mono text-xs"
              />
            </div>

            {/* Expires At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de expiración <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.projectId || !form.accountId || !form.accountName || !form.accessToken}
              className="btn-primary flex items-center gap-2"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
                : <><ShieldCheck className="w-4 h-4" />Guardar y cifrar</>
              }
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de cuentas agrupadas por proyecto */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          No hay proyectos. Crea un proyecto primero.
        </div>
      ) : (
        <div className="space-y-4">
          {byProject.map(({ project, accounts: projAccounts }) => (
            <div key={project.id} className="card overflow-hidden">
              {/* Project header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: project.brandColor ?? '#6366f1' }}
                >
                  {project.name.charAt(0)}
                </div>
                <p className="font-semibold text-gray-900">{project.name}</p>
                <span className="ml-auto text-xs text-gray-400">
                  {projAccounts.length} cuenta{projAccounts.length !== 1 ? 's' : ''} vinculada{projAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Accounts list */}
              {projAccounts.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-400">Sin cuentas vinculadas</p>
                  <button
                    onClick={() => { setForm(f => ({ ...f, projectId: project.id })); setShowForm(true) }}
                    className="mt-2 text-xs text-indigo-500 hover:underline font-medium"
                  >
                    + Agregar cuenta ahora
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {projAccounts.map(account => {
                    const meta = NETWORK_META[account.network]
                    const Icon = meta.icon
                    const expired = account.expiresAt && new Date(account.expiresAt) < new Date()

                    return (
                      <div key={account.id} className="flex items-center gap-4 px-5 py-4">
                        {/* Network badge */}
                        <span
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-medium flex-shrink-0"
                          style={{ backgroundColor: meta.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>

                        {/* Account info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{account.accountName}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">ID: {account.accountId}</p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {expired ? (
                            <span className="badge bg-red-100 text-red-600">Token vencido</span>
                          ) : (
                            <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />Cifrado
                            </span>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={deleting === account.id}
                          className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 ml-1"
                          title="Eliminar cuenta"
                        >
                          {deleting === account.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2  className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
