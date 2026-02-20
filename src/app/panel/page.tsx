// src/app/panel/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlayerProfile from '@/components/players/PlayerProfile';

interface User {
  id: string;
  name: string;
  role: string;
}

// Un componente simple para el dashboard del entrenador
const CoachDashboard = () => (
  <div className="space-y-4">
    <p>Selecciona una opción para empezar a gestionar tu equipo.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link
        href="/panel/players"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Gestionar Jugadores</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Añade o edita los perfiles de tus jugadores.
        </p>
      </Link>
      <Link
        href="/panel/sessions"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Gestionar Sesiones</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Crea partidos o entrenamientos.
        </p>
      </Link>
      <Link
        href="/panel/assistant"
        className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <h2 className="text-xl font-bold">Asistente de IA</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Obtén recomendaciones de quintetos.
        </p>
      </Link>
    </div>
  </div>
);

export default function PanelPage() {
  const [user, setUser] = useState<User | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Obtener el usuario actual
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('No autenticado');
        const { data: userData } = await userRes.json();
        setUser(userData);

        // 2. Si es un jugador, obtener su perfil de jugador
        if (userData.role === 'jugador') {
          const playerProfileRes = await fetch('/api/me/player-profile');
          if (!playerProfileRes.ok)
            throw new Error('Perfil de jugador no encontrado.');
          const { data: playerProfileData } = await playerProfileRes.json();
          setPlayerId(playerProfileData._id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-red-500 font-bold">Error al cargar el perfil.</p>
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Ir al Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">
                Basket Metrics
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Hola, <span className="font-bold">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Renderizar el dashboard correspondiente */}
        {user.role === 'entrenador' ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Panel de Entrenador
            </h1>
            <CoachDashboard />
          </div>
        ) : user.role === 'jugador' && playerId ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Mi Perfil de Jugador
            </h1>
            <PlayerProfile playerId={playerId} />
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Rol de usuario no reconocido o perfil no encontrado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
