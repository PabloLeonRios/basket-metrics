// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const { data } = await response.json();
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
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

  return { user, loading, error, isAuthenticated: !!user };
}
