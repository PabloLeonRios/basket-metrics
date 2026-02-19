// src/app/api/auth/logout/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Para cerrar sesión, creamos una respuesta y eliminamos la cookie en ella.
    const response = NextResponse.json(
      { success: true, message: 'Sesión cerrada exitosamente.' },
      { status: 200 },
    );
    response.cookies.delete('token');
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
