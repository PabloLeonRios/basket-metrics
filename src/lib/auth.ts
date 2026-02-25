// src/lib/auth.ts
import * as jose from 'jose';
import { getJwtSecretKey } from '@/lib/auth-secret';
import { AuthUser } from '@/hooks/useAuth'; // Import the updated AuthUser interface

interface VerifyAuthResult {
  success: boolean;
  payload?: AuthUser; // Use the updated AuthUser
  message?: string;
}

export async function verifyAuth(
  token: string | undefined,
): Promise<VerifyAuthResult> {
  if (!token) {
    return { success: false, message: 'No autorizado: Sin token.' };
  }

  try {
    const secret = getJwtSecretKey();
    const { payload } = await jose.jwtVerify(token, secret);

    // Aseguramos que el payload tiene la estructura esperada de AuthUser
    // Asumiendo que el JWT payload contiene _id, name, email, role, isActive, createdAt, updatedAt
    const authPayload: AuthUser = {
      _id: (payload._id as string) || (payload.id as string), // Changed from id to _id, with fallback for older tokens
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as AuthUser['role'], // Use specific role type
      isActive: payload.isActive as boolean, // Added isActive
      team: payload.team as AuthUser['team'],
      createdAt: payload.createdAt as string, // Added createdAt
      updatedAt: payload.updatedAt as string, // Added updatedAt
    };

    return { success: true, payload: authPayload };
  } catch {
    // Esto captura errores de verificación (token expirado, firma inválida, etc.)
    return {
      success: false,
      message: 'No autorizado: Token inválido o expirado.',
    };
  }
}
