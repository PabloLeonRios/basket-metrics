// src/app/panel/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import PlayerProfile from '@/components/players/PlayerProfile';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    // Redireccionar según el rol
    if (user.role === 'admin') {
      router.replace('/panel/admin/users');
      return;
    }
    if (user.role === 'entrenador') {
      router.replace('/panel/dashboard');
      return;
    }

    // Si es jugador, buscar su perfil
    const fetchPlayerProfile = async () => {
      try {
        const playerProfileRes = await fetch('/api/me/player-profile');
        if (!playerProfileRes.ok) throw new Error('Perfil de jugador no encontrado.');
        const { data: playerProfileData } = await playerProfileRes.json();
        setPlayerId(playerProfileData._id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'jugador') {
        fetchPlayerProfile();
    } else {
        setLoading(false);
    }
  }, [user, authLoading, router]);

  // Mostrar un loader mientras se decide a dónde redirigir o si se muestra el perfil
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo los jugadores se quedan en esta página. Si no se encuentra su perfil, se muestra un mensaje.
  return (
    <div className="space-y-6">
        {user?.role === 'jugador' && playerId ? (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Mi Perfil de Jugador</h1>
                <PlayerProfile playerId={playerId} />
            </div>
        ) : (
            <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Cargando perfil o rol no reconocido.
                </p>
            </div>
        )}
    </div>
  );
}
