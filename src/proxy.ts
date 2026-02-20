// src/proxy.ts
import { NextResponse, NextRequest } from 'next/server';
import * as jose from 'jose';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Proxy (Middleware) para proteger las rutas de la aplicación según el rol del usuario
 * e implementar limitación de tasa (Rate Limiting).
 * En Next.js 16+, si se detecta tanto middleware.ts como proxy.ts, se prefiere proxy.ts.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Definir rutas con Rate Limiting (Protección contra fuerza bruta y spam)
  const isRateLimitedRoute =
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/admin');

  if (isRateLimitedRoute) {
    // Obtenemos la IP de los headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    // Límite: 10 peticiones por minuto
    const { success } = rateLimit(ip, 10, 60 * 1000);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo en un minuto.',
        },
        { status: 429 },
      );
    }
  }

  // 2. Definir rutas protegidas por autenticación/rol
  const isProtectedRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/panel');
  const isApiAdminRoute = pathname.startsWith('/api/admin');

  if (isProtectedRoute || isApiAdminRoute) {
    if (!token) {
      // Si no hay token, redirigir al login (o error 401 para APIs)
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, message: 'No autorizado: Sin token.' },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      if (!secret) throw new Error('JWT_SECRET not configured');

      const { payload } = await jose.jwtVerify(token, secret);

      // 3. Verificación de roles para rutas de Admin
      if (
        (pathname.startsWith('/admin') || isApiAdminRoute) &&
        payload.role !== 'admin'
      ) {
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { success: false, message: 'Acceso denegado: Se requiere rol de Admin.' },
            { status: 403 },
          );
        }
        return NextResponse.redirect(new URL('/panel', request.url));
      }

      // 4. Verificación de roles para rutas de Panel (Entrenador/Jugador)
      if (
        pathname.startsWith('/panel') &&
        payload.role !== 'entrenador' &&
        payload.role !== 'jugador'
      ) {
        // Si un admin intenta entrar a /panel, lo enviamos a /admin
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (e) {
      // Si el token es inválido, redirigir al login
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, message: 'No autorizado: Token inválido.' },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Configuración del Matcher para especificar sobre qué rutas debe actuar el proxy.
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/panel/:path*',
    '/api/admin/:path*',
    '/api/auth/login',
    '/api/auth/register',
  ],
};
