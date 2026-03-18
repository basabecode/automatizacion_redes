'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Bookmark, Heart, MessageCircle, MonitorSmartphone, MoreHorizontal, Play, Repeat2, Send, Smartphone } from 'lucide-react'
import { getNetworkColor, getNetworkLabel } from '@/lib/admin-ui'

export type SimulatorNetwork = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK'
type SimulatorDevice = 'mobile' | 'desktop'

export interface SimulatorProjectRef {
  name: string
  slug: string
}

export interface SimulatorPost {
  title: string
  description: string
  network: string
  imageUrl: string | null
  mediaUrls?: string[]
  videoUrl?: string | null
  hashtags?: string[]
  cta?: string
  contentType?: string
  project: SimulatorProjectRef
}

function captionLines(text: string) {
  return text.split('\n').map(line => line.trim()).filter(Boolean)
}

function previewMedia(post: SimulatorPost) {
  if (post.contentType === 'CAROUSEL' && post.mediaUrls && post.mediaUrls.length > 0) {
    return post.mediaUrls
  }
  if (post.imageUrl) return [post.imageUrl]
  return []
}

function DeviceFrame({
  device,
  children,
}: {
  device: SimulatorDevice
  children: React.ReactNode
}) {
  if (device === 'desktop') {
    return (
      <div className="w-full max-w-[760px] rounded-[28px] p-4 border shadow-[0_24px_70px_rgba(12,29,22,0.16)]" style={{ background: 'rgba(255,255,255,0.66)', borderColor: 'rgba(12,29,22,0.08)' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[34px] border-[10px] shadow-[0_28px_70px_rgba(12,29,22,0.22)] overflow-hidden" style={{ borderColor: '#0f1e17', background: '#0f1e17' }}>
      <div className="h-6 flex items-center justify-center bg-[#0f1e17]">
        <div className="w-24 h-1.5 rounded-full bg-white/20" />
      </div>
      <div className="bg-white">
        {children}
      </div>
    </div>
  )
}

function MediaRenderer({
  post,
  network,
}: {
  post: SimulatorPost
  network: SimulatorNetwork
}) {
  const media = previewMedia(post)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMedia = media[activeIndex] ?? null

  if (post.contentType === 'VIDEO' || (network === 'TIKTOK' && post.videoUrl)) {
    if (post.videoUrl) {
      return (
        <video
          src={post.videoUrl}
          controls
          className={`w-full bg-black ${network === 'TIKTOK' ? 'aspect-[9/16]' : 'aspect-video'}`}
        />
      )
    }
  }

  if (post.contentType === 'CAROUSEL' && media.length > 0) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-square bg-neutral-100 overflow-hidden">
          <Image src={activeMedia!} alt={post.title} fill className="object-cover" />
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold text-white bg-black/55">
            {activeIndex + 1}/{media.length}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0"
              style={{ borderColor: activeIndex === index ? getNetworkColor(network) : 'transparent' }}
            >
              <Image src={url} alt={`${post.title} ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (activeMedia) {
    return (
      <div className={`relative bg-neutral-100 overflow-hidden ${network === 'TIKTOK' ? 'aspect-[9/16]' : network === 'FACEBOOK' ? 'aspect-[1.2/1]' : 'aspect-square'}`}>
        <Image src={activeMedia} alt={post.title} fill className="object-cover" />
        {(post.contentType === 'VIDEO' || network === 'TIKTOK') && !post.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/35 border border-white/20 flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center text-sm text-neutral-400 bg-neutral-100 ${network === 'TIKTOK' ? 'aspect-[9/16]' : network === 'FACEBOOK' ? 'aspect-[1.2/1]' : 'aspect-square'}`}>
      Sin recurso visual
    </div>
  )
}

function FacebookView({ post }: { post: SimulatorPost }) {
  const profileName = post.project.name

  return (
    <div className="rounded-[24px] overflow-hidden border" style={{ background: '#fff', borderColor: '#dfe3e8' }}>
      <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#edf0f2' }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: getNetworkColor('FACEBOOK') }}>
          {profileName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{profileName}</p>
          <p className="text-[11px] text-slate-500">Ahora mismo · Público</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-500" />
      </div>

      <div className="px-4 pt-4 pb-3 text-[15px] leading-6 text-slate-800 space-y-2">
        <p className="font-semibold text-slate-900">{post.title}</p>
        {captionLines(post.description).slice(0, 5).map((line, idx) => <p key={idx}>{line}</p>)}
      </div>

      <MediaRenderer post={post} network="FACEBOOK" />

      <div className="px-4 py-3 border-t" style={{ borderColor: '#edf0f2' }}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>237 reacciones</span>
          <span>18 comentarios · 7 compartidos</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
          <button className="py-2 rounded-lg bg-slate-50">Me gusta</button>
          <button className="py-2 rounded-lg bg-slate-50">Comentar</button>
          <button className="py-2 rounded-lg bg-slate-50">Compartir</button>
        </div>
      </div>
    </div>
  )
}

function InstagramView({ post }: { post: SimulatorPost }) {
  const profileName = post.project.name

  return (
    <div className="rounded-[28px] overflow-hidden border" style={{ background: '#fcfcfc', borderColor: '#e7e7e7' }}>
      <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: '#efefef' }}>
        <div className="w-10 h-10 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${getNetworkColor('INSTAGRAM')}, #f59e0b)` }}>
          <div className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#111' }}>
            {profileName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-900">{profileName}</p>
          <p className="text-[11px] text-neutral-500">Patrocinado</p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-neutral-500" />
      </div>

      <MediaRenderer post={post} network="INSTAGRAM" />

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3 text-neutral-900">
          <div className="flex items-center gap-4">
            <Heart className="w-5 h-5" />
            <MessageCircle className="w-5 h-5" />
            <Send className="w-5 h-5" />
          </div>
          <Bookmark className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold mb-2 text-neutral-900">1,284 Me gusta</p>
        <div className="text-sm text-neutral-800 space-y-1.5">
          <p><span className="font-semibold">{profileName}</span> {post.title}</p>
          {captionLines(post.description).slice(0, 4).map((line, idx) => <p key={idx}>{line}</p>)}
        </div>
        <p className="mt-3 text-xs uppercase tracking-wide text-neutral-400">Hace 2 minutos</p>
      </div>
    </div>
  )
}

function TikTokView({ post }: { post: SimulatorPost }) {
  const profileName = post.project.name
  const handle = `@${post.project.slug}`

  return (
    <div className="rounded-[32px] overflow-hidden border border-neutral-800 bg-[#0c0c0f] text-white">
      <div className="relative aspect-[9/16] bg-black">
        {post.imageUrl && !post.videoUrl && (
          <Image src={post.imageUrl} alt={post.title} fill className="object-cover opacity-90" />
        )}
        {!post.imageUrl && !post.videoUrl && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b2b35,transparent_55%)]" />
        )}
        {post.videoUrl ? (
          <video src={post.videoUrl} controls className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs">
          <span className="font-semibold">Siguiendo</span>
          <span className="opacity-70">Para ti</span>
        </div>
        <div className="absolute right-4 bottom-6 flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-full border border-white/20 bg-black/40 flex items-center justify-center text-sm font-bold">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <Heart className="w-7 h-7" />
          <MessageCircle className="w-7 h-7" />
          <Bookmark className="w-7 h-7" />
          <Repeat2 className="w-7 h-7" />
        </div>
        <div className="absolute left-4 bottom-5 right-20">
          <p className="text-sm font-semibold mb-2">{handle}</p>
          <p className="text-lg font-semibold leading-tight mb-2">{post.title}</p>
          <div className="space-y-1 text-sm text-white/85">
            {captionLines(post.description).slice(0, 4).map((line, idx) => <p key={idx}>{line}</p>)}
          </div>
        </div>
        {!post.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/14 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PostPreviewSimulator({
  post,
  allowedNetworks,
  initialNetwork,
}: {
  post: SimulatorPost
  allowedNetworks?: SimulatorNetwork[]
  initialNetwork?: SimulatorNetwork
}) {
  const availableNetworks = useMemo<SimulatorNetwork[]>(
    () => allowedNetworks && allowedNetworks.length > 0 ? allowedNetworks : ['FACEBOOK', 'INSTAGRAM', 'TIKTOK'],
    [allowedNetworks]
  )
  const [previewNetwork, setPreviewNetwork] = useState<SimulatorNetwork>(initialNetwork && availableNetworks.includes(initialNetwork) ? initialNetwork : availableNetworks[0])
  const [device, setDevice] = useState<SimulatorDevice>('mobile')

  useEffect(() => {
    setPreviewNetwork(initialNetwork && availableNetworks.includes(initialNetwork) ? initialNetwork : availableNetworks[0])
    setDevice('mobile')
  }, [initialNetwork, availableNetworks, post.title, post.description])

  const hashtags = post.hashtags ?? []
  const cta = post.cta?.trim()

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-[290px_minmax(0,1fr)] gap-0 rounded-[30px] overflow-hidden border" style={{ background: 'linear-gradient(180deg, #f7fbf9 0%, #edf5f1 100%)', borderColor: 'rgba(12,29,22,0.08)' }}>
        <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(12,29,22,0.08)' }}>
          <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <p className="text-xs uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--text-faint)' }}>Resumen</p>
            <div className="space-y-4 text-sm">
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Proyecto</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>{post.project.name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Vista</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableNetworks.map((network) => (
                    <button
                      key={network}
                      type="button"
                      onClick={() => setPreviewNetwork(network)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={previewNetwork === network ? {
                        background: getNetworkColor(network),
                        color: '#fff',
                      } : {
                        background: 'rgba(12,29,22,0.06)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {getNetworkLabel(network)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Dispositivo</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDevice('mobile')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                    style={device === 'mobile' ? { background: 'var(--text)', color: '#fff' } : { background: 'rgba(12,29,22,0.06)', color: 'var(--text-muted)' }}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Móvil
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice('desktop')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                    style={device === 'desktop' ? { background: 'var(--text)', color: '#fff' } : { background: 'rgba(12,29,22,0.06)', color: 'var(--text-muted)' }}
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Tipo de contenido</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>{post.contentType ?? 'Post'}</p>
              </div>
              {hashtags.length > 0 && (
                <div>
                  <p style={{ color: 'var(--text-faint)' }}>Hashtags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hashtags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,184,144,0.10)', color: 'var(--accent)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cta && (
                <div>
                  <p style={{ color: 'var(--text-faint)' }}>CTA</p>
                  <p className="mt-2 rounded-2xl px-3 py-2 text-sm font-semibold" style={{ background: 'rgba(12,29,22,0.05)', color: 'var(--text)' }}>
                    {cta}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center overflow-x-hidden">
          <DeviceFrame device={device}>
            {previewNetwork === 'INSTAGRAM' && <InstagramView post={post} />}
            {previewNetwork === 'FACEBOOK' && <FacebookView post={post} />}
            {previewNetwork === 'TIKTOK' && <TikTokView post={post} />}
          </DeviceFrame>
        </div>
      </div>
    </div>
  )
}
