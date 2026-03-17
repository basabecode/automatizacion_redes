'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, FileText, Settings, Zap } from 'lucide-react'

const nav = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Inicio' },
  { href: '/dashboard/projects', icon: FolderOpen,      label: 'Proyectos' },
  { href: '/dashboard/posts',    icon: FileText,        label: 'Posts' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Configuración' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">ContentForge</p>
              <p className="text-xs text-gray-400 mt-0.5">Multi-proyecto</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Corriendo en localhost:3000</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  )
}
