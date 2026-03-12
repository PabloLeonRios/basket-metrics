import { NextResponse, NextRequest } from 'next/server';
import * as jose from 'jose';
import { rateLimit } from '@/lib/rateLimit';
import { getJwtSecretKey } from '@/lib/auth-secret';
import { COOKIE_NAME, ROLES } from '@/lib/constants';

/**
 * ==========================================
 * NOTAS PARA PABLITO (BYPASS LOGIN TEMPORAL)
 * ==========================================
 *
 * Si NEXT_PUBLIC_BYPASS_LOGIN === 'true', se libera el acceso
 * a rutas protegidas para demo/rediseño.
 *
 * Esto es temporal. Para volver al comportamiento real:
 * - poner la variable en false
 * - redeployar
 */

const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_LOGIN === 'true';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (BYPASS_LOGIN) {
    return NextResponse.next();
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin =
      request.headers.get('origin') || request.headers.get('referer');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, message: 'Invalid origin (CSRF protection)' },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid origin format (CSRF protection)',
          },
          { status: 400 },
        );
      }
    }
  }

  const isRateLimitedRoute =
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/admin');

  if (isRateLimitedRoute) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

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

  const isPanelRoute = pathname.startsWith('/panel');
  const isAdminRoute = pathname.startsWith('/admin');
  const isApiAdminRoute = pathname.startsWith('/api/admin');

  if (isPanelRoute || isAdminRoute || isApiAdminRoute) {
    if (!token) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, message: 'No autorizado: Sin token.' },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = getJwtSecretKey();
      const { payload } = await jose.jwtVerify(token, secret);

      if (isAdminRoute || isApiAdminRoute) {
        if (payload.role !== ROLES.ADMIN) {
          if (pathname.startsWith('/api')) {
            return NextResponse.json(
              {
                success: false,
                message: 'Acceso denegado: Se requiere rol de Admin.',
              },
              { status: 403 },
            );
          }
          return NextResponse.redirect(new URL('/panel', request.url));
        }

        if (pathname === '/admin') {
          return NextResponse.redirect(
            new URL('/panel/admin/users', request.url),
          );
        }
      }

      if (isPanelRoute) {
        const allowedRoles = [ROLES.COACH, ROLES.PLAYER, ROLES.ADMIN];
        const userRole = payload.role as (typeof ROLES)[keyof typeof ROLES];
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } catch {
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

export const config = {
  matcher: [
    '/panel/:path*',
    '/admin/:path*',
    '/api/auth/login',
    '/api/auth/register',
    '/api/admin/:path*',
  ],
};
