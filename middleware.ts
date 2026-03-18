import { auth } from '@/lib/auth.options'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de Auth.js v5.
 * Protege todas las rutas bajo /dashboard.
 * Si no hay sesión activa, redirige a /login.
 */
export async function middleware(request: NextRequest) {
  const session = await auth()

  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
