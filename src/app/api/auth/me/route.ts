// src/app/api/auth/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autorizado: Sin token.' },
        { status: 401 },
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error('La clave secreta JWT_SECRET no está configurada.');
    }

    // Verificar el token y devolver el payload
    const { payload } = await jose.jwtVerify(token, secret);

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    // Si el token es inválido, devolver no autorizado
    return NextResponse.json(
      { success: false, message: 'No autorizado: Token inválido.' },
      { status: 401 },
    );
  }
}
