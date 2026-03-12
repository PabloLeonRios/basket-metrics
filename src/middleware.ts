import { NextResponse, NextRequest } from 'next/server';

/**
 * ==========================================
 * NOTAS PARA PABLITO (BYPASS TOTAL TEMPORAL)
 * ==========================================
 *
 * Se desactiva completamente la protección por middleware
 * para poder mostrar y trabajar el frontend en producción.
 *
 * Esto es temporal para demo/rediseño.
 *
 * Cuando vuelva la auth real:
 * - restaurar lógica de JWT
 * - restaurar validación de roles
 */

export async function middleware(_request: NextRequest) {
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
