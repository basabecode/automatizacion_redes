import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './session-provider'

export const metadata: Metadata = {
  title: 'Yetzar — Content Studio con IA',
  description: 'Genera, programa y publica contenido de alto impacto en todas tus redes con inteligencia artificial.',
  icons: {
    icon: [
      { url: '/logo/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: { url: '/logo/favicon-180.png', sizes: '180x180', type: 'image/png' },
    other: [{ rel: 'icon', url: '/logo/favicon-512.png', sizes: '512x512', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
