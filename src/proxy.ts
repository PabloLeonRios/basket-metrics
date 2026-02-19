// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { JWT_SECRET, COOKIE_NAME, ROLES } from './lib/constants';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Si no hay token y se intenta acceder a una ruta protegida, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verificar el JWT usando la constante
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    // Lógica de autorización por rol
    const userRole = payload.role as string;

    // Si un no-admin intenta acceder a /admin, redirigir
    if (pathname.startsWith('/admin') && userRole !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL('/panel', request.url)); // O a una página de "acceso denegado"
    }

    // Si un admin accede a /login o /register, y ya está logueado, redirigir a su panel
    if (
      userRole === ROLES.ADMIN &&
      (pathname === '/login' || pathname === '/register')
    ) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Si un usuario normal accede a /login o /register y ya está logueado, redirigir a su panel
    if (
      userRole !== ROLES.ADMIN &&
      (pathname === '/login' || pathname === '/register')
    ) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Si el token es inválido (expirado, malformado, etc.), redirigir a login
    console.error('Error de verificación de token:', error);
    // Borramos la cookie inválida
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

// Configuración del Matcher: Rutas en las que se aplicará el middleware
export const config = {
  matcher: ['/panel/:path*', '/admin/:path*'],
};
