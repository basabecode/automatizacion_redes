'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

/**
 * Wrapper de client component para SessionProvider de NextAuth.
 * Necesario porque el layout raíz es un Server Component.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
