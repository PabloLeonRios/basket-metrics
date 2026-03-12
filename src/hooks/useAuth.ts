// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { ITeam } from '@/types/definitions';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'entrenador' | 'jugador' | 'admin';
  isActive: boolean;
  team?: ITeam & { logoUrl?: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * ==========================================
 * NOTAS PARA PABLITO (BYPASS LOGIN TEMPORAL)
 * ==========================================
 *
 * Este hook permite entrar sin auth real cuando la variable:
 * NEXT_PUBLIC_BYPASS_LOGIN === 'true'
 *
 * Uso:
 * - demos
 * - rediseño frontend
 * - pruebas en Vercel sin depender del backend/auth real
 *
 * Cuando se quite la demo:
 * - poner NEXT_PUBLIC_BYPASS_LOGIN=false
 * - o borrar esta lógica
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (BYPASS_LOGIN) {
      setUser(DEV_USER);
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');

        if (response.ok) {
          const { data } = await response.json();

          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
            team: data.team,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Error al cargar la sesión.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
}
