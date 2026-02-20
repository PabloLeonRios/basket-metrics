
// src/lib/auth.ts
import * as jose from 'jose';
import { JWT_SECRET } from '@/lib/constants';
import { AuthUser } from '@/hooks/useAuth';

interface VerifyAuthResult {
    success: boolean;
    payload?: AuthUser;
    message?: string;
}

export async function verifyAuth(token: string | undefined): Promise<VerifyAuthResult> {
    if (!token) {
        return { success: false, message: 'No autorizado: Sin token.' };
    }

    try {
        if (!JWT_SECRET) {
            throw new Error('La clave secreta JWT_SECRET no está configurada.');
        }

        const { payload } = await jose.jwtVerify(token, JWT_SECRET);

        // Aseguramos que el payload tiene la estructura esperada de AuthUser
        const authPayload: AuthUser = {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as string,
        };
        
        return { success: true, payload: authPayload };

    } catch {
        // Esto captura errores de verificación (token expirado, firma inválida, etc.)
        return { success: false, message: 'No autorizado: Token inválido o expirado.' };
    }
}
