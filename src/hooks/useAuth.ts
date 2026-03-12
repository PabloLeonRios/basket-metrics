// src/lib/auth.ts
import * as jose from 'jose';
import { getJwtSecretKey } from '@/lib/auth-secret';
import { AuthUser } from '@/hooks/useAuth';

interface VerifyAuthResult {
  success: boolean;
  payload?: AuthUser;
  message?: string;
}

/**
 * ==========================================
 * NOTAS PARA PABLITO (BYPASS LOGIN TEMPORAL)
 * ==========================================
 *
 * verifyAuth devuelve un usuario demo cuando:
 * NEXT_PUBLIC_BYPASS_LOGIN === 'true'
 *
 * Esto permite que rutas API protegidas sigan respondiendo
 * en entorno demo/preview/producción temporal sin JWT real.
 */

const BYPASS_LOGIN = process.env.NEXT_PUBLIC_BYPASS_LOGIN === 'true';

const DEV_USER: AuthUser = {
  _id: 'demo-entrenador',
  name: 'Pablo Dev',
  email: 'demo@basketmetrics.com',
  role: 'entrenador',
  isActive: true,
  team: {
    _id: 'demo-team',
    name: 'Dev Team',
    logoUrl: '',
  } as AuthUser['team'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function verifyAuth(
  token: string | undefined,
): Promise<VerifyAuthResult> {
  if (BYPASS_LOGIN) {
    return {
      success: true,
      payload: DEV_USER,
    };
  }

  if (!token) {
    return {
      success: false,
      message: 'No autorizado: Sin token.',
    };
  }

  try {
    const secret = getJwtSecretKey();
    const { payload } = await jose.jwtVerify(token, secret);

    const authPayload: AuthUser = {
      _id: (payload._id as string) || (payload.id as string),
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as AuthUser['role'],
      isActive: payload.isActive as boolean,
      team: payload.team as AuthUser['team'],
      createdAt: payload.createdAt as string,
      updatedAt: payload.updatedAt as string,
    };

    return {
      success: true,
      payload: authPayload,
    };
  } catch {
    return {
      success: false,
      message: 'No autorizado: Token inválido o expirado.',
    };
  }
}
