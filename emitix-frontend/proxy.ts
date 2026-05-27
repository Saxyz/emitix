import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy de protección de rutas (reemplaza middleware.ts en Next.js 16).
 *
 * Rutas públicas: /, /register, /forgot-password
 * Rutas protegidas: todo lo que esté bajo /(dashboard)/
 *
 * El token JWT se almacena en localStorage (solo cliente).
 * El proxy no puede acceder a localStorage directamente,
 * por eso usamos una cookie de sesión ligera que el AuthContext
 * sincroniza al hacer login/logout.
 *
 * Estrategia: si no existe la cookie "emitix_session" → redirigir a /
 */

const PUBLIC_PATHS = ['/', '/register', '/forgot-password', '/terminos', '/privacidad']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Dejar pasar rutas públicas y assets de Next.js
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verificar cookie de sesión (sincronizada por AuthContext)
  const sessionCookie = request.cookies.get('emitix_session')

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica el proxy a todas las rutas excepto:
     * - archivos estáticos (_next/static, _next/image, favicon, etc.)
     * - rutas de API internas de Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
