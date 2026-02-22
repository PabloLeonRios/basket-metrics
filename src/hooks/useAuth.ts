// src/hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { ITeam } from '@/types/definitions';

// Updated AuthUser to match IUser more closely for Sidebar compatibility
export interface AuthUser {
  _id: string; // Renamed from 'id' to '_id'
  name: string;
  email: string;
  role: 'entrenador' | 'jugador' | 'admin'; // More specific role type
  isActive: boolean; // Added isActive
  team?: ITeam;
  createdAt: string; // Added createdAt
  updatedAt: string; // Added updatedAt
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
            _id: data._id, // Renamed from 'id'
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive, // Added isActive
            team: data.team,
            createdAt: data.createdAt, // Added createdAt
            updatedAt: data.updatedAt, // Added updatedAt
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
