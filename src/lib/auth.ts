// src/lib/auth.ts
import { NextRequest } from 'next/server';
import * as jose from 'jose';

/**
 * Verifica el token JWT de la solicitud y devuelve el payload si es válido.
 * @param request La solicitud entrante de Next.js.
 * @returns El payload del token o null si no es válido.
 */
export async function getAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return { payload: null, error: 'No token found' };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }
    const { payload } = await jose.jwtVerify(token, secret);
    return { payload, error: null };
  } catch (e) {
    return { payload: null, error: 'Invalid token' };
  }
}
