// src/app/panel/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PlayerProfile from '@/components/players/PlayerProfile';
import { useEffect, useState } from 'react';

// Un componente simple para el dashboard del entrenador
const CoachDashboard = () => (
  <div className="space-y-4">
    <p className="text-lg text-gray-600 dark:text-gray-400">Selecciona una opción para empezar a gestionar tu equipo.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link href="/panel/players" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-bold">Gestionar Jugadores</h2>
        <p className="text-gray-600 dark:text-gray-400">Añade o edita los perfiles de tus jugadores.</p>
      </Link>
      <Link href="/panel/sessions" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-bold">Gestionar Sesiones</h2>
        <p className="text-gray-600 dark:text-gray-400">Crea partidos o entrenamientos.</p>
      </Link>
      <Link href="/panel/assistant" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-bold">Asistente de IA</h2>
        <p className="text-gray-600 dark:text-gray-400">Obtén recomendaciones de quintetos.</p>
      </Link>
    </div>
  </div>
);

// Dashboard para el Admin
const AdminDashboard = () => (
    <div className="space-y-4">
      <p className="text-lg text-gray-600 dark:text-gray-400">Selecciona una opción para administrar el sistema.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/panel/admin/users" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold">Gestionar Usuarios</h2>
          <p className="text-gray-600 dark:text-gray-400">Activa cuentas y asigna roles o equipos.</p>
        </Link>
        <Link href="/panel/admin/teams" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold">Gestionar Equipos</h2>
          <p className="text-gray-600 dark:text-gray-400">Crea y edita los equipos de la plataforma.</p>
        </Link>
      </div>
    </div>
  );

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerProfile = async () => {
      if (user?.role !== 'jugador') {
        setLoading(false);
        return;
      };
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

    if (!authLoading && user) {
        fetchPlayerProfile();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {user?.role === 'admin' && (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Panel de Administrador</h1>
                <AdminDashboard />
            </div>
        )}
        {user?.role === 'entrenador' && (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Panel de Entrenador</h1>
                <CoachDashboard />
            </div>
        )}
        {user?.role === 'jugador' && playerId && (
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Mi Perfil de Jugador</h1>
                <PlayerProfile playerId={playerId} />
            </div>
        )}
    </div>
  );
}
