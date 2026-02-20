import { NextResponse, NextRequest } from 'next/server';
import * as jose from 'jose';
import { rateLimit } from '@/lib/rateLimit';
import { getJwtSecretKey } from '@/lib/auth-secret';
import { COOKIE_NAME, ROLES } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting
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

  // 2. Protected Routes Logic
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

      // 3. Admin Route Logic
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

        // Redirect /admin to /panel/admin/users
        if (pathname === '/admin') {
          return NextResponse.redirect(
            new URL('/panel/admin/users', request.url),
          );
        }
      }

      // 4. Panel Route Logic
      if (isPanelRoute) {
        const allowedRoles = [ROLES.COACH, ROLES.PLAYER, ROLES.ADMIN];
        const userRole = payload.role as typeof ROLES[keyof typeof ROLES];
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
