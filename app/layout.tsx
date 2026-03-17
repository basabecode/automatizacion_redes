import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContentForge — Generador de contenido social',
  description: 'Automatiza el contenido de tus redes sociales con IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
