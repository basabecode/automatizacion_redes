import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import crypto from 'crypto'

/** Timing-safe string comparison to prevent timing attacks */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const adminEmail    = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        if (!adminEmail || !adminPassword) return null

        const emailOk    = safeEqual(String(credentials.email),    adminEmail)
        const passwordOk = safeEqual(String(credentials.password), adminPassword)

        if (emailOk && passwordOk) {
          return { id: '1', name: 'Admin', email: adminEmail }
        }
        return null
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8 horas
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
})
